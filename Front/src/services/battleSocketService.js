import io from 'socket.io-client'
import { getBackendUrl } from './apiBaseUrl'

let socket = null
let battleRefreshCallback = null
let requestRefreshCallback = null

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

  // Registrar callback para refrescar batalla cuando se reciba actualización
  onBattleRefresh(callback) {
    battleRefreshCallback = callback
  },

  // Registrar callback para refrescar solicitudes cuando se reciba actualización
  onRequestRefresh(callback) {
    requestRefreshCallback = callback
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
    socket.on('turn-update', () => {
      callback()
      // Auto-refrescar batalla cuando hay actualización de turno
      if (battleRefreshCallback) {
        setTimeout(() => battleRefreshCallback(), 100)
      }
    })
  },

  // Escuchar cambios de estado
  onStateChanged(callback) {
    if (!socket) this.connect()
    socket.on('state-changed', () => {
      callback()
      // Auto-refrescar batalla cuando hay cambio de estado
      if (battleRefreshCallback) {
        setTimeout(() => battleRefreshCallback(), 100)
      }
    })
  },

  // Escuchar nuevas solicitudes de batalla
  onNewRequest(callback) {
    if (!socket) this.connect()
    socket.on('new-battle-request', () => {
      callback()
      // Auto-refrescar solicitudes cuando hay una nueva
      if (requestRefreshCallback) {
        setTimeout(() => requestRefreshCallback(), 100)
      }
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
