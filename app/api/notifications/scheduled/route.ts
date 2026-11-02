import { NextResponse, type NextRequest } from 'next/server'
import { sendPushOnce } from '../../../../lib/notifications/delivery'
import { getNotificationPreferences } from '../../../../lib/notifications/preferences'
import { configureWebPush, getPushConfig, supabaseHeaders, type StoredPushSubscription } from '../../../../lib/notifications/push'

export const dynamic = 'force-dynamic'

function localClock(date: Date, timezone: string) {
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
    time: `${value('hour')}:${value('minute')}`,
    minutes: Number(value('hour')) * 60 + Number(value('minute')),
  }
}

function reminderDate(date: string, localMinutes: number, scheduledMinutes: number) {
  if (localMinutes >= scheduledMinutes) return date
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10)
}

function isDue(localMinutes: number, scheduledTime: string) {
  const [hour, minute] = scheduledTime.split(':').map(Number)
  const elapsedMinutes = (localMinutes - (hour * 60 + minute) + 1440) % 1440
  return elapsedMinutes <= 15
}

async function loadSubscriptions(
  config: NonNullable<ReturnType<typeof getPushConfig>>,
): Promise<StoredPushSubscription[]> {
  const all: StoredPushSubscription[] = []
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(
      `${config.url}/rest/v1/push_subscriptions?select=endpoint,subscription,timezone,preferences`,
      { headers: { ...supabaseHeaders(config.serviceKey), Range: `${offset}-${offset + 999}` } },
    )
    if (!response.ok) {
      throw new Error(`Push subscription lookup failed with status ${response.status}`)
    }
    const page = await response.json() as Array<Omit<StoredPushSubscription, 'preferences'> & { preferences?: unknown }>
    all.push(...page.map((subscription) => ({
      ...subscription,
      preferences: getNotificationPreferences(subscription.preferences),
    })))
    if (page.length < 1000) return all
  }
}

const prayerReminders = [
  {
    key: 'morning',
    title: 'A quiet moment for morning prayer',
    body: 'Begin the day with your morning prayers and a little space for reflection.',
  },
  {
    key: 'afternoon',
    title: 'A pause for afternoon prayer',
    body: 'Take a thoughtful pause for your afternoon prayers amid the day’s work.',
  },
  {
    key: 'evening',
    title: 'An evening moment of prayer',
    body: 'Set aside a few peaceful minutes for your evening prayers.',
  },
  {
    key: 'night',
    title: 'Close the day with prayer',
    body: 'Before the day ends, make a quiet moment for your night prayers.',
  },
] as const

const psalmInvitations = [
  'If you have a free moment, read five Psalms and spend a little time with Scripture.',
  'A quiet pause can make room for five Psalms. Read at your own pace whenever you are free.',
  'When a few minutes open up, consider reading five Psalms and reflecting on their words.',
] as const

function psalmReminder(date: string, index: number) {
  const day = Number(date.replaceAll('-', ''))
  const text = psalmInvitations[(day + index) % psalmInvitations.length]
  return {
    title: 'A little time with Psalms',
    body: text,
    url: '/book/19',
    tag: `psalm-invitation-${date}-${index + 1}`,
  }
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
  const failures: string[] = []

  await Promise.all(subscriptions.map(async (recipient) => {
    const timezone = recipient.timezone || 'UTC'
    let local: ReturnType<typeof localClock>
    try {
      local = localClock(now, timezone)
    } catch (error) {
      console.error(`Invalid notification timezone for a push subscriber.`, error)
      return
    }
    const { preferences } = recipient
    const due: Array<{ key: string; payload: Record<string, string>; kind: 'prayer' | 'psalm' }> = []

    if (preferences.prayers) {
      for (const reminder of prayerReminders) {
        const scheduledTime = preferences.prayerTimes[reminder.key]
        if (!isDue(local.minutes, scheduledTime)) continue
        const [hour, minute] = scheduledTime.split(':').map(Number)
        const scheduledDate = reminderDate(local.date, local.minutes, hour * 60 + minute)
        due.push({
          key: `prayer-${scheduledDate}-${reminder.key}`,
          kind: 'prayer',
          payload: {
            title: reminder.title,
            body: reminder.body,
            url: '/prayers',
            tag: `prayer-${local.date}-${reminder.key}`,
          },
        })
      }
    }
    if (preferences.psalms) {
      preferences.psalmTimes.forEach((time, index) => {
        if (!isDue(local.minutes, time)) return
        const [hour, minute] = time.split(':').map(Number)
        const scheduledDate = reminderDate(local.date, local.minutes, hour * 60 + minute)
        due.push({
          key: `psalms-${scheduledDate}-${index + 1}`,
          kind: 'psalm',
          payload: psalmReminder(scheduledDate, index),
        })
      })
    }

    await Promise.all(due.map(async ({ key, payload, kind }) => {
      try {
        const sent = await sendPushOnce(push, config, recipient, key, payload)
        if (sent && kind === 'prayer') prayerSent += 1
        if (sent && kind === 'psalm') psalmSent += 1
      } catch (error) {
        console.error(`Scheduled ${kind} notification failed.`, error)
        failures.push(kind)
      }
    }))
  }))

  return NextResponse.json({
    subscribers: subscriptions.length,
    prayerRemindersSent: prayerSent,
    psalmRemindersSent: psalmSent,
    failures: failures.length,
  })
}
