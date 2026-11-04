import { createHash } from 'node:crypto'
import type { configureWebPush, getPushConfig, StoredPushSubscription } from './push'
import { supabaseHeaders } from './push'

type PushConfig = NonNullable<ReturnType<typeof getPushConfig>>
type WebPush = NonNullable<ReturnType<typeof configureWebPush>>

function deliveryId(endpoint: string, key: string) {
  return createHash('sha256').update(`${endpoint}\n${key}`).digest('hex')
}

async function removeSubscription(config: PushConfig, endpoint: string) {
  const params = new URLSearchParams({ endpoint: `eq.${endpoint}` })
  const response = await fetch(`${config.url}/rest/v1/push_subscriptions?${params}`, {
    method: 'DELETE',
    headers: supabaseHeaders(config.serviceKey),
  })
  if (!response.ok) console.error(`Could not remove expired push endpoint: ${response.status}`)
}

async function removeDelivery(config: PushConfig, key: string) {
  const params = new URLSearchParams({ delivery_key: `eq.${key}` })
  const response = await fetch(`${config.url}/rest/v1/notification_deliveries?${params}`, {
    method: 'DELETE',
    headers: supabaseHeaders(config.serviceKey),
  })
  if (!response.ok) console.error(`Could not release notification delivery reservation: ${response.status}`)
}

export async function sendPushOnce(
  push: WebPush,
  config: PushConfig,
  recipient: StoredPushSubscription,
  key: string,
  payload: Record<string, unknown>,
) {
  const deliveryKey = deliveryId(recipient.endpoint, key)
  const reserved = await fetch(
    `${config.url}/rest/v1/notification_deliveries?on_conflict=delivery_key`,
    {
      method: 'POST',
      headers: {
        ...supabaseHeaders(config.serviceKey),
        Prefer: 'resolution=ignore-duplicates,return=representation',
      },
      body: JSON.stringify({ delivery_key: deliveryKey }),
    },
  )
  if (!reserved.ok) {
    throw new Error(`Notification delivery reservation failed with status ${reserved.status}`)
  }
  const inserted = await reserved.json() as Array<{ delivery_key: string }>
  if (inserted.length === 0) return false

  try {
    await push.webpush.sendNotification(
      recipient.subscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    )
    return true
  } catch (error) {
    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
      ? error.statusCode
      : undefined
    await removeDelivery(config, deliveryKey)
    if (statusCode === 404 || statusCode === 410) {
      await removeSubscription(config, recipient.endpoint)
      return false
    }
    throw error
  }
}
