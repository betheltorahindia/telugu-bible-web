import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getPushConfig, supabaseHeaders } from '../../../../lib/notifications/push'
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
})

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return origin !== null && new URL(origin).host === request.nextUrl.host
}

function isTrustedPushEndpoint(endpoint: string) {
  const hostname = new URL(endpoint).hostname.toLowerCase()
  return hostname === 'fcm.googleapis.com' ||
    hostname.endsWith('.push.services.mozilla.com') ||
    hostname.endsWith('.push.apple.com') ||
    hostname.endsWith('.notify.windows.com')
}

function isRateLimited(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  return !applyRateLimit(`push-subscription:${ip}`, 12, 60_000).success
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
    }),
  })

  if (!response.ok) {
    console.error(`Push subscription storage failed with status ${response.status}`)
    return NextResponse.json({ error: 'Could not save this device’s notification settings.' }, { status: 502 })
  }
  return NextResponse.json({ enabled: true })
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
