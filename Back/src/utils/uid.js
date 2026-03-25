import User from '../models/User.js'

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomUid(length = 8) {
  let uid = ''
  for (let i = 0; i < length; i += 1) {
    uid += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return uid
}

export async function generateUniqueUid() {
  for (let i = 0; i < 10; i += 1) {
    const uid = randomUid(8)
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ uid })
    if (!exists) return uid
  }

  throw new Error('Could not generate unique uid')
}

export default generateUniqueUid
