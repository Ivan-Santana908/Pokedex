import pokemonService from '../services/pokemonService.js'

export class PokemonController {
  async getList(req, res, next) {
    try {
      const offset = parseInt(req.query.offset) || 0
      const limit = parseInt(req.query.limit) || 20
      
      const data = await pokemonService.getPokemonList(offset, limit)
      res.json(data)
    } catch (error) {
      next(error)
    }
  }

  async getDetails(req, res, next) {
    try {
      const { nameOrId } = req.params
      const data = await pokemonService.getPokemonDetails(nameOrId)
      res.json(data)
    } catch (error) {
      next(error)
    }
  }

  async search(req, res, next) {
    try {
      const { query } = req.query
      
      if (!query) {
        return res.status(400).json({ 
          error: 'El parámetro "query" es requerido' 
        })
      }
      
      // Intentar búsqueda exacta o por substring
      const results = await pokemonService.searchPokemon(query)
      
      res.json({
        results: [results],
        count: 1
      })
    } catch (error) {
      try {
        // Si la búsqueda falla, sugerir alternativa
        const suggestion = await pokemonService.findClosestMatch(query)
        
        if (suggestion) {
          const suggestedPokemon = await pokemonService.getPokemonDetails(suggestion)
          return res.json({
            results: [suggestedPokemon],
            suggestion: suggestion,
            message: `No se encontró "${query}". ¿Quisiste decir "${suggestion}"?`,
            count: 1
          })
        }
      } catch (innerError) {
        console.error('Error en búsqueda con sugerencia:', innerError)
      }
      
      res.status(404).json({
        error: `Pokémon "${query}" no encontrado`,
        count: 0
      })
    }
  }

  async getByType(req, res, next) {
    try {
      const { type } = req.params
      const data = await pokemonService.getPokemonByType(type)
      res.json(data)
    } catch (error) {
      next(error)
    }
  }

  async getTypes(req, res, next) {
    try {
      const types = await pokemonService.getPokemonTypes()
      res.json({ results: types, count: types.length })
    } catch (error) {
      next(error)
    }
  }

  async getAll(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100000
      const allPokemon = await pokemonService.getAllPokemon(limit)
      res.json({
        results: allPokemon,
        count: allPokemon.length
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new PokemonController()
