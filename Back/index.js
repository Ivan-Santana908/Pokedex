import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import pokemonRoutes from './src/routes/pokemonRoutes.js'
import authRoutes from './src/routes/authRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import friendRoutes from './src/routes/friendRoutes.js'
import teamRoutes from './src/routes/teamRoutes.js'
import battleRoutes from './src/routes/battleRoutes.js'
import pushRoutes from './src/routes/pushRoutes.js'
import notificationRoutes from './src/routes/notificationRoutes.js'
import errorHandler from './src/middleware/errorHandler.js'
import { connectDB } from './src/config/db.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
const PORT = process.env.PORT || 3000

// WebSocket battle rooms store
const battleRooms = new Map()

function normalizeOrigin(value) {
  return String(value || '')
    .replace(/^['\"]|['\"]$/g, '')
    .replace(/\/$/, '')
    .trim()
}

function parseAllowedOrigins() {
  const raw = String(process.env.CORS_ORIGIN || '')
  if (!raw) return []
  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)
}

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Aceptar requests sin origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true)
    const normalizedOrigin = normalizeOrigin(origin)
    const allowedOrigins = parseAllowedOrigins()
    
    // Aceptar cualquier localhost
    if (normalizedOrigin.includes('localhost')) {
      return callback(null, true)
    }

    // Aceptar dominios de Railway (frontend desplegado)
    if (normalizedOrigin.endsWith('.railway.app')) {
      return callback(null, true)
    }
    
    // Aceptar CORS_ORIGIN específico (soporta uno o varios separados por coma)
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true)
    }
    
    // Rechazar otros origins
    callback(new Error('CORS not allowed'))
  },
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware para pasar io a los controladores
app.use((req, res, next) => {
  req.io = io
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Routes
app.use('/api/pokemon', pokemonRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/battles', battleRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/notifications', notificationRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Error handler
app.use(errorHandler)

// WebSocket event handlers
io.on('connection', (socket) => {
  console.log('WebSocket client connected:', socket.id)

  // Batalla en vivo: unirse a sala de batalla
  socket.on('join-battle', (battleId, userId) => {
    const roomId = `battle-${battleId}`
    socket.join(roomId)
    battleRooms.set(roomId, { battleId, players: new Set([...battleRooms.get(roomId)?.players || [], userId]) })
    console.log(`Player ${userId} joined battle room ${roomId}`)
  })

  // Batalla en vivo: turno jugado
  socket.on('play-turn', (battleId, turnData) => {
    const roomId = `battle-${battleId}`
    io.to(roomId).emit('turn-update', turnData)
    console.log(`Turn played in battle ${battleId}:`, turnData.message)
  })

  // Batalla en vivo: estado actualizado
  socket.on('battle-state-update', (battleId, battleState) => {
    const roomId = `battle-${battleId}`
    io.to(roomId).emit('state-changed', battleState)
  })

  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected:', socket.id)
  })
})

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
      console.log(`WebSocket server ready`)
      console.log(`CORS origin: ${process.env.CORS_ORIGIN || '*'}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  })
