import Team from '../models/Team.js'
import pokemonService from '../services/pokemonService.js'

function normalizeTeamPayload(payload) {
  return {
    name: String(payload.name || '').trim(),
    members: Array.isArray(payload.members) ? payload.members : [],
  }
}

function extractMoveName(move) {
  if (!move) return null
  if (typeof move === 'string') return String(move).toLowerCase().trim() || null
  return String(move.name || move.move?.name || '').toLowerCase().trim() || null
}

async function validateMembersMoves(members) {
  for (const member of members) {
    const pokemonId = Number(member?.pokemonId)
    if (!pokemonId) {
      return { ok: false, error: 'pokemonId is required for each member' }
    }

    const moves = Array.isArray(member?.moves) ? member.moves : []
    if (moves.length < 1 || moves.length > 4) {
      return { ok: false, error: `pokemon ${pokemonId} must have between 1 and 4 moves` }
    }

    const uniqueMoveNames = new Set()
    for (const move of moves) {
      const moveName = extractMoveName(move)
      if (!moveName) {
        return { ok: false, error: `pokemon ${pokemonId} has an invalid move name` }
      }
      if (uniqueMoveNames.has(moveName)) {
        return { ok: false, error: `pokemon ${pokemonId} has duplicated move ${moveName}` }
      }
      uniqueMoveNames.add(moveName)
    }

    const pokeData = await pokemonService.getPokemonDetails(pokemonId)
    const allowedMoves = new Set((pokeData?.moves || []).map((entry) => String(entry?.move?.name || '').toLowerCase()).filter(Boolean))

    for (const moveName of uniqueMoveNames) {
      if (!allowedMoves.has(moveName)) {
        return { ok: false, error: `move ${moveName} is not legal for pokemon ${pokemonId}` }
      }
    }
  }

  return { ok: true }
}

export class TeamController {
  async listMine(req, res, next) {
    try {
      console.log('listMine called for user:', req.user._id)
      const teams = await Team.find({ owner: req.user._id }).sort({ createdAt: -1 })
      console.log(`Found ${teams.length} teams for user`)
      console.log('Teams data:', JSON.stringify(teams, null, 2))
      return res.json({ teams })
    } catch (error) {
      console.error('Error in listMine:', error)
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      console.log('Create team request:', req.body)
      const { name, members } = normalizeTeamPayload(req.body)
      console.log(`Creating team "${name}" with ${members.length} members`)

      if (!name || !members.length) {
        console.log('Validation failed: name or members missing')
        return res.status(400).json({ error: 'name and members are required' })
      }

      const validation = await validateMembersMoves(members)
      if (!validation.ok) {
        console.log('Move validation failed:', validation.error)
        return res.status(400).json({ error: validation.error })
      }

      const team = await Team.create({
        owner: req.user._id,
        name,
        members,
      })

      console.log('Team created successfully:', team._id)
      return res.status(201).json({ team })
    } catch (error) {
      console.error('Error creating team:', error)
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { teamId } = req.params
      const { name, members } = normalizeTeamPayload(req.body)

      const team = await Team.findOne({ _id: teamId, owner: req.user._id })
      if (!team) {
        return res.status(404).json({ error: 'team not found' })
      }

      if (members.length) {
        const validation = await validateMembersMoves(members)
        if (!validation.ok) {
          return res.status(400).json({ error: validation.error })
        }
      }

      if (name) team.name = name
      if (members.length) team.members = members

      await team.save()
      return res.json({ team })
    } catch (error) {
      next(error)
    }
  }

  async remove(req, res, next) {
    try {
      const { teamId } = req.params
      const deleted = await Team.findOneAndDelete({ _id: teamId, owner: req.user._id })
      if (!deleted) {
        return res.status(404).json({ error: 'team not found' })
      }

      return res.json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async setActive(req, res, next) {
    try {
      const { teamId } = req.params
      const target = await Team.findOne({ _id: teamId, owner: req.user._id })
      if (!target) {
        return res.status(404).json({ error: 'team not found' })
      }

      await Team.updateMany({ owner: req.user._id, isActive: true }, { isActive: false })
      target.isActive = true
      await target.save()

      return res.json({ team: target })
    } catch (error) {
      next(error)
    }
  }
}

export default new TeamController()
