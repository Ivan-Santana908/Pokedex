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

export async function listFavorites(token) {
  const { data } = await api.get('/favorites', authHeaders(token))
  return data
}

export async function addFavorite(token, pokemon) {
  const pokemonId = Number(pokemon?.id || 0)
  const pokemonName = String(pokemon?.name || '').trim().toLowerCase()
  const imageUrl =
    pokemon?.sprites?.other?.['official-artwork']?.front_default ||
    pokemon?.sprites?.front_default ||
    ''
  const types = Array.isArray(pokemon?.types)
    ? pokemon.types.map((item) => String(item?.type?.name || '').trim().toLowerCase()).filter(Boolean)
    : []

  const { data } = await api.post(
    `/favorites/${pokemonId}`,
    { pokemonName, imageUrl, types },
    authHeaders(token)
  )

  return data
}

export async function removeFavorite(token, pokemonId) {
  const { data } = await api.delete(`/favorites/${pokemonId}`, authHeaders(token))
  return data
}

export default {
  listFavorites,
  addFavorite,
  removeFavorite,
}
