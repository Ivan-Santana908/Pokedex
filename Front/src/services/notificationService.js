import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
})

function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

export async function listNotifications(token) {
  const { data } = await api.get('/notifications', authHeaders(token))
  return data
}

export async function markNotificationAsRead(token, notificationId) {
  const { data } = await api.post(`/notifications/${notificationId}/read`, {}, authHeaders(token))
  return data
}

export default {
  listNotifications,
  markNotificationAsRead,
}
