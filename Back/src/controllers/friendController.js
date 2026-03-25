import FriendRequest from '../models/FriendRequest.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { sendPushToUser } from '../services/pushService.js'

export class FriendController {
  async listFriends(req, res, next) {
    try {
      const user = await User.findById(req.user._id).populate('friends', 'uid username displayName')
      return res.json({
        friends: user.friends.map((friend) => ({
          uid: friend.uid,
          username: friend.username,
          displayName: friend.displayName,
        })),
      })
    } catch (error) {
      next(error)
    }
  }

  async sendRequest(req, res, next) {
    try {
      const { toUid } = req.body
      if (!toUid) {
        return res.status(400).json({ error: 'toUid is required' })
      }

      const target = await User.findOne({ uid: String(toUid).toUpperCase() })
      if (!target) {
        return res.status(404).json({ error: 'target user not found' })
      }

      if (target._id.equals(req.user._id)) {
        return res.status(400).json({ error: 'cannot send friend request to yourself' })
      }

      const alreadyFriends = req.user.friends.some((id) => id.equals(target._id))
      if (alreadyFriends) {
        return res.status(409).json({ error: 'already friends' })
      }

      const existingPending = await FriendRequest.findOne({
        from: req.user._id,
        to: target._id,
        status: 'pending',
      })

      if (existingPending) {
        return res.status(409).json({ error: 'pending request already exists' })
      }

      const inversePending = await FriendRequest.findOne({
        from: target._id,
        to: req.user._id,
        status: 'pending',
      })

      if (inversePending) {
        return res.status(409).json({ error: 'this user already sent you a request' })
      }

      const request = await FriendRequest.create({
        from: req.user._id,
        to: target._id,
      })

      const payload = {
        title: 'New friend request',
        body: `${req.user.username} sent you a friend request.`,
        data: { type: 'friend_request', requestId: request._id.toString() },
      }

      await Notification.create({
        user: target._id,
        type: 'friend_request',
        title: payload.title,
        body: payload.body,
        data: payload.data,
      })

      await sendPushToUser(target._id, payload)

      return res.status(201).json({
        request: {
          id: request._id,
          status: request.status,
          createdAt: request.createdAt,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  async listRequests(req, res, next) {
    try {
      const [incoming, outgoing] = await Promise.all([
        FriendRequest.find({ to: req.user._id, status: 'pending' })
          .populate('from', 'uid username displayName')
          .sort({ createdAt: -1 }),
        FriendRequest.find({ from: req.user._id, status: 'pending' })
          .populate('to', 'uid username displayName')
          .sort({ createdAt: -1 }),
      ])

      return res.json({
        incoming: incoming.map((r) => ({
          id: r._id,
          status: r.status,
          createdAt: r.createdAt,
          from: {
            uid: r.from.uid,
            username: r.from.username,
            displayName: r.from.displayName,
          },
        })),
        outgoing: outgoing.map((r) => ({
          id: r._id,
          status: r.status,
          createdAt: r.createdAt,
          to: {
            uid: r.to.uid,
            username: r.to.username,
            displayName: r.to.displayName,
          },
        })),
      })
    } catch (error) {
      next(error)
    }
  }

  async respondRequest(req, res, next) {
    try {
      const { requestId } = req.params
      const { action } = req.body

      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action must be accept or reject' })
      }

      const request = await FriendRequest.findById(requestId)
      if (!request) {
        return res.status(404).json({ error: 'request not found' })
      }

      if (!request.to.equals(req.user._id)) {
        return res.status(403).json({ error: 'not allowed to respond this request' })
      }

      if (request.status !== 'pending') {
        return res.status(409).json({ error: 'request already processed' })
      }

      if (action === 'accept') {
        request.status = 'accepted'
        request.respondedAt = new Date()
        await request.save()

        await Promise.all([
          User.updateOne({ _id: request.from }, { $addToSet: { friends: request.to } }),
          User.updateOne({ _id: request.to }, { $addToSet: { friends: request.from } }),
        ])

        const fromUser = await User.findById(request.from)

        const payload = {
          title: 'Friend request accepted',
          body: `${req.user.username} accepted your friend request.`,
          data: { type: 'friend_accepted', requestId: request._id.toString() },
        }

        await Notification.create({
          user: fromUser._id,
          type: 'friend_accepted',
          title: payload.title,
          body: payload.body,
          data: payload.data,
        })

        await sendPushToUser(fromUser._id, payload)
      } else {
        request.status = 'rejected'
        request.respondedAt = new Date()
        await request.save()
      }

      return res.json({ success: true, status: request.status })
    } catch (error) {
      next(error)
    }
  }
}

export default new FriendController()
