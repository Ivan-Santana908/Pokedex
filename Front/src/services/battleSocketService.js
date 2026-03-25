import io from 'socket.io-client'
import { getBackendUrl } from './apiBaseUrl'

let socket = null

export const battleSocketService = {
  // Conectar al servidor WebSocket
  connect() {
    if (socket && socket.connected) return socket

    const baseUrl = getBackendUrl()
    const socketUrl = baseUrl.replace('/api', '')

    socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
    })

    return socket
  },

  // Desconectar del servidor WebSocket
  disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  },

  // Unirse a una sala de batalla
  joinBattle(battleId, userId) {
    if (!socket) this.connect()
    socket.emit('join-battle', battleId, userId)
  },

  // Salir de una sala de batalla
  leaveBattle(battleId) {
    if (!socket) return
    const roomId = `battle-${battleId}`
    socket.emit('leave-battle', roomId)
  },

  // Notificar cuando se juega un turno
  notifyTurn(battleId, turnData) {
    if (!socket) this.connect()
    socket.emit('play-turn', battleId, turnData)
  },

  // Notificar cambio de estado de batalla
  notifyStateUpdate(battleId, battleState) {
    if (!socket) this.connect()
    socket.emit('battle-state-update', battleId, battleState)
  },

  // Notificar nueva solicitud de batalla
  notifyNewRequest(challengerId, challengerName) {
    if (!socket) this.connect()
    socket.emit('new-battle-request', { challengerId, challengerName })
  },

  // Escuchar actualizaciones de turno
  onTurnUpdate(callback) {
    if (!socket) this.connect()
    socket.on('turn-update', (payload) => {
      callback(payload)
    })
  },

  // Escuchar cambios de estado
  onStateChanged(callback) {
    if (!socket) this.connect()
    socket.on('state-changed', (payload) => {
      callback(payload)
    })
  },

  // Escuchar nuevas solicitudes de batalla
  onNewRequest(callback) {
    if (!socket) this.connect()
    socket.on('new-battle-request', (payload) => {
      callback(payload)
    })
  },

  // Remover listener de turno
  offTurnUpdate() {
    if (socket) socket.off('turn-update')
  },

  // Remover listener de estado
  offStateChanged() {
    if (socket) socket.off('state-changed')
  },

  // Remover listener de solicitudes
  offNewRequest() {
    if (socket) socket.off('new-battle-request')
  },

  // Obtener instance de socket
  getInstance() {
    return socket
  }
}

export default battleSocketService
