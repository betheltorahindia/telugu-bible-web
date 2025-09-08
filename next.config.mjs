// next.config.mjs
import withPWA from '@ducanh2912/next-pwa'

const isDev = process.env.NODE_ENV !== 'production'

// Put any regular Next config here
const nextConfig = {
  reactStrictMode: false,
}

export default withPWA({
  // Keep your base config
  ...nextConfig,

  // PWA options
  dest: 'public',          // where the SW/workbox files will be generated
  disable: isDev,          // enable SW only in production
  register: true,          // auto-register the SW
  skipWaiting: true,       // activate new SW immediately on next load
  cacheStartUrl: true,     // cache the start URL (/)

  // If you add an offline page at /app/offline/page.tsx, uncomment:
  // fallbacks: { document: '/offline' },

  // Runtime caching rules
  runtimeCaching: [
    // 1) HTML pages (App Router "navigate" requests)
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }, // 7 days
      },
    },

    // 2) Next.js build assets (additional safety; precache already covers most)
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 days
      },
    },

    // 3) Images / fonts / media served from your domain
    {
      urlPattern: /\.(?:png|gif|jpg|jpeg|webp|svg|ico|mp3|mp4|woff2|woff|ttf)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'assets',
        expiration: { maxEntries: 300, maxAgeSeconds: 60 * 24 * 60 * 60 }, // 60 days
      },
    },

    // 4) Google Fonts (stylesheets)
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-fonts-stylesheets' },
    },

    // 5) Google Fonts (font files)
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: { maxEntries: 50, maxAgeSeconds: 365 * 24 * 60 * 60 }, // 1 year
      },
    },
  ],
})
