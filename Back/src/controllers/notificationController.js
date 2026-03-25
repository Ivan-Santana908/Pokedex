import Notification from '../models/Notification.js'

export class NotificationController {
  async listMine(req, res, next) {
    try {
      const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100)
      return res.json({ notifications })
    } catch (error) {
      next(error)
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params
      const notification = await Notification.findOne({ _id: notificationId, user: req.user._id })

      if (!notification) {
        return res.status(404).json({ error: 'notification not found' })
      }

      if (!notification.readAt) {
        notification.readAt = new Date()
        await notification.save()
      }

      return res.json({ notification })
    } catch (error) {
      next(error)
    }
  }
}

export default new NotificationController()
