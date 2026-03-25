import axios from 'axios'
import { getBackendUrl } from './apiBaseUrl'

const BACKEND_URL = getBackendUrl()

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

export async function getFriends(token) {
  const { data } = await api.get('/friends', authHeaders(token))
  return data
}

export async function getFriendRequests(token) {
  const { data } = await api.get('/friends/requests', authHeaders(token))
  return data
}

export async function sendFriendRequest(token, toUid) {
  const { data } = await api.post('/friends/requests', { toUid }, authHeaders(token))
  return data
}

export async function respondFriendRequest(token, requestId, action) {
  const { data } = await api.post(
    `/friends/requests/${requestId}/respond`,
    { action },
    authHeaders(token)
  )
  return data
}

export default {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondFriendRequest,
}
