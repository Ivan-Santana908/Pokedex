import jwt from 'jsonwebtoken'

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      uid: user.uid,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export default { createAccessToken }
