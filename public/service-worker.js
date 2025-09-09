/* eslint-disable no-undef */
/**
 * Service Worker for Tanach | Telugu
 * - Precache Next.js build assets (injected by Workbox)
 * - Runtime caching for pages, bible.json, static assets, images/fonts
 * - Background “warm up” of all book/chapter routes after activation
 */

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

self.skipWaiting()
clientsClaim()

// -------------- Precache Next.js build assets -----------------
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// -------------- Runtime caching rules -------------------------

// HTML navigations (pages)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }) // 7 days
    ],
  })
)

// Bible JSON (make sure /data/bible.json exists)
registerRoute(
  ({ url, request }) =>
    url.pathname.endsWith('/data/bible.json') ||
    url.pathname.includes('/data/') && url.pathname.endsWith('.json'),
  new CacheFirst({
    cacheName: 'bible-json',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 days
    ],
  })
)

// JS & CSS
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({ cacheName: 'static-assets' })
)

// Images & fonts
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'media',
    plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 24 * 60 * 60 })], // 60 days
  })
)

// -------------- Background warm-up of all routes ---------------
/**
 * Fetch bible.json, derive all book + chapter URLs, and add them
 * to the 'pages' cache. This runs AFTER activation so it won't block
 * the SW install. It makes the whole app available offline.
 */
async function warmAllContent () {
  try {
    const scope = self.registration.scope // e.g. https://yourdomain.com/
    const base = scope.endsWith('/') ? scope : scope + '/'
    const bibleRes = await fetch(base + 'data/bible.json', { cache: 'reload' })
    const bible = await bibleRes.json()

    // Build route list
    const urls = new Set()
    urls.add(base)              // home
    urls.add(base + 'search')   // search (optional)

    const books = bible?.books || []
    for (const b of books) {
      const bn = b.bnumber
      urls.add(`${base}book/${bn}`)
      for (const ch of (b.chapters || [])) {
        urls.add(`${base}book/${bn}/chapter/${ch.cnumber}`)
      }
    }

    const cache = await caches.open('pages')
    // Add in batches to avoid request burst limits on some devices
    const all = Array.from(urls)
    const chunkSize = 40
    for (let i = 0; i < all.length; i += chunkSize) {
      const chunk = all.slice(i, i + chunkSize)
      await Promise.allSettled(chunk.map(u => cache.add(u).catch(() => null)))
    }
  } catch (e) {
    // Swallow errors — offline warm-up is best-effort
  }
}

// Warm cache after activation (doesn't block activation)
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => { await warmAllContent() })())
})

// Optional: allow the UI to trigger a warm-up manually
self.addEventListener('message', (event) => {
  if (event.data === 'warm-cache') {
    event.waitUntil(warmAllContent())
  }
})
