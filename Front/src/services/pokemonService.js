import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
})

export const pokemonService = {
  // Obtener lista de pokemon con paginación
  async getPokemonList(offset = 0, limit = 20) {
    const response = await api.get('/pokemon', {
      params: { offset, limit }
    })
    return response.data
  },

  // Obtener detalles de un pokemon específico
  async getPokemonDetails(nameOrId) {
    const response = await api.get(`/pokemon/${nameOrId}`)
    return response.data
  },

  // Obtener información de tipos
  async getPokemonTypes() {
    const response = await api.get('/pokemon/types')
    return response.data
  },

  // Obtener pokemon por tipo
  async getPokemonByType(typeName) {
    const response = await api.get(`/pokemon/type/${typeName}`)
    return response.data
  },

  // Obtener todos los pokemon (para búsqueda completa)
  async getAllPokemon() {
    const response = await api.get('/pokemon/all')
    return response.data.results
  },

  // Obtener detalles de múltiples pokemon en paralelo
  async getPokemonDetailsMultiple(namesOrIds) {
    const promises = namesOrIds.map(id => this.getPokemonDetails(id))
    return Promise.all(promises)
  },

  // Buscar pokémon con sugerencias
  async searchPokemon(query) {
    const response = await api.get('/pokemon/search', {
      params: { query }
    })
    return response.data
  },

  // Calcular similitud de Levenshtein entre dos strings
  calculateSimilarity(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        )
      }
    }
    
    return track[str2.length][str1.length]
  },

  // Encontrar el Pokémon más parecido a la búsqueda
  async findClosestMatch(query) {
    try {
      const allPokemon = await this.getAllPokemon()
      const queryLower = query.toLowerCase()
      
      // Primero buscar si el query está contenido en el nombre
      const substringMatches = allPokemon.filter(p => 
        p.name.includes(queryLower)
      )
      
      if (substringMatches.length > 0) {
        // Si hay coincidencias por substring, devolver la más corta (más probable)
        substringMatches.sort((a, b) => a.name.length - b.name.length)
        return substringMatches[0].name
      }
      
      // Si no hay coincidencia de substring, usar Levenshtein
      const matches = allPokemon.map(p => ({
        name: p.name,
        distance: this.calculateSimilarity(queryLower, p.name.toLowerCase())
      }))
      
      matches.sort((a, b) => a.distance - b.distance)
      
      // Retornar el primero si:
      // 1. La distancia es pequeña (<=2 es muy similar)
      // 2. Y la similitud es buena (al menos 60% del string coincide)
      if (matches[0]) {
        const similarity = 1 - (matches[0].distance / Math.max(queryLower.length, matches[0].name.length))
        if (matches[0].distance <= 2 && similarity > 0.6) {
          return matches[0].name
        }
      }
      
      return null
    } catch (err) {
      console.error('Error finding closest match:', err)
      return null
    }
  },

  // Limpiar caché si es necesario
  clearCache() {
    // El caché se maneja en el backend
  }
}

export default pokemonService
