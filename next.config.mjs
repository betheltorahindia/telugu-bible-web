// next.config.mjs
import withPWAInit from '@ducanh2912/next-pwa'

const isProd = process.env.NODE_ENV === 'production'

// Base Next.js config
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  devIndicators: {
    buildActivity: false,
  },
}

const withPWA = withPWAInit({
  dest: 'public',
  disable: !isProd,
  register: true,
  skipWaiting: true,
  cacheStartUrl: true,
  buildExcludes: [
    /middleware-manifest\.json$/,
    /_next\/static\/chunks\/app\/search\//,
    /_next\/static\/chunks\/906-/,
  ],
  workboxOptions: {
    swSrc: 'service-worker.js',
    maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
  },
})

export default withPWA(nextConfig)
