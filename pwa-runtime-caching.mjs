// pwa-runtime-caching.mjs
export default [
  // 1) HTML pages (App Router documents)
  {
    urlPattern: ({ request }) => request.mode === 'navigate',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
      expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
    },
  },

  // 2) Next.js build assets (precache will handle many, this is extra safety)
  {
    urlPattern: /\/_next\/static\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'next-static',
      expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },

  // 3) Images, fonts, media, etc. from your domain
  {
    urlPattern: /\.(?:png|gif|jpg|jpeg|webp|svg|ico|mp3|mp4|woff2|woff|ttf)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'assets',
      expiration: { maxEntries: 300, maxAgeSeconds: 60 * 24 * 60 * 60 },
    },
  },

  // 4) Google Fonts (stylesheets)
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: 'StaleWhileRevalidate',
    options: { cacheName: 'google-fonts-stylesheets' },
  },

  // 5) Google Fonts (actual font files)
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-webfonts',
      expiration: { maxEntries: 50, maxAgeSeconds: 365 * 24 * 60 * 60 },
    },
  },

  // 6) (Optional) bible.json if you ever move it to /public/bible.json
  {
    urlPattern: /\/bible\.json$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'data',
      expiration: { maxEntries: 5, maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },
];
