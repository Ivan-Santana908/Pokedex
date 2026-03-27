const CACHE_VERSION = 'v10'
const APP_SHELL_CACHE = `pokedex-app-shell-${CACHE_VERSION}`
const DYNAMIC_CACHE = `pokedex-dynamic-${CACHE_VERSION}`
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/pokeball-icon-192.svg',
  '/pokeball-icon-512.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(urlsToCache))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (![APP_SHELL_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
            return caches.delete(cacheName)
          }
          return undefined
        })
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const requestUrl = new URL(event.request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin
  const isNavigateRequest = event.request.mode === 'navigate'
  const isAppShellRequest = isSameOrigin && urlsToCache.includes(requestUrl.pathname)

  // No interceptar tráfico cross-origin (API Railway, socket.io, CDN).
  if (!isSameOrigin) return

  // Para rutas de SPA (/pokemon, /teams, etc): network-first con fallback a /index.html.
  // Evita pantalla blanca en PWA standalone cuando hay navegación directa.
  if (isNavigateRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, clonedResponse)
          })
          return response
        })
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html')
          if (cachedIndex) return cachedIndex
          const cachedRoot = await caches.match('/')
          if (cachedRoot) return cachedRoot
          return new Response('Offline - App shell no disponible', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          })
        })
    )
    return
  }

  if (event.request.url.includes('pokeapi.co')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, clonedResponse)
          })
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }

  if (isAppShellRequest) {
    // Para app shell preferir network-first para evitar HTML/manifest obsoleto
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone()
          caches.open(APP_SHELL_CACHE).then((cache) => {
            cache.put(event.request, clonedResponse)
          })
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200) {
          return fetchResponse
        }

        const clonedResponse = fetchResponse.clone()
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, clonedResponse)
        })

        return fetchResponse
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          return (
            cachedResponse ||
            new Response('Offline - Recurso no disponible', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            })
          )
        })
      )
  )
})

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Pokedex Notification',
    body: 'You have a new notification',
    data: {},
  }

  if (event.data) {
    try {
      payload = JSON.parse(event.data.text())
    } catch {
      payload.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pokeball-icon-192.svg',
      badge: '/pokeball-icon-192.svg',
      data: payload.data || {},
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetPath = event.notification?.data?.path || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        const url = new URL(client.url)
        if (url.pathname === targetPath && 'focus' in client) {
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetPath)
      }

      return undefined
    })
  )
})
