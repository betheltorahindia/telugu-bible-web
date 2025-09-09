/* public/service-worker.js */
/* eslint-disable no-undef */

// --- Basic SW lifecycle ------------------------------------------------------
self.skipWaiting();
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Take control immediately
    await self.clients.claim();
    // Warm the cache right after install/activate
    await warmCache();
  })());
});

// --- Workbox (injected by @ducanh2912/next-pwa) ------------------------------
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Helpful logs (you can remove later)
const log = (...a) => console.log('[SW]', ...a);

// --- Cache strategies --------------------------------------------------------

// 1) Page navigations (HTML)
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
);

// 2) Next build assets
workbox.routing.registerRoute(
  /\/_next\/static\/.*/i,
  new workbox.strategies.CacheFirst({
    cacheName: 'next-static',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);

// 3) Images / fonts / media on same origin
workbox.routing.registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    /\.(?:png|gif|jpg|jpeg|webp|svg|ico|mp3|mp4|woff2|woff|ttf)$/.test(url.pathname),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 24 * 60 * 60,
      }),
    ],
  }),
);

// 4) bible.json
workbox.routing.registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/data/bible.json'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'bible-json',
  }),
);

// --- Warm the cache with all book/chapter routes -----------------------------

async function buildAllUrls() {
  // Fetch your bundled bible.json to know how many chapters exist
  const res = await fetch(new URL('/data/bible.json', self.location.origin), { cache: 'reload' });
  const data = await res.json();

  const urls = new Set();
  urls.add('/');          // home
  urls.add('/search');    // search page (optional)

  const books = data?.books || [];
  for (const b of books) {
    urls.add(`/book/${b.bnumber}`);
    for (const ch of (b.chapters || [])) {
      urls.add(`/book/${b.bnumber}/chapter/${ch.cnumber}`);
    }
  }

  // Convert to absolute URLs for caching
  return Array.from(urls).map((p) => new URL(p, self.location.origin).toString());
}

async function warmCache() {
  try {
    log('Warming cache…');
    const cache = await caches.open('pages');
    const urls = await buildAllUrls();

    // Fetch with {cache:'reload'} to ensure the SW actually stores fresh responses
    await Promise.allSettled(
      urls.map((u) => fetch(u, { cache: 'reload' }).then((r) => r.ok && cache.put(u, r.clone()))),
    );

    // Also keep bible.json itself
    const bibleUrl = new URL('/data/bible.json', self.location.origin).toString();
    try {
      const r = await fetch(bibleUrl, { cache: 'reload' });
      if (r.ok) {
        const bj = await caches.open('bible-json');
        await bj.put(bibleUrl, r.clone());
      }
    } catch {}

    log('Cache warm complete.');
  } catch (e) {
    log('Warm cache failed:', e);
  }
}

// Optional: allow the UI to trigger warming again
self.addEventListener('message', (event) => {
  if (event.data === 'warm-cache') {
    event.waitUntil(warmCache());
  }
});
