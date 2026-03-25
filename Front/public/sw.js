const CACHE_VERSION = 'v6'
const APP_SHELL_CACHE = `pokedex-app-shell-${CACHE_VERSION}`
const DYNAMIC_CACHE = `pokedex-dynamic-${CACHE_VERSION}`
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
]

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(cache => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![APP_SHELL_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)
  const isAppShellRequest =
    requestUrl.origin === self.location.origin &&
    urlsToCache.includes(requestUrl.pathname)

  // Para API calls, usar network first y cache dinámico
  if (event.request.url.includes('pokeapi.co')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone()
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, clonedResponse)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request)
        })
    )
    return
  }

  // Para APP SHELL, cache first
  if (isAppShellRequest) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request)
      })
    )
    return
  }

  // Para otros recursos, cache dinámico (cache first con fallback a red)
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        if (!fetchResponse || fetchResponse.status !== 200) {
          return fetchResponse
        }

        const clonedResponse = fetchResponse.clone()
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(event.request, clonedResponse)
        })
        return fetchResponse
      }).catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || new Response('Offline - Recurso no disponible', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          })
        })
      })
    })
  )
})

self.addEventListener('push', event => {
  let payload = {
    title: 'Pokedex Notification',
    body: 'You have a new notification',
    data: {}
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
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {}
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const targetPath = event.notification?.data?.path || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
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
