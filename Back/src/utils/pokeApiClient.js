import axios from 'axios'

const API_BASE_URL = process.env.API_URL || 'https://pokeapi.co/api/v2'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Caché simple
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function getCachedData(url) {
  const cacheKey = url
  const cached = cache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Datos obtenidos del caché: ${url}`)
    return cached.data
  }
  
  try {
    const response = await client.get(url)
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message)
    throw new Error(`Error al obtener datos de PokeAPI: ${error.message}`)
  }
}

export function clearCache() {
  cache.clear()
  console.log('🗑️ Caché limpiado')
}

export default { getCachedData, clearCache }
