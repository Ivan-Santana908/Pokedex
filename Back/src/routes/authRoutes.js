import express from 'express'
import authController from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', authController.register.bind(authController))
router.post('/login', authController.login.bind(authController))
router.get('/me', requireAuth, authController.me.bind(authController))

export default router
