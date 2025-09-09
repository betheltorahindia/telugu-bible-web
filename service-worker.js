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
  ({ url }) => url.pathname.startsWith('/data/bible.json'),
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
