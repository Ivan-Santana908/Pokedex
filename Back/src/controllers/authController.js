import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { generateUniqueUid } from '../utils/uid.js'
import { createAccessToken } from '../services/authTokenService.js'

export class AuthController {
  async register(req, res, next) {
    try {
      const { email, username, displayName, password } = req.body

      if (!email || !username || !displayName || !password) {
        return res.status(400).json({ error: 'email, username, displayName and password are required' })
      }

      if (String(password).length < 8) {
        return res.status(400).json({ error: 'password must be at least 8 characters' })
      }

      const normalizedEmail = String(email).trim().toLowerCase()
      const normalizedUsername = String(username).trim().toLowerCase()

      const existing = await User.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
      })

      if (existing) {
        return res.status(409).json({ error: 'email or username already in use' })
      }

      const uid = await generateUniqueUid()
      const passwordHash = await bcrypt.hash(password, 10)

      const user = await User.create({
        uid,
        email: normalizedEmail,
        username: normalizedUsername,
        displayName: String(displayName).trim(),
        passwordHash,
      })

      const token = createAccessToken(user)

      return res.status(201).json({
        token,
        user: user.toSafeObject(),
      })
    } catch (error) {
      next(error)
    }
  }

  async login(req, res, next) {
    try {
      const { emailOrUsername, password } = req.body

      if (!emailOrUsername || !password) {
        return res.status(400).json({ error: 'emailOrUsername and password are required' })
      }

      const identifier = String(emailOrUsername).trim().toLowerCase()

      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      }).select('+passwordHash')

      if (!user) {
        return res.status(401).json({ error: 'invalid credentials' })
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return res.status(401).json({ error: 'invalid credentials' })
      }

      const token = createAccessToken(user)

      return res.json({
        token,
        user: user.toSafeObject(),
      })
    } catch (error) {
      next(error)
    }
  }

  async me(req, res, next) {
    try {
      return res.json({ user: req.user.toSafeObject() })
    } catch (error) {
      next(error)
    }
  }
}

export default new AuthController()
