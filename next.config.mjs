// next.config.mjs
import withPWA from '@ducanh2912/next-pwa'

const isProd = process.env.NODE_ENV === 'production'

// Regular Next.js config
const nextConfig = {
  reactStrictMode: false,
}

// Enable custom Service Worker (service-worker.js) that warms cache for full offline
export default withPWA({
  ...nextConfig,

  // PWA options (ducanh2912/next-pwa)
  dest: 'public',
  disable: !isProd,            // SW only in production
  register: true,              // auto-register SW
  skipWaiting: true,           // activate updated SW immediately
  cacheStartUrl: true,         // cache "/" start URL
  swSrc: 'service-worker.js',  // ← use our custom SW (InjectManifest mode)
  maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // allow big routes (~20MB)

  // We control runtime routes inside service-worker.js, so no runtimeCaching here.
  workboxOptions: {
    // leave empty; Workbox will inject the precache manifest into our SW
  },
})
