import mongoose from 'mongoose'

function applyDatabaseNameToUri(uri, dbName) {
  if (!dbName) return uri

  const [withoutQuery, query = ''] = uri.split('?')
  const protocolIndex = withoutQuery.indexOf('://')
  const pathIndex = withoutQuery.indexOf('/', protocolIndex + 3)

  const querySuffix = query ? `?${query}` : ''

  if (pathIndex === -1) {
    return `${withoutQuery}/${dbName}${querySuffix}`
  }

  const hostSegment = withoutQuery.slice(0, pathIndex + 1)
  return `${hostSegment}${dbName}${querySuffix}`
}

export function resolveMongoUri() {
  const mongoUri = process.env.MONGODB_URI
  const dbName = process.env.DB_DATABASE

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required in environment variables')
  }

  return applyDatabaseNameToUri(mongoUri, dbName)
}

export async function connectDB() {
  const mongoUri = resolveMongoUri()

  await mongoose.connect(mongoUri)
  console.log('MongoDB connected')
}

export default connectDB
