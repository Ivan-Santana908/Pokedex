import axios from 'axios'
import { getBackendUrl } from './apiBaseUrl'
import * as indexedDb from './indexedDbService'

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

function buildOfflinePokemonSnapshot(pokemon) {
  const pokemonId = Number(pokemon?.id || 0)
  const pokemonName = String(pokemon?.name || '').trim().toLowerCase()
  const imageUrl =
    pokemon?.sprites?.other?.['official-artwork']?.front_default ||
    pokemon?.sprites?.front_default ||
    ''
  const types = Array.isArray(pokemon?.types)
    ? pokemon.types
        .map((item) => String(item?.type?.name || '').trim().toLowerCase())
        .filter(Boolean)
    : []

  // Solo datos planos y serializables (sin proxies reactivos)
  return {
    id: pokemonId,
    name: pokemonName,
    imageUrl,
    types,
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

  // Si no hay conexión, guardar en IndexedDB
  if (!navigator.onLine) {
    console.log(`[OFFLINE] Guardando favorito ${pokemonId} en IndexedDB`)
    const snapshot = buildOfflinePokemonSnapshot(pokemon)
    await indexedDb.savePendingChange({
      action: 'add',
      pokemonId,
      pokemon: snapshot,
    })
    return {
      success: true,
      offline: true,
      message: 'Se sincronizará cuando tengas conexión',
      pokemonId,
    }
  }

  // Si hay conexión, hacer la llamada normal
  const { data } = await api.post(
    `/favorites/${pokemonId}`,
    { pokemonName, imageUrl, types },
    authHeaders(token)
  )

  return data
}

export async function removeFavorite(token, pokemonId) {
  // Si no hay conexión, guardar en IndexedDB
  if (!navigator.onLine) {
    console.log(`[OFFLINE] Marcando favorito ${pokemonId} para remover en IndexedDB`)
    await indexedDb.savePendingChange({
      action: 'remove',
      pokemonId,
    })
    return {
      success: true,
      offline: true,
      message: 'Se sincronizará cuando tengas conexión',
      pokemonId,
    }
  }

  // Si hay conexión, hacer la llamada normal
  const { data } = await api.delete(`/favorites/${pokemonId}`, authHeaders(token))
  return data
}

export default {
  listFavorites,
  addFavorite,
  removeFavorite,
}
