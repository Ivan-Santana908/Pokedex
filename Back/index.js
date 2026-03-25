import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
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
const PORT = process.env.PORT || 3000

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Aceptar requests sin origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true)
    
    // Aceptar cualquier localhost
    if (origin.includes('localhost')) {
      return callback(null, true)
    }
    
    // Aceptar CORS_ORIGIN específico si está configurado
    if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
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

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
      console.log(`CORS origin: ${process.env.CORS_ORIGIN || '*'}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  })
