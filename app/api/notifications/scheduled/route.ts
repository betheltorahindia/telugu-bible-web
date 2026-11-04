import { NextResponse, type NextRequest } from 'next/server'
import { CUSTOM_NOTIFICATIONS } from '../../../../lib/notifications/custom-notifications'
import { sendPushOnce } from '../../../../lib/notifications/delivery'
import { getNotificationPreferences } from '../../../../lib/notifications/preferences'
import { configureWebPush, getPushConfig, supabaseHeaders, type StoredPushSubscription } from '../../../../lib/notifications/push'

export const dynamic = 'force-dynamic'

const PRAYER_REMINDERS = [
  {
    key: 'morning',
    time: '08:00',
    title: 'A new day, a quiet moment with prayer',
    body: 'Begin your morning with prayer and a few moments of reflection.',
    url: '/prayers/morning',
  },
  {
    key: 'afternoon',
    time: '14:00',
    title: 'Pause and make room for prayer',
    body: 'Take a peaceful pause for your afternoon prayer.',
    url: '/prayers/afternoon',
  },
  {
    key: 'evening',
    time: '18:00',
    title: 'Let the evening settle with prayer',
    body: 'Step away for a moment and spend time in your evening prayer.',
    url: '/prayers/evening',
  },
  {
    key: 'night',
    time: '22:00',
    title: 'End the day with a moment of prayer',
    body: 'Close the day gently with your night prayer.',
    url: '/prayers/night',
  },
] as const

const PSALM_INVITATIONS = [
  {
    title: 'A little room for a Psalm?',
    body: 'If a quiet moment opens up, spend it with a Psalm and let its words stay with you.',
  },
  {
    title: 'Pause for a few lines of Scripture',
    body: 'Five Psalms are waiting whenever you have a little time to read and reflect.',
  },
  {
    title: 'A peaceful pause, one Psalm at a time',
    body: 'Take a few minutes for five Psalms whenever it fits your day.',
  },
] as const

type LocalTime = {
  date: string
  minutes: number
}

async function loadSubscriptions(
  config: NonNullable<ReturnType<typeof getPushConfig>>,
): Promise<StoredPushSubscription[]> {
  const subscriptions: StoredPushSubscription[] = []
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(
      `${config.url}/rest/v1/push_subscriptions?select=endpoint,subscription,timezone,preferences`,
      { headers: { ...supabaseHeaders(config.serviceKey), Range: `${offset}-${offset + 999}` } },
    )
    if (!response.ok) throw new Error(`Push subscriber lookup failed with status ${response.status}`)

    const page = await response.json() as Array<Omit<StoredPushSubscription, 'preferences'> & { preferences?: unknown }>
    subscriptions.push(...page.map((subscription) => ({
      ...subscription,
      preferences: getNotificationPreferences(subscription.preferences),
    })))
    if (page.length < 1000) return subscriptions
  }
}

function localTime(date: Date, timezone: string): LocalTime {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    minutes: Number(value('hour')) * 60 + Number(value('minute')),
  }
}

function minutesOfDay(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function isDue(localMinutes: number, time: string) {
  return localMinutes >= minutesOfDay(time) && localMinutes < minutesOfDay(time) + 10
}

function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function psalmTime(endpoint: string, date: string, slot: number) {
  const windows = [
    { start: 10 * 60, end: 12 * 60 - 15 },
    { start: 15 * 60, end: 17 * 60 - 15 },
    { start: 19 * 60, end: 20 * 60 - 15 },
  ]
  const window = windows[slot]
  const quarterHours = Math.floor((window.end - window.start) / 15) + 1
  return window.start + (stableHash(`${endpoint}:${date}:${slot}`) % quarterHours) * 15
}

function customNotificationDue(sendAt: string, now: Date) {
  const timestamp = Date.parse(sendAt)
  return Number.isFinite(timestamp) && now.getTime() >= timestamp && now.getTime() < timestamp + 10 * 60_000
}

function validSendAt(sendAt: string) {
  return Number.isFinite(Date.parse(sendAt))
}

function validNotificationUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

async function deliver(
  push: NonNullable<ReturnType<typeof configureWebPush>>,
  config: NonNullable<ReturnType<typeof getPushConfig>>,
  recipient: StoredPushSubscription,
  key: string,
  payload: Record<string, unknown>,
) {
  return sendPushOnce(push, config, recipient, key, payload)
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const config = getPushConfig()
  const push = configureWebPush()
  if (!config || !push) {
    return NextResponse.json({ error: 'Push notifications are not configured on this server.' }, { status: 503 })
  }

  let subscriptions: StoredPushSubscription[]
  try {
    subscriptions = await loadSubscriptions(config)
  } catch (error) {
    console.error('Could not load scheduled notification subscribers.', error)
    return NextResponse.json({ error: 'Could not load notification subscribers.' }, { status: 502 })
  }

  const now = new Date()
  let prayerSent = 0
  let psalmSent = 0
  let customSent = 0
  let deliveryFailures = 0

  const recordDelivery = (
    task: Promise<boolean>,
    onSuccess: () => void,
  ) => task.then((sent) => {
    if (sent) onSuccess()
  }).catch((error: unknown) => {
    deliveryFailures += 1
    console.error('Scheduled push notification delivery failed.', error)
  })

  await Promise.all(subscriptions.map(async (recipient) => {
    let local: LocalTime
    try {
      local = localTime(now, recipient.timezone || 'UTC')
    } catch (error) {
      deliveryFailures += 1
      console.error('Invalid timezone for a push subscriber.', error)
      return
    }

    const tasks: Array<Promise<void>> = []
    if (recipient.preferences.prayers) {
      for (const reminder of PRAYER_REMINDERS) {
        if (!isDue(local.minutes, reminder.time)) continue
        tasks.push(recordDelivery(deliver(push, config, recipient, `prayer-${local.date}-${reminder.key}`, {
          title: reminder.title,
          body: reminder.body,
          url: reminder.url,
          tag: `prayer-${local.date}-${reminder.key}`,
          actions: [
            { action: 'open', title: 'Open' },
            { action: 'done', title: 'Already done' },
          ],
        }), () => { prayerSent += 1 }))
      }
    }

    if (recipient.preferences.psalms) {
      for (let slot = 0; slot < 3; slot += 1) {
        const scheduledMinutes = psalmTime(recipient.endpoint, local.date, slot)
        if (local.minutes < scheduledMinutes || local.minutes >= scheduledMinutes + 10) continue
        const reminder = PSALM_INVITATIONS[stableHash(`${recipient.endpoint}:${local.date}:text:${slot}`) % PSALM_INVITATIONS.length]
        tasks.push(recordDelivery(deliver(push, config, recipient, `psalms-${local.date}-${slot + 1}`, {
          title: reminder.title,
          body: reminder.body,
          url: '/book/19',
          tag: `psalms-${local.date}-${slot + 1}`,
          actions: [{ action: 'open', title: 'Read Psalms' }],
        }), () => { psalmSent += 1 }))
      }
    }

    if (recipient.preferences.custom) {
      for (const notification of CUSTOM_NOTIFICATIONS) {
        if (!notification.enabled) continue
        if (!validSendAt(notification.sendAt)) {
          deliveryFailures += 1
          console.error(`Custom notification "${notification.id}" has an invalid send time.`)
          continue
        }
        if (!customNotificationDue(notification.sendAt, now)) continue
        if (!validNotificationUrl(notification.url)) {
          deliveryFailures += 1
          console.error(`Custom notification "${notification.id}" has an invalid URL.`)
          continue
        }
        tasks.push(recordDelivery(deliver(push, config, recipient, `custom-${notification.id}`, {
          title: notification.title,
          body: notification.body,
          url: notification.url,
          tag: `custom-${notification.id}`,
          actions: [{ action: 'open', title: 'Open' }],
        }), () => { customSent += 1 }))
      }
    }

    await Promise.all(tasks)
  }))

  const result = {
    subscribers: subscriptions.length,
    prayerNotificationsSent: prayerSent,
    psalmNotificationsSent: psalmSent,
    customNotificationsSent: customSent,
    customNotificationsConfigured: CUSTOM_NOTIFICATIONS.filter((notification) => notification.enabled).length,
    deliveryFailures,
  }
  return NextResponse.json(
    deliveryFailures > 0
      ? { ...result, error: 'Some scheduled notifications could not be processed; see server logs and retry.' }
      : result,
    { status: deliveryFailures > 0 ? 502 : 200 },
  )
}
