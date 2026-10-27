import webpush from 'web-push'

export type StoredPushSubscription = {
  endpoint: string
  subscription: webpush.PushSubscription
  timezone: string
}

export function getPushConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT

  if (!url || !serviceKey || !publicKey || !privateKey || !subject) return null

  return { url: url.replace(/\/$/, ''), serviceKey, publicKey, privateKey, subject }
}

export function configureWebPush() {
  const config = getPushConfig()
  if (!config) return null

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey)
  return { ...config, webpush }
}

export function supabaseHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }
}
