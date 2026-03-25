import { getCachedData } from '../utils/pokeApiClient.js'

export class PokemonService {
  async getPokemonList(offset = 0, limit = 20) {
    const data = await getCachedData(`/pokemon?offset=${offset}&limit=${limit}`)
    return data
  }

  async getPokemonDetails(nameOrId) {
    const data = await getCachedData(`/pokemon/${nameOrId}`)
    return data
  }

  async getAllPokemon(limit = 100000) {
    const data = await getCachedData(`/pokemon?limit=${limit}`)
    return data.results
  }

  async getPokemonTypes() {
    const data = await getCachedData('/type')
    return data.results
  }

  async getPokemonByType(typeName) {
    const data = await getCachedData(`/type/${typeName}`)
    return data
  }

  async searchPokemon(query) {
    try {
      // Intentar búsqueda exacta
      return await this.getPokemonDetails(query.toLowerCase())
    } catch (error) {
      // Si falla, buscar en la lista completa
      const allPokemon = await this.getAllPokemon()
      const results = allPokemon.filter(p => 
        p.name.includes(query.toLowerCase())
      )
      
      if (results.length === 0) {
        throw new Error(`Pokémon "${query}" no encontrado`)
      }
      
      // Retornar detalles del primer resultado
      return await this.getPokemonDetails(results[0].name)
    }
  }

  async getMultiplePokemon(namesOrIds) {
    const promises = namesOrIds.map(id => 
      this.getPokemonDetails(id).catch(() => null)
    )
    return Promise.all(promises)
  }

  // Calcular similitud de Levenshtein
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
  }

  // Encontrar sugerencia más cercana
  async findClosestMatch(query) {
    try {
      const allPokemon = await this.getAllPokemon()
      const queryLower = query.toLowerCase()
      
      // Primero buscar por substring
      const substringMatches = allPokemon.filter(p => 
        p.name.includes(queryLower)
      )
      
      if (substringMatches.length > 0) {
        substringMatches.sort((a, b) => a.name.length - b.name.length)
        return substringMatches[0].name
      }
      
      // Usar Levenshtein como fallback
      const matches = allPokemon.map(p => ({
        name: p.name,
        distance: this.calculateSimilarity(queryLower, p.name.toLowerCase())
      }))
      
      matches.sort((a, b) => a.distance - b.distance)
      
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
  }
}

export default new PokemonService()
