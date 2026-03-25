import express from 'express'
import battleController from '../controllers/battleController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', battleController.history.bind(battleController))
router.get('/requests', battleController.listRequests.bind(battleController))
router.post('/requests', battleController.sendRequest.bind(battleController))
router.post('/requests/:battleId/respond', battleController.respondRequest.bind(battleController))
router.post('/:battleId/simulate', battleController.simulate.bind(battleController))

export default router
