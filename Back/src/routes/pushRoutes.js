import express from 'express'
import pushController from '../controllers/pushController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/public-key', pushController.publicKey.bind(pushController))
router.post('/subscribe', requireAuth, pushController.subscribe.bind(pushController))
router.post('/unsubscribe', requireAuth, pushController.unsubscribe.bind(pushController))

export default router
