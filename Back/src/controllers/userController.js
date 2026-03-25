import User from '../models/User.js'

export class UserController {
  async search(req, res, next) {
    try {
      const q = String(req.query.q || '').trim().toLowerCase()

      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'query q must have at least 2 characters' })
      }

      const users = await User.find({
        $or: [{ username: new RegExp(q, 'i') }, { uid: new RegExp(q, 'i') }],
      })
        .limit(20)
        .sort({ username: 1 })

      return res.json({
        results: users.map((user) => ({
          uid: user.uid,
          username: user.username,
          displayName: user.displayName,
        })),
      })
    } catch (error) {
      next(error)
    }
  }

  async getByUid(req, res, next) {
    try {
      const { uid } = req.params
      const user = await User.findOne({ uid: String(uid).toUpperCase() })

      if (!user) {
        return res.status(404).json({ error: 'user not found' })
      }

      return res.json({
        user: {
          uid: user.uid,
          username: user.username,
          displayName: user.displayName,
        },
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new UserController()
