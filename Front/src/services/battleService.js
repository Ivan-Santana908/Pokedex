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

export async function listRequests(token) {
  const { data } = await api.get('/battles/requests', authHeaders(token))
  return data
}

export async function listHistory(token) {
  const { data } = await api.get('/battles', authHeaders(token))
  return data
}

export async function sendRequest(token, opponentUid, challengerTeamId) {
  const { data } = await api.post(
    '/battles/requests',
    { opponentUid, challengerTeamId },
    authHeaders(token)
  )
  return data
}

export async function respondRequest(token, battleId, action, opponentTeamId) {
  const payload = { action }
  if (opponentTeamId) payload.opponentTeamId = opponentTeamId

  const { data } = await api.post(
    `/battles/requests/${battleId}/respond`,
    payload,
    authHeaders(token)
  )
  return data
}

export async function simulateBattle(token, battleId) {
  const { data } = await api.post(`/battles/${battleId}/simulate`, {}, authHeaders(token))
  return data
}

export default {
  listRequests,
  listHistory,
  sendRequest,
  respondRequest,
  simulateBattle,
}
