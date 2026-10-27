import { NextResponse, type NextRequest } from 'next/server'
import { getHebcalMonth, type CalendarEvent } from '../../../../lib/calendar/hebcal'
import { YOUTUBE } from '../../../../lib/social/social-data'
import { configureWebPush, getPushConfig, supabaseHeaders, type StoredPushSubscription } from '../../../../lib/notifications/push'

export const dynamic = 'force-dynamic'

type CalendarReminder = {
  dateKey: string
  recipients: StoredPushSubscription[]
  isToday: boolean
}

type YouTubeSearchResponse = {
  items?: Array<{ id?: { videoId?: string } }>
}

type YouTubeVideosResponse = {
  items?: Array<{
    id: string
    snippet?: {
      title?: string
      description?: string
      thumbnails?: {
        maxres?: { url?: string }
        high?: { url?: string }
        medium?: { url?: string }
      }
    }
    liveStreamingDetails?: { scheduledStartTime?: string }
  }>
}

function getDateKey(timezone: string, offsetDays: number) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => Number(parts.find((value) => value.type === type)?.value)
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day') + offsetDays))
    .toISOString()
    .slice(0, 10)
}

async function loadSubscriptions(
  config: NonNullable<ReturnType<typeof getPushConfig>>,
): Promise<StoredPushSubscription[]> {
  const subscriptions: StoredPushSubscription[] = []
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(
      `${config.url}/rest/v1/push_subscriptions?select=endpoint,subscription,timezone`,
      { headers: { ...supabaseHeaders(config.serviceKey), Range: `${offset}-${offset + 999}` } },
    )
    if (!response.ok) {
      throw new Error(`Push subscription lookup failed with status ${response.status}`)
    }
    const page = (await response.json()) as StoredPushSubscription[]
    subscriptions.push(...page)
    if (page.length < 1000) return subscriptions
  }
}

async function removeExpiredSubscription(
  config: NonNullable<ReturnType<typeof getPushConfig>>,
  endpoint: string,
) {
  const params = new URLSearchParams({ endpoint: `eq.${endpoint}` })
  const response = await fetch(`${config.url}/rest/v1/push_subscriptions?${params}`, {
    method: 'DELETE',
    headers: supabaseHeaders(config.serviceKey),
  })
  if (!response.ok) console.error(`Could not remove expired push endpoint: ${response.status}`)
}

async function sendPush(
  push: NonNullable<ReturnType<typeof configureWebPush>>,
  config: NonNullable<ReturnType<typeof getPushConfig>>,
  recipients: StoredPushSubscription[],
  payload: Record<string, string>,
) {
  const results = await Promise.allSettled(recipients.map(async ({ endpoint, subscription }) => {
    try {
      await push.webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 60 * 60 * 24 })
      return true
    } catch (error) {
      const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
        ? error.statusCode
        : undefined
      if (statusCode === 404 || statusCode === 410) {
        await removeExpiredSubscription(config, endpoint)
        return false
      }
      console.error('Push notification delivery failed.', error)
      return false
    }
  }))
  return results.filter((result) => result.status === 'fulfilled' && result.value).length
}

function reminderLabel(events: CalendarEvent[]) {
  return events.map((event) => event.title).join(' · ').slice(0, 180)
}

async function notifyUpcomingYouTubeLives(
  config: NonNullable<ReturnType<typeof getPushConfig>>,
  push: NonNullable<ReturnType<typeof configureWebPush>>,
  recipients: StoredPushSubscription[],
) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || recipients.length === 0) return 0

  const searchParams = new URLSearchParams({
    part: 'snippet',
    channelId: YOUTUBE.channelId,
    eventType: 'upcoming',
    type: 'video',
    maxResults: '10',
    key: apiKey,
  })
  const searchResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${searchParams}`,
    { cache: 'no-store' },
  )
  if (!searchResponse.ok) {
    console.error(`YouTube scheduled-live lookup failed with status ${searchResponse.status}`)
    return 0
  }
  const searchData = (await searchResponse.json()) as YouTubeSearchResponse
  const videoIds = [...new Set(
    (searchData.items ?? [])
      .map((item) => item.id?.videoId)
      .filter((id): id is string => Boolean(id)),
  )]
  if (videoIds.length === 0) return 0

  const videoParams = new URLSearchParams({
    part: 'snippet,liveStreamingDetails',
    id: videoIds.join(','),
    key: apiKey,
  })
  const videoResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${videoParams}`,
    { cache: 'no-store' },
  )
  if (!videoResponse.ok) {
    console.error(`YouTube live details lookup failed with status ${videoResponse.status}`)
    return 0
  }
  const videoData = (await videoResponse.json()) as YouTubeVideosResponse
  const upcomingLives = (videoData.items ?? []).filter((video) =>
    video.liveStreamingDetails?.scheduledStartTime &&
    new Date(video.liveStreamingDetails.scheduledStartTime).getTime() > Date.now(),
  )
  if (upcomingLives.length === 0) return 0

  const existingParams = new URLSearchParams({
    select: 'video_id',
    video_id: `in.(${upcomingLives.map((video) => video.id).join(',')})`,
  })
  const existingResponse = await fetch(
    `${config.url}/rest/v1/youtube_live_notifications?${existingParams}`,
    { headers: supabaseHeaders(config.serviceKey) },
  )
  if (!existingResponse.ok) {
    console.error(`YouTube notification history lookup failed with status ${existingResponse.status}`)
    return 0
  }
  const existing = (await existingResponse.json()) as Array<{ video_id: string }>
  const alreadyNotified = new Set(existing.map((item) => item.video_id))

  let sent = 0
  for (const video of upcomingLives) {
    if (alreadyNotified.has(video.id)) continue
    const title = video.snippet?.title?.trim() || 'Upcoming live stream'
    const start = new Date(video.liveStreamingDetails!.scheduledStartTime!)
    const startLabel = new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    }).format(start)
    const image = video.snippet?.thumbnails?.maxres?.url ??
      video.snippet?.thumbnails?.high?.url ??
      video.snippet?.thumbnails?.medium?.url
    const delivered = await sendPush(push, config, recipients, {
      title: `Live scheduled · ${title.slice(0, 110)}`,
      body: `Join BethEL Torah India on ${startLabel} (India time). Tap to open the stream.`,
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`,
      tag: `youtube-live-${video.id}`,
      ...(image ? { image } : {}),
    })
    sent += delivered
    if (delivered > 0) {
      const stored = await fetch(`${config.url}/rest/v1/youtube_live_notifications?on_conflict=video_id`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders(config.serviceKey),
          Prefer: 'resolution=ignore-duplicates,return=minimal',
        },
        body: JSON.stringify({ video_id: video.id }),
      })
      if (!stored.ok) console.error(`Could not record YouTube notification for ${video.id}: ${stored.status}`)
    }
  }
  return sent
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
    console.error('Could not load push subscribers.', error)
    return NextResponse.json({ error: 'Could not load notification subscribers.' }, { status: 502 })
  }

  const reminders = new Map<string, CalendarReminder>()
  for (const subscription of subscriptions) {
    const timezone = subscription.timezone || 'UTC'
    for (const offsetDays of [0, 1]) {
      const dateKey = getDateKey(timezone, offsetDays)
      const key = `${dateKey}:${offsetDays === 0 ? 'today' : 'tomorrow'}`
      const reminder = reminders.get(key) ?? {
        dateKey,
        recipients: [],
        isToday: offsetDays === 0,
      }
      reminder.recipients.push(subscription)
      reminders.set(key, reminder)
    }
  }

  const monthCache = new Map<string, Promise<Awaited<ReturnType<typeof getHebcalMonth>>>>()
  let calendarSent = 0
  for (const reminder of reminders.values()) {
    const [year, month] = reminder.dateKey.split('-').map(Number)
    const monthKey = `${year}-${month}`
    let monthData = monthCache.get(monthKey)
    if (!monthData) {
      monthData = getHebcalMonth(year, month)
      monthCache.set(monthKey, monthData)
    }

    let events: CalendarEvent[]
    try {
      events = (await monthData).find((day) => day.date === reminder.dateKey)?.events
        .filter((event) => event.category !== 'hebdate') ?? []
    } catch (error) {
      console.error(`Unable to load calendar events for ${reminder.dateKey}.`, error)
      return NextResponse.json({ error: 'Calendar events are temporarily unavailable.' }, { status: 502 })
    }
    if (events.length === 0) continue

    const dateLabel = new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${reminder.dateKey}T00:00:00Z`))
    calendarSent += await sendPush(push, config, reminder.recipients, {
      title: `${reminder.isToday ? 'Today' : 'Tomorrow'} · ${reminderLabel(events)}`,
      body: `${reminder.isToday ? 'Today is' : 'Tomorrow is'} ${reminderLabel(events)} (${dateLabel}). Tap to explore the calendar.`,
      url: `/calendar?year=${year}&month=${month}`,
      tag: `calendar-${reminder.dateKey}-${reminder.isToday ? 'today' : 'tomorrow'}`,
    })
  }

  let liveSent = 0
  try {
    liveSent = await notifyUpcomingYouTubeLives(config, push, subscriptions)
  } catch (error) {
    console.error('Scheduled YouTube live notification check failed.', error)
  }

  return NextResponse.json({
    calendarNotificationsSent: calendarSent,
    liveNotificationsSent: liveSent,
    subscribers: subscriptions.length,
    youtubeMonitoring: Boolean(process.env.YOUTUBE_API_KEY),
  })
}
