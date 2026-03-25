import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import User from '../src/models/User.js'
import FriendRequest from '../src/models/FriendRequest.js'
import Team from '../src/models/Team.js'
import Battle from '../src/models/Battle.js'
import Notification from '../src/models/Notification.js'
import PushSubscription from '../src/models/PushSubscription.js'

dotenv.config()

async function ensureCollections() {
  const desiredCollections = [
    'users',
    'friendrequests',
    'teams',
    'battles',
    'notifications',
    'pushsubscriptions',
  ]

  const existing = await mongoose.connection.db.listCollections().toArray()
  const existingNames = new Set(existing.map((c) => c.name))

  for (const collectionName of desiredCollections) {
    if (!existingNames.has(collectionName)) {
      await mongoose.connection.db.createCollection(collectionName)
      console.log(`Created collection: ${collectionName}`)
    }
  }
}

async function ensureIndexes() {
  await Promise.all([
    User.syncIndexes(),
    FriendRequest.syncIndexes(),
    Team.syncIndexes(),
    Battle.syncIndexes(),
    Notification.syncIndexes(),
    PushSubscription.syncIndexes(),
  ])
  console.log('Indexes synchronized')
}

async function run() {
  try {
    await connectDB()
    await ensureCollections()
    await ensureIndexes()

    console.log(`Database ready: ${mongoose.connection.name}`)
    process.exit(0)
  } catch (error) {
    console.error('Database init failed:', error.message)
    process.exit(1)
  }
}

run()
