import Battle from '../models/Battle.js'
import Notification from '../models/Notification.js'
import Team from '../models/Team.js'
import User from '../models/User.js'
import { calculateDamage, effectivenessMessage, simulateBattle } from '../services/battleSimulationService.js'
import { sendPushToUser } from '../services/pushService.js'

function toBattleMember(member, ownerUid) {
  return {
    ownerUid,
    pokemonId: Number(member?.pokemonId || 0),
    pokemonName: String(member?.pokemonName || 'unknown'),
    level: Number(member?.level || 50),
    types: Array.isArray(member?.types) ? member.types : ['normal'],
    stats: {
      hp: Number(member?.stats?.hp || 1),
      attack: Number(member?.stats?.attack || 1),
      defense: Number(member?.stats?.defense || 1),
      specialAttack: Number(member?.stats?.specialAttack || 1),
      specialDefense: Number(member?.stats?.specialDefense || 1),
      speed: Number(member?.stats?.speed || 1),
    },
    moves: Array.isArray(member?.moves) && member.moves.length
      ? member.moves
      : [{ name: 'tackle', type: 'normal', power: 40, category: 'physical', accuracy: 100, pp: 35 }],
    maxHp: Number(member?.stats?.hp || 1),
    currentHp: Number(member?.stats?.hp || 1),
    fainted: false,
  }
}

function findNextAliveIndex(team, startIndex = 0) {
  for (let i = startIndex; i < team.length; i += 1) {
    if (!team[i]?.fainted && Number(team[i]?.currentHp || 0) > 0) return i
  }
  for (let i = 0; i < startIndex; i += 1) {
    if (!team[i]?.fainted && Number(team[i]?.currentHp || 0) > 0) return i
  }
  return -1
}

function hasAlivePokemon(team) {
  return Array.isArray(team) && team.some((pokemon) => !pokemon?.fainted && Number(pokemon?.currentHp || 0) > 0)
}

function resolveBattleSummary(winnerUid, challengerUid, opponentUid) {
  if (winnerUid === challengerUid) return 'Challenger won the battle.'
  if (winnerUid === opponentUid) return 'Opponent won the battle.'
  return 'Battle ended in a draw.'
}

function normalizeUid(value) {
  return String(value || '').trim().toLowerCase()
}

function makeBattlePairKey(challengerId, opponentId) {
  return [String(challengerId || '').trim(), String(opponentId || '').trim()]
    .filter(Boolean)
    .sort()
    .join(':')
}

function getOppositeUid(uid, challengerUid, opponentUid) {
  const normalized = normalizeUid(uid)
  if (normalized === challengerUid) return opponentUid
  if (normalized === opponentUid) return challengerUid
  return ''
}

function getLastBattleAttackerUid(battle, state) {
  const stateLog = Array.isArray(state?.log) ? state.log : []
  if (stateLog.length > 0) {
    return normalizeUid(stateLog[stateLog.length - 1]?.attackerUid)
  }

  const battleTurns = Array.isArray(battle?.turns) ? battle.turns : []
  if (battleTurns.length > 0) {
    return normalizeUid(battleTurns[battleTurns.length - 1]?.attackerUid)
  }

  return ''
}

function initializeBattleState(battle) {
  const challengerUid = normalizeUid(battle?.challenger?.uid)
  const opponentUid = normalizeUid(battle?.opponent?.uid)
  
  console.log(`⚔️  INITIALIZING BATTLE STATE`)
  console.log(`   Challenger: ${challengerUid}`)
  console.log(`   Opponent: ${opponentUid}`)

  const challengerTeam = (battle?.challengerTeam?.members || []).map((member) => toBattleMember(member, challengerUid))
  const opponentTeam = (battle?.opponentTeam?.members || []).map((member) => toBattleMember(member, opponentUid))

  if (!challengerTeam.length || !opponentTeam.length) {
    throw new Error('both teams must have at least one pokemon')
  }

  const challengerActive = findNextAliveIndex(challengerTeam, 0)
  const opponentActive = findNextAliveIndex(opponentTeam, 0)
  const challengerSpeed = Number(challengerTeam[challengerActive]?.stats?.speed || 0)
  const opponentSpeed = Number(opponentTeam[opponentActive]?.stats?.speed || 0)

  return {
    phase: 'active',
    turnUid: challengerSpeed >= opponentSpeed ? challengerUid : opponentUid,
    challenger: {
      uid: challengerUid,
      activeIndex: challengerActive,
      team: challengerTeam,
    },
    opponent: {
      uid: opponentUid,
      activeIndex: opponentActive,
      team: opponentTeam,
    },
    winnerUid: null,
    summary: '',
    log: [],
    turnCount: 0,
  }
}

function getSidesFromState(state, actorUid) {
  const uid = normalizeUid(actorUid)
  const challengerUid = normalizeUid(state?.challenger?.uid)
  const opponentUid = normalizeUid(state?.opponent?.uid)
  
  if (challengerUid && uid === challengerUid) {
    return {
      self: state.challenger,
      foe: state.opponent,
    }
  }

  if (opponentUid && uid === opponentUid) {
    return {
      self: state.opponent,
      foe: state.challenger,
    }
  }

  return null
}

function setBattleFinished(battle, state) {
  const challengerAlive = hasAlivePokemon(state?.challenger?.team)
  const opponentAlive = hasAlivePokemon(state?.opponent?.team)

  if (challengerAlive && !opponentAlive) state.winnerUid = state.challenger.uid
  else if (!challengerAlive && opponentAlive) state.winnerUid = state.opponent.uid
  else state.winnerUid = null

  state.phase = 'finished'
  state.summary = resolveBattleSummary(state.winnerUid, state.challenger.uid, state.opponent.uid)
  state.turnUid = null

  battle.status = 'finished'
  battle.phase = 'finished'
  battle.activePairKey = null
  battle.finishedAt = new Date()
  battle.summary = state.summary

  if (state.winnerUid === state.challenger.uid) battle.winner = battle.challenger._id
  else if (state.winnerUid === state.opponent.uid) battle.winner = battle.opponent._id
  else battle.winner = null
}

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

      const pairKey = makeBattlePairKey(req.user._id, opponent._id)

      const existingPending = await Battle.findOne({
        $or: [
          {
            activePairKey: pairKey,
            status: { $in: ['pending', 'accepted'] },
          },
          {
            status: { $in: ['pending', 'accepted'] },
            $or: [
              { challenger: req.user._id, opponent: opponent._id },
              { challenger: opponent._id, opponent: req.user._id },
            ],
          },
        ],
      })

      if (existingPending) {
        return res.status(409).json({ error: 'there is already an active or pending battle request with this user' })
      }

      const battle = await Battle.create({
        pairKey,
        activePairKey: pairKey,
        challenger: req.user._id,
        opponent: opponent._id,
        challengerTeam: challengerTeam._id,
        status: 'pending',
        phase: 'waiting',
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

      // Emitir evento WebSocket al oponente
      req.io.emit('new-battle-request', {
        challengerId: req.user.uid,
        challengerName: req.user.username,
        battleId: battle._id.toString(),
      })

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
        battle.phase = 'finished'
        battle.activePairKey = null
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
  battle.phase = 'active'
  battle.pairKey = battle.pairKey || makeBattlePairKey(battle.challenger._id, battle.opponent._id)
      battle.opponentTeam = opponentTeam._id
      battle.respondedAt = new Date()
      battle.turns = []
      battle.battleState = null
      battle.summary = ''
      battle.finishedAt = null
      battle.winner = null
  battle.activePairKey = battle.pairKey
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
      battle.phase = 'finished'
      battle.activePairKey = null
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

  async getState(req, res, next) {
    try {
      const { battleId } = req.params
      const battle = await Battle.findById(battleId)
        .populate('challenger', 'uid username displayName')
        .populate('opponent', 'uid username displayName')
        .populate('challengerTeam')
        .populate('opponentTeam')

      if (!battle) {
        return res.status(404).json({ error: 'battle not found' })
      }

      if (!battle.challenger._id.equals(req.user._id) && !battle.opponent._id.equals(req.user._id)) {
        return res.status(403).json({ error: 'you are not a participant in this battle' })
      }

      if (battle.status === 'accepted' && !battle.battleState) {
        battle.battleState = initializeBattleState(battle)
        battle.phase = 'active'
        await battle.save()
      }
      
      // Normalizar UIDs en la respuesta
      if (battle.battleState) {
        const challengerUid = normalizeUid(battle?.challenger?.uid)
        const opponentUid = normalizeUid(battle?.opponent?.uid)

        if (battle.battleState.challenger) {
          battle.battleState.challenger.uid = challengerUid
        }
        if (battle.battleState.opponent) {
          battle.battleState.opponent.uid = opponentUid
        }

        const currentTurnUid = normalizeUid(battle.battleState.turnUid)
        if (currentTurnUid !== challengerUid && currentTurnUid !== opponentUid) {
          battle.battleState.turnUid = challengerUid
        } else {
          battle.battleState.turnUid = currentTurnUid
        }
      }

      return res.json({ battle })
    } catch (error) {
      next(error)
    }
  }

  async playTurn(req, res, next) {
    try {
      const { battleId } = req.params
      const { moveName } = req.body

      const battle = await Battle.findById(battleId)
        .populate('challenger', 'uid username displayName')
        .populate('opponent', 'uid username displayName')
        .populate('challengerTeam')
        .populate('opponentTeam')

      if (!battle) {
        return res.status(404).json({ error: 'battle not found' })
      }

      if (!battle.challenger._id.equals(req.user._id) && !battle.opponent._id.equals(req.user._id)) {
        return res.status(403).json({ error: 'you are not a participant in this battle' })
      }

      if (battle.status !== 'accepted') {
        return res.status(409).json({ error: 'battle is not active for turn play' })
      }

      let state = battle.battleState || initializeBattleState(battle)
      const challengerUid = normalizeUid(battle?.challenger?.uid)
      const opponentUid = normalizeUid(battle?.opponent?.uid)
      const actorSide = battle.challenger._id.equals(req.user._id) ? 'challenger' : 'opponent'
      const actorUid = actorSide === 'challenger' ? challengerUid : opponentUid
      
      // Normalizar UIDs del estado recuperado
      if (state && state.challenger) {
        state.challenger.uid = challengerUid
      }
      if (state && state.opponent) {
        state.opponent.uid = opponentUid
      }
      if (state) {
        state.turnUid = normalizeUid(state.turnUid)
        if (state.turnUid !== challengerUid && state.turnUid !== opponentUid) {
          state.turnUid = challengerUid
        }
      }
      if (state.phase === 'finished') {
        return res.status(409).json({ error: 'battle already finished', battle })
      }
      const currentTurnUid = normalizeUid(state.turnUid)
      
      if (!currentTurnUid || currentTurnUid !== actorUid) {
        // Auto-repair: si el ultimo turno indica que ya deberia tocarle al actor,
        // corregimos turnUid y continuamos en lugar de bloquear en 409.
        const lastAttackerUid = getLastBattleAttackerUid(battle, state)
        const expectedNextUid = getOppositeUid(lastAttackerUid, challengerUid, opponentUid)

        if (expectedNextUid && expectedNextUid === actorUid) {
          console.log(`🛠️ TURN AUTO-REPAIR: current=${currentTurnUid}, expected=${expectedNextUid}, actor=${actorUid}`)
          state.turnUid = expectedNextUid
          battle.battleState = state
          await battle.save()
        }
      }

      const reconciledTurnUid = normalizeUid(state.turnUid)

      if (!reconciledTurnUid || reconciledTurnUid !== actorUid) {
        console.log(`❌ TURN VALIDATION FAILED: currentTurn=${currentTurnUid}, actor=${actorUid}`)
        return res.status(409).json({
          error: 'it is not your turn',
          debug: {
            actorSide,
            actorUid,
            currentTurnUid: reconciledTurnUid,
            challengerUid,
            opponentUid,
          },
          battle,
        })
      }
      
      console.log(`✅ TURN VALIDATION PASSED: currentTurn=${reconciledTurnUid}, actor=${actorUid}`)

      const sides = getSidesFromState(state, actorUid)
      if (!sides) {
        return res.status(403).json({ error: 'you are not a participant in this battle state' })
      }

      const selfNext = findNextAliveIndex(sides.self.team, Number(sides.self.activeIndex || 0))
      if (selfNext === -1) {
        setBattleFinished(battle, state)
        battle.battleState = state
        await battle.save()
        return res.json({ battle })
      }
      sides.self.activeIndex = selfNext

      const foeNext = findNextAliveIndex(sides.foe.team, Number(sides.foe.activeIndex || 0))
      if (foeNext === -1) {
        setBattleFinished(battle, state)
        battle.battleState = state
        await battle.save()
        return res.json({ battle })
      }
      sides.foe.activeIndex = foeNext

      const attacker = sides.self.team[sides.self.activeIndex]
      const defender = sides.foe.team[sides.foe.activeIndex]

      const availableMoves = Array.isArray(attacker.moves) && attacker.moves.length
        ? attacker.moves
        : [{ name: 'tackle', type: 'normal', power: 40, category: 'physical', accuracy: 100, pp: 35 }]

      const selectedMove = availableMoves.find(
        (move) => String(move?.name || '').toLowerCase() === String(moveName || '').toLowerCase()
      ) || availableMoves[0]

      const accuracy = Number(selectedMove?.accuracy || 100)
      const hitRoll = Math.random() * 100
      const hit = hitRoll <= accuracy

      let damage = 0
      let effectiveness = 1
      if (hit) {
        const result = calculateDamage(attacker, defender, selectedMove)
        damage = result.damage
        effectiveness = result.effectiveness
        defender.currentHp = Math.max(0, Number(defender.currentHp || 0) - damage)
        defender.fainted = defender.currentHp === 0
      }

      let message = `${attacker.pokemonName} used ${selectedMove.name}.`
      if (!hit) {
        message = `${attacker.pokemonName} used ${selectedMove.name}, but it missed.`
      } else {
        message = `${attacker.pokemonName} used ${selectedMove.name}. ${effectivenessMessage(effectiveness)}`
      }

      const turnRecord = {
        attackerUid: sides.self.uid,
        defenderUid: sides.foe.uid,
        attackerPokemon: attacker.pokemonName,
        defenderPokemon: defender.pokemonName,
        moveName: selectedMove.name,
        damage,
        effectiveness,
        defenderRemainingHp: Number(defender.currentHp || 0),
        message,
      }

      battle.turns.push(turnRecord)
      state.log.push(turnRecord)
      state.turnCount = Number(state.turnCount || 0) + 1

      if (defender.fainted) {
        sides.foe.activeIndex = findNextAliveIndex(sides.foe.team, Number(sides.foe.activeIndex || 0) + 1)
      }

      const selfAlive = hasAlivePokemon(sides.self.team)
      const foeAlive = hasAlivePokemon(sides.foe.team)

      if (!selfAlive || !foeAlive) {
        setBattleFinished(battle, state)
      } else {
        // Cambiar turno usando UIDs canónicos de participantes.
        const newTurnUid = actorSide === 'challenger' ? opponentUid : challengerUid
        console.log(`🔄 CHANGING TURN FROM ${normalizeUid(state.turnUid)} TO ${newTurnUid}`)
        console.log(`   Self: ${normalizeUid(sides.self.uid)} | Foe: ${normalizeUid(sides.foe.uid)}`)
        state.turnUid = newTurnUid
      }

      battle.battleState = state
      battle.phase = state.phase
      await battle.save()

      // Emitir evento WebSocket a ambos jugadores
      const roomId = `battle-${battleId}`
      req.io.to(roomId).emit('turn-update', {
        message: turnRecord.message,
        damage: Number(damage || 0),
        effectiveness,
        attacker: attacker.pokemonName,
        defender: defender.pokemonName,
        moveName: selectedMove.name,
        timestamp: Date.now(),
      })
      
      // Enviar el estado actualizado asegurando que turnUid sea el correcto
      const stateToSend = {
        ...state,
        turnUid: String(state.turnUid || ''),
      }
      req.io.to(roomId).emit('state-changed', stateToSend)

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

      const normalizedBattles = battles.map((battle) => {
        if (!battle.phase) {
          if (battle.status === 'finished' || battle.status === 'rejected' || battle.status === 'cancelled') {
            battle.phase = 'finished'
          } else if (battle.status === 'accepted') {
            battle.phase = 'active'
          } else {
            battle.phase = 'waiting'
          }
        }

        return battle
      })

      return res.json({ battles: normalizedBattles })
    } catch (error) {
      next(error)
    }
  }
}

export default new BattleController()
