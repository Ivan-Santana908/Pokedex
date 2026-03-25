import express from 'express'
import friendController from '../controllers/friendController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', friendController.listFriends.bind(friendController))
router.get('/requests', friendController.listRequests.bind(friendController))
router.post('/requests', friendController.sendRequest.bind(friendController))
router.post('/requests/:requestId/respond', friendController.respondRequest.bind(friendController))

export default router
