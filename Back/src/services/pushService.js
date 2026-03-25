import webpush from 'web-push'
import PushSubscription from '../models/PushSubscription.js'

let vapidConfigured = false

function ensureVapidConfig() {
  if (vapidConfigured) return true

  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

  if (!publicKey || !privateKey) {
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

export async function sendPushToUser(userId, payload) {
  if (!ensureVapidConfig()) {
    return { delivered: 0, skipped: true, reason: 'missing_vapid_keys' }
  }

  const subscriptions = await PushSubscription.find({ user: userId })
  if (!subscriptions.length) {
    return { delivered: 0, skipped: true, reason: 'no_subscriptions' }
  }

  let delivered = 0

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload)
        )
        delivered += 1
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id })
        }
      }
    })
  )

  return { delivered, skipped: false }
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null
}

export default { sendPushToUser, getVapidPublicKey }
