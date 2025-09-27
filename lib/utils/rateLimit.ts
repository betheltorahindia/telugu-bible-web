type RateLimitBucket = {
  count: number
  expiresAt: number
}

const GLOBAL_KEY = '__PRESENTER_RATE_LIMITS__'

type RateLimitStore = Map<string, RateLimitBucket>

const store: RateLimitStore = (globalThis as any)[GLOBAL_KEY] ?? new Map<string, RateLimitBucket>()
;(globalThis as any)[GLOBAL_KEY] = store

export function applyRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = store.get(key)

  if (!bucket || bucket.expiresAt < now) {
    store.set(key, { count: 1, expiresAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.expiresAt }
  }

  bucket.count += 1
  store.set(key, bucket)
  return { success: true, remaining: limit - bucket.count, resetAt: bucket.expiresAt }
}

