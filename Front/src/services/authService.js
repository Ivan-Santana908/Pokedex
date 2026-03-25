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

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export async function me(token) {
  const { data } = await api.get('/auth/me', authHeaders(token))
  return data
}

export default {
  register,
  login,
  me,
}
