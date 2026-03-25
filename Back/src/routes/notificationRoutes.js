import express from 'express'
import notificationController from '../controllers/notificationController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', notificationController.listMine.bind(notificationController))
router.post('/:notificationId/read', notificationController.markAsRead.bind(notificationController))

export default router
