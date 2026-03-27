import express from 'express'
import favoriteController from '../controllers/favoriteController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', requireAuth, favoriteController.list.bind(favoriteController))
router.post('/:pokemonId', requireAuth, favoriteController.add.bind(favoriteController))
router.delete('/:pokemonId', requireAuth, favoriteController.remove.bind(favoriteController))

export default router
