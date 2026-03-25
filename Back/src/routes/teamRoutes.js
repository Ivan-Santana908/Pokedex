import express from 'express'
import teamController from '../controllers/teamController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', teamController.listMine.bind(teamController))
router.post('/', teamController.create.bind(teamController))
router.put('/:teamId', teamController.update.bind(teamController))
router.delete('/:teamId', teamController.remove.bind(teamController))
router.post('/:teamId/active', teamController.setActive.bind(teamController))

export default router
