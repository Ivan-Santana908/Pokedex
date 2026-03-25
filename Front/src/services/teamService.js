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

export async function listTeams(token) {
  const { data } = await api.get('/teams', authHeaders(token))
  return data
}

export async function createTeam(token, payload) {
  const { data } = await api.post('/teams', payload, authHeaders(token))
  return data
}

export async function updateTeam(token, teamId, payload) {
  const { data } = await api.put(`/teams/${teamId}`, payload, authHeaders(token))
  return data
}

export async function deleteTeam(token, teamId) {
  const { data } = await api.delete(`/teams/${teamId}`, authHeaders(token))
  return data
}

export async function setActiveTeam(token, teamId) {
  const { data } = await api.post(`/teams/${teamId}/active`, {}, authHeaders(token))
  return data
}

export default {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  setActiveTeam,
}
