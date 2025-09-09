// next.config.mjs
import withPWA from '@ducanh2912/next-pwa'

const isProd = process.env.NODE_ENV === 'production'

// Base Next.js config
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

export default withPWA({
  ...nextConfig,

  // PWA settings
  dest: 'public',
  disable: !isProd,               // only enable PWA in production
  register: true,                 // auto-register SW
  skipWaiting: true,              // replace old SW immediately
  cacheStartUrl: true,            // cache "/" start URL
  swSrc: 'service-worker.js',     // custom SW (we’ll create this file in /public)
  maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // raise limit (~30MB)

  // No runtimeCaching here (all logic goes in service-worker.js)
  workboxOptions: {},
})
