import PushSubscription from '../models/PushSubscription.js'
import { getVapidPublicKey } from '../services/pushService.js'

export class PushController {
  async publicKey(req, res, next) {
    try {
      return res.json({ publicKey: getVapidPublicKey() })
    } catch (error) {
      next(error)
    }
  }

  async subscribe(req, res, next) {
    try {
      const { subscription } = req.body
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return res.status(400).json({ error: 'invalid subscription payload' })
      }

      await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
          user: req.user._id,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )

      req.user.notificationPreferences.pushEnabled = true
      await req.user.save()

      return res.status(201).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async unsubscribe(req, res, next) {
    try {
      const { endpoint } = req.body
      if (!endpoint) {
        return res.status(400).json({ error: 'endpoint is required' })
      }

      await PushSubscription.deleteOne({ endpoint, user: req.user._id })
      return res.json({ success: true })
    } catch (error) {
      next(error)
    }
  }
}

export default new PushController()
