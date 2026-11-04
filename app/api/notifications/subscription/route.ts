import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getPushConfig, supabaseHeaders } from '../../../../lib/notifications/push'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferencesSchema,
  getNotificationPreferences,
} from '../../../../lib/notifications/preferences'
import { applyRateLimit } from '../../../../lib/utils/rateLimit'

const SubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  timezone: z.string().min(1).max(100).refine((timezone) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone })
      return true
    } catch {
      return false
    }
  }),
  keys: z.object({
    p256dh: z.string().min(32).max(256),
    auth: z.string().min(16).max(128),
  }),
  preferences: NotificationPreferencesSchema.optional(),
})

const UpdatePreferencesSchema = z.object({
  endpoint: z.string().url().max(2048),
  preferences: NotificationPreferencesSchema,
})

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return origin !== null && new URL(origin).host === request.nextUrl.host
}

function isTrustedPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:') return false
    const hostname = url.hostname.toLowerCase()
    return hostname === 'fcm.googleapis.com' ||
      hostname.endsWith('.push.services.mozilla.com') ||
      hostname.endsWith('.push.apple.com') ||
      hostname.endsWith('.notify.windows.com')
  } catch {
    return false
  }
}

function isRateLimited(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  return !applyRateLimit(`push-subscription:${ip}`, 12, 60_000).success
}

export async function GET(request: NextRequest) {
  const config = getPushConfig()
  if (!config) {
    return NextResponse.json({ error: 'Push notifications are not configured on this server.' }, { status: 503 })
  }
  const endpoint = request.nextUrl.searchParams.get('endpoint')
  if (!endpoint || endpoint.length > 2048 || !isTrustedPushEndpoint(endpoint)) {
    return NextResponse.json({ error: 'A valid push endpoint is required.' }, { status: 400 })
  }
  const params = new URLSearchParams({ select: 'preferences', endpoint: `eq.${endpoint}`, limit: '1' })
  const response = await fetch(`${config.url}/rest/v1/push_subscriptions?${params}`, {
    headers: supabaseHeaders(config.serviceKey),
    cache: 'no-store',
  })
  if (!response.ok) {
    console.error(`Push preference lookup failed with status ${response.status}`)
    return NextResponse.json({ error: 'Could not load this device’s notification settings.' }, { status: 502 })
  }
  const [record] = await response.json() as Array<{ preferences?: unknown }>
  if (!record) {
    return NextResponse.json({ error: 'This device’s push subscription is not registered. Turn notifications on again.' }, { status: 404 })
  }
  return NextResponse.json({ preferences: getNotificationPreferences(record.preferences) })
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin could not be verified.' }, { status: 403 })
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ error: 'Too many notification requests. Please try again shortly.' }, { status: 429 })
  }

  const config = getPushConfig()
  if (!config) {
    return NextResponse.json({ error: 'Push notifications are not configured on this server.' }, { status: 503 })
  }

  const parsed = SubscriptionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !isTrustedPushEndpoint(parsed.data.endpoint)) {
    return NextResponse.json({ error: 'A valid push subscription is required.' }, { status: 400 })
  }

  const response = await fetch(`${config.url}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(config.serviceKey),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      endpoint: parsed.data.endpoint,
      subscription: { endpoint: parsed.data.endpoint, keys: parsed.data.keys },
      timezone: parsed.data.timezone,
      preferences: parsed.data.preferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
    }),
  })

  if (!response.ok) {
    console.error(`Push subscription storage failed with status ${response.status}`)
    return NextResponse.json({ error: 'Could not save this device’s notification settings.' }, { status: 502 })
  }
  return NextResponse.json({ enabled: true })
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin could not be verified.' }, { status: 403 })
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ error: 'Too many notification requests. Please try again shortly.' }, { status: 429 })
  }
  const config = getPushConfig()
  if (!config) {
    return NextResponse.json({ error: 'Push notifications are not configured on this server.' }, { status: 503 })
  }
  const parsed = UpdatePreferencesSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !isTrustedPushEndpoint(parsed.data.endpoint)) {
    return NextResponse.json({ error: 'Valid notification settings and a push endpoint are required.' }, { status: 400 })
  }

  const params = new URLSearchParams({ endpoint: `eq.${parsed.data.endpoint}` })
  const response = await fetch(`${config.url}/rest/v1/push_subscriptions?${params}`, {
    method: 'PATCH',
    headers: {
      ...supabaseHeaders(config.serviceKey),
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ preferences: parsed.data.preferences }),
  })
  if (!response.ok) {
    console.error(`Push preference update failed with status ${response.status}`)
    return NextResponse.json({ error: 'Could not save this device’s notification settings.' }, { status: 502 })
  }
  const updated = await response.json() as Array<{ endpoint: string }>
  if (updated.length === 0) {
    return NextResponse.json({ error: 'This device’s push subscription is no longer registered. Turn notifications on again.' }, { status: 404 })
  }
  return NextResponse.json({ saved: true })
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin could not be verified.' }, { status: 403 })
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ error: 'Too many notification requests. Please try again shortly.' }, { status: 429 })
  }

  const config = getPushConfig()
  if (!config) {
    return NextResponse.json({ error: 'Push notifications are not configured on this server.' }, { status: 503 })
  }

  const parsed = z.object({ endpoint: z.string().url().max(2048) }).safeParse(
    await request.json().catch(() => null),
  )
  if (!parsed.success || !isTrustedPushEndpoint(parsed.data.endpoint)) {
    return NextResponse.json({ error: 'A valid push endpoint is required.' }, { status: 400 })
  }

  const params = new URLSearchParams({ endpoint: `eq.${parsed.data.endpoint}` })
  const response = await fetch(`${config.url}/rest/v1/push_subscriptions?${params}`, {
    method: 'DELETE',
    headers: supabaseHeaders(config.serviceKey),
  })
  if (!response.ok) {
    console.error(`Push subscription removal failed with status ${response.status}`)
    return NextResponse.json({ error: 'Could not turn off notifications for this device.' }, { status: 502 })
  }
  return NextResponse.json({ enabled: false })
}
