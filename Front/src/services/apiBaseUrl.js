const FALLBACK_API_URL = 'http://localhost:3000/api'

export function getBackendUrl() {
  const rawValue = String(import.meta.env.VITE_BACKEND_URL || '').trim()
  if (!rawValue) return FALLBACK_API_URL

  const unquoted = rawValue.replace(/^['\"]|['\"]$/g, '')
  const withProtocol = /^https?:\/\//i.test(unquoted)
    ? unquoted
    : `https://${unquoted}`

  try {
    const parsed = new URL(withProtocol)
    const pathname = parsed.pathname.replace(/\/+$/, '')

    if (!pathname || pathname === '/') {
      parsed.pathname = '/api'
    } else if (!pathname.endsWith('/api')) {
      parsed.pathname = `${pathname}/api`.replace(/\/+/g, '/')
    } else {
      parsed.pathname = pathname
    }

    return parsed.toString().replace(/\/$/, '')
  } catch {
    return FALLBACK_API_URL
  }
}
