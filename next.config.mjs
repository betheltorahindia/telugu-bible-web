// next.config.mjs (ESM)
import withPWA from 'next-pwa'

const pwa = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV !== 'production', // PWA only in production
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // Cache your Bible JSON for offline reading
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/data/bible.json'),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'bible-json',
        expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
      },
    },
    // Cache HTML documents (pages) so recent pages open offline
    {
      urlPattern: ({ request }) => request.destination === 'document',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 3 }, // 3 days
      },
    },
    // Cache JS & CSS
    {
      urlPattern: ({ request }) =>
        request.destination === 'script' || request.destination === 'style',
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-assets' },
    },
    // Cache images (icons, logo)
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
      },
    },
  ],
})

// Your regular Next.js config (adjust if you need)
const nextConfig = {
  reactStrictMode: false,
}

// Export the wrapped config
export default pwa(nextConfig)
