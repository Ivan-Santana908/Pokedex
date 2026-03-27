import Favorite from '../models/Favorite.js'

function normalizeTypes(rawTypes) {
  if (!Array.isArray(rawTypes)) return []
  return rawTypes
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
}

export class FavoriteController {
  async list(req, res, next) {
    try {
      const favorites = await Favorite.find({ user: req.user._id })
        .sort({ createdAt: -1 })

      return res.json({ favorites })
    } catch (error) {
      next(error)
    }
  }

  async add(req, res, next) {
    try {
      const pokemonId = Number(req.params.pokemonId)
      const pokemonName = String(req.body?.pokemonName || '').trim().toLowerCase()
      const imageUrl = String(req.body?.imageUrl || '').trim()
      const types = normalizeTypes(req.body?.types)

      if (!Number.isFinite(pokemonId) || pokemonId <= 0) {
        return res.status(400).json({ error: 'pokemonId must be a positive number' })
      }

      if (!pokemonName) {
        return res.status(400).json({ error: 'pokemonName is required' })
      }

      const favorite = await Favorite.findOneAndUpdate(
        { user: req.user._id, pokemonId },
        {
          user: req.user._id,
          pokemonId,
          pokemonName,
          imageUrl,
          types,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )

      return res.status(201).json({ favorite })
    } catch (error) {
      next(error)
    }
  }

  async remove(req, res, next) {
    try {
      const pokemonId = Number(req.params.pokemonId)

      if (!Number.isFinite(pokemonId) || pokemonId <= 0) {
        return res.status(400).json({ error: 'pokemonId must be a positive number' })
      }

      await Favorite.deleteOne({ user: req.user._id, pokemonId })
      return res.json({ success: true })
    } catch (error) {
      next(error)
    }
  }
}

export default new FavoriteController()
