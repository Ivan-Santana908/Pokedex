import express from 'express'
import pokemonController from '../controllers/pokemonController.js'

const router = express.Router()

// GET /api/pokemon - Lista de pokémon con paginación
router.get('/', pokemonController.getList.bind(pokemonController))

// GET /api/pokemon/all - Obtener todos los pokémon
router.get('/all', pokemonController.getAll.bind(pokemonController))

// GET /api/pokemon/types - Obtener tipos
router.get('/types', pokemonController.getTypes.bind(pokemonController))

// GET /api/pokemon/search?query=pikachu - Buscar pokémon
router.get('/search', pokemonController.search.bind(pokemonController))

// GET /api/pokemon/type/:type - Pokémon por tipo
router.get('/type/:type', pokemonController.getByType.bind(pokemonController))

// GET /api/pokemon/:nameOrId - Detalles de un pokémon específico
router.get('/:nameOrId', pokemonController.getDetails.bind(pokemonController))

export default router
