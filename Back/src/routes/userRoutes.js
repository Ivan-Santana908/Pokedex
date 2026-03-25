import express from 'express'
import userController from '../controllers/userController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/search', requireAuth, userController.search.bind(userController))
router.get('/:uid', requireAuth, userController.getByUid.bind(userController))

export default router
