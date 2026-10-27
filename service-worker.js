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
      const res = await fetch('/warm-urls.json', { cache: 'no-store' })
      if (!res.ok) return
      const urls = await res.json()
      const cache = await caches.open('pages')
      // Cache all pages in parallel
      await Promise.allSettled(
        urls.map((u) => cache.add(new Request(u, { cache: 'reload' })))
      )
    } catch (e) {
      // ignore; app still works without warming
    }
  })())
})

// 1) HTML navigation (all pages): Cache-First so refresh works offline
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new CacheFirst({
    cacheName: 'pages',
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

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/android-icon-192x192.png',
    badge: '/favicon-16x16.png',
    image,
    tag: typeof payload.tag === 'string' ? payload.tag : 'calendar-reminder',
    data: { url },
    vibrate: [120, 45, 120],
    renotify: false,
    actions: [{ action: 'open', title: 'Open' }],
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const requestedUrl = event.notification.data && event.notification.data.url
  const targetUrl = new URL(typeof requestedUrl === 'string' ? requestedUrl : '/calendar', self.location.origin)
  const isAppLink = targetUrl.origin === self.location.origin
  const isTrustedVideoLink = targetUrl.origin === 'https://www.youtube.com' &&
    targetUrl.pathname === '/watch' &&
    targetUrl.searchParams.has('v')
  if (!isAppLink && !isTrustedVideoLink) return

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
