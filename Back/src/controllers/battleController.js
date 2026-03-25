import Battle from '../models/Battle.js'
import Notification from '../models/Notification.js'
import Team from '../models/Team.js'
import User from '../models/User.js'
import { simulateBattle } from '../services/battleSimulationService.js'
import { sendPushToUser } from '../services/pushService.js'

export class BattleController {
  async sendRequest(req, res, next) {
    try {
      const { opponentUid, challengerTeamId } = req.body

      if (!opponentUid || !challengerTeamId) {
        return res.status(400).json({ error: 'opponentUid and challengerTeamId are required' })
      }

      const [opponent, challengerTeam] = await Promise.all([
        User.findOne({ uid: String(opponentUid).toUpperCase() }),
        Team.findOne({ _id: challengerTeamId, owner: req.user._id }),
      ])

      if (!opponent) {
        return res.status(404).json({ error: 'opponent not found' })
      }

      if (!challengerTeam) {
        return res.status(404).json({ error: 'challenger team not found' })
      }

      const isFriend = req.user.friends.some((id) => id.equals(opponent._id))
      if (!isFriend) {
        return res.status(403).json({ error: 'you can only battle with friends' })
      }

      const existingPending = await Battle.findOne({
        challenger: req.user._id,
        opponent: opponent._id,
        status: 'pending',
      })

      if (existingPending) {
        return res.status(409).json({ error: 'you already have a pending battle request with this user' })
      }

      const battle = await Battle.create({
        challenger: req.user._id,
        opponent: opponent._id,
        challengerTeam: challengerTeam._id,
        status: 'pending',
      })

      const payload = {
        title: 'New battle request',
        body: `${req.user.username} challenged you to a Pokemon battle.`,
        data: { type: 'battle_request', battleId: battle._id.toString() },
      }

      await Notification.create({
        user: opponent._id,
        type: 'battle_request',
        title: payload.title,
        body: payload.body,
        data: payload.data,
      })

      await sendPushToUser(opponent._id, payload)

      return res.status(201).json({ battle })
    } catch (error) {
      next(error)
    }
  }

  async listRequests(req, res, next) {
    try {
      const [incoming, outgoing] = await Promise.all([
        Battle.find({ opponent: req.user._id, status: 'pending' })
          .populate('challenger', 'uid username displayName')
          .populate('challengerTeam', 'name')
          .sort({ createdAt: -1 }),
        Battle.find({ challenger: req.user._id, status: 'pending' })
          .populate('opponent', 'uid username displayName')
          .populate('challengerTeam', 'name')
          .sort({ createdAt: -1 }),
      ])

      return res.json({ incoming, outgoing })
    } catch (error) {
      next(error)
    }
  }

  async respondRequest(req, res, next) {
    try {
      const { battleId } = req.params
      const { action, opponentTeamId } = req.body

      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action must be accept or reject' })
      }

      const battle = await Battle.findById(battleId)
      if (!battle) {
        return res.status(404).json({ error: 'battle request not found' })
      }

      if (!battle.opponent.equals(req.user._id)) {
        return res.status(403).json({ error: 'not allowed to respond to this battle request' })
      }

      if (battle.status !== 'pending') {
        return res.status(409).json({ error: 'battle request already processed' })
      }

      if (action === 'reject') {
        battle.status = 'rejected'
        battle.respondedAt = new Date()
        await battle.save()
        return res.json({ battle })
      }

      if (!opponentTeamId) {
        return res.status(400).json({ error: 'opponentTeamId is required when accepting a battle' })
      }

      const opponentTeam = await Team.findOne({ _id: opponentTeamId, owner: req.user._id })
      if (!opponentTeam) {
        return res.status(404).json({ error: 'opponent team not found' })
      }

      battle.status = 'accepted'
      battle.opponentTeam = opponentTeam._id
      battle.respondedAt = new Date()
      await battle.save()

      return res.json({ battle })
    } catch (error) {
      next(error)
    }
  }

  async simulate(req, res, next) {
    try {
      const { battleId } = req.params

      const battle = await Battle.findById(battleId)
        .populate('challenger', 'uid username')
        .populate('opponent', 'uid username')
        .populate('challengerTeam')
        .populate('opponentTeam')

      if (!battle) {
        return res.status(404).json({ error: 'battle not found' })
      }

      if (!battle.challenger._id.equals(req.user._id) && !battle.opponent._id.equals(req.user._id)) {
        return res.status(403).json({ error: 'you are not a participant in this battle' })
      }

      if (battle.status !== 'accepted') {
        return res.status(409).json({ error: 'battle is not ready to simulate' })
      }

      const result = simulateBattle({
        challengerUid: battle.challenger.uid,
        opponentUid: battle.opponent.uid,
        challengerMembers: battle.challengerTeam.members,
        opponentMembers: battle.opponentTeam.members,
      })

      battle.turns = result.turns
      battle.summary = result.summary
      battle.status = 'finished'
      battle.finishedAt = new Date()

      if (result.winnerUid === battle.challenger.uid) {
        battle.winner = battle.challenger._id
      } else if (result.winnerUid === battle.opponent.uid) {
        battle.winner = battle.opponent._id
      } else {
        battle.winner = null
      }

      await battle.save()

      const title = 'Battle finished'
      const body = battle.winner
        ? `The battle between ${battle.challenger.username} and ${battle.opponent.username} has a winner.`
        : `The battle between ${battle.challenger.username} and ${battle.opponent.username} ended in a draw.`

      await Promise.all([
        Notification.create({
          user: battle.challenger._id,
          type: 'battle_result',
          title,
          body,
          data: { type: 'battle_result', battleId: battle._id.toString() },
        }),
        Notification.create({
          user: battle.opponent._id,
          type: 'battle_result',
          title,
          body,
          data: { type: 'battle_result', battleId: battle._id.toString() },
        }),
      ])

      await Promise.all([
        sendPushToUser(battle.challenger._id, { title, body, data: { type: 'battle_result', battleId: battle._id.toString() } }),
        sendPushToUser(battle.opponent._id, { title, body, data: { type: 'battle_result', battleId: battle._id.toString() } }),
      ])

      return res.json({ battle })
    } catch (error) {
      next(error)
    }
  }

  async history(req, res, next) {
    try {
      const battles = await Battle.find({
        $or: [{ challenger: req.user._id }, { opponent: req.user._id }],
      })
        .populate('challenger', 'uid username')
        .populate('opponent', 'uid username')
        .populate('winner', 'uid username')
        .sort({ createdAt: -1 })
        .limit(50)

      return res.json({ battles })
    } catch (error) {
      next(error)
    }
  }
}

export default new BattleController()
