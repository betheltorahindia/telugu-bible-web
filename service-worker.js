/* eslint-disable no-undef */
// service-worker.js
import {precacheAndRoute} from 'workbox-precaching'
import {registerRoute, setCatchHandler} from 'workbox-routing'
import {CacheFirst, StaleWhileRevalidate, NetworkFirst} from 'workbox-strategies'
import {clientsClaim, setCacheNameDetails} from 'workbox-core'

setCacheNameDetails({ prefix: 'tanach-te' })

self.skipWaiting()
clientsClaim()

// Precache build assets (Next bundles, etc.)
precacheAndRoute(self.__WB_MANIFEST || [])

// Warm the cache with our full URL list once, at activate
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      await caches.delete('pages')
      const cache = await caches.open('pages-v2')
      const res = await fetch('/warm-urls.json', { cache: 'no-store' })
      if (!res.ok) return
      const urls = await res.json()
      await Promise.allSettled(
        urls.map((u) => cache.add(new Request(u, { cache: 'reload' })))
      )
    } catch (e) {
      // ignore; app still works without warming
    }
  })())
})

// 1) Prefer fresh HTML while retaining a cache for offline navigation.
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-v2',
    networkTimeoutSeconds: 5,
    matchOptions: { ignoreVary: true },
  })
)

// 2) Bible JSON: Cache-First (never blocked offline)
registerRoute(
  ({ url }) => url.pathname.startsWith('/data/') && url.pathname.endsWith('.json'),
  new CacheFirst({ cacheName: 'bible-json' })
)

// 3) Static assets (JS/CSS): SWR for updates, quick loads
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({ cacheName: 'assets' })
)

// 4) Images/icons: SWR
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({ cacheName: 'images' })
)

// Optional: fallback if something is missing offline
setCatchHandler(async ({ event }) => {
  if (event.request.destination === 'document') {
    return caches.match('/') // fallback to Home
  }
  return Response.error()
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json()
  const title = typeof payload.title === 'string' ? payload.title : 'Bethel Torah India'
  const body = typeof payload.body === 'string' ? payload.body : 'There is a new calendar reminder.'
  const url = typeof payload.url === 'string' ? payload.url : '/calendar'
  const image = typeof payload.image === 'string' ? payload.image : undefined
  const actions = Array.isArray(payload.actions)
    ? payload.actions
        .filter((action) =>
          action &&
          (action.action === 'open' || action.action === 'done') &&
          typeof action.title === 'string',
        )
        .slice(0, 2)
    : [{ action: 'open', title: 'Open' }]

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/android-icon-192x192.png',
    badge: '/favicon-16x16.png',
    image,
    tag: typeof payload.tag === 'string' ? payload.tag : 'calendar-reminder',
    data: { url },
    lang: typeof payload.lang === 'string' ? payload.lang : 'en',
    dir: 'auto',
    vibrate: [120, 45, 120],
    renotify: false,
    actions,
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'done') return
  const requestedUrl = event.notification.data && event.notification.data.url
  let targetUrl
  try {
    targetUrl = new URL(typeof requestedUrl === 'string' ? requestedUrl : '/calendar', self.location.origin)
  } catch {
    return
  }
  const isAppLink = targetUrl.origin === self.location.origin
  if (!isAppLink && targetUrl.protocol !== 'https:') return

  event.waitUntil((async () => {
    if (!isAppLink) {
      await self.clients.openWindow(targetUrl.href)
      return
    }
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if ('focus' in client) {
        await client.navigate(targetUrl.href)
        return client.focus()
      }
    }
    return self.clients.openWindow(targetUrl.href)
  })())
})
