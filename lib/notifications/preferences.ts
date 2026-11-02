import { z } from 'zod'

const quarterHourTime = z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/)

export type NotificationPreferences = {
  calendar: boolean
  prayers: boolean
  psalms: boolean
  prayerTimes: {
    morning: string
    afternoon: string
    evening: string
    night: string
  }
  psalmTimes: [string, string, string]
}

export const NotificationPreferencesSchema = z.object({
  calendar: z.boolean(),
  prayers: z.boolean(),
  psalms: z.boolean(),
  prayerTimes: z.object({
    morning: quarterHourTime,
    afternoon: quarterHourTime,
    evening: quarterHourTime,
    night: quarterHourTime,
  }),
  psalmTimes: z.tuple([quarterHourTime, quarterHourTime, quarterHourTime]),
})

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  calendar: true,
  prayers: true,
  psalms: true,
  prayerTimes: {
    morning: '07:00',
    afternoon: '13:00',
    evening: '18:00',
    night: '21:00',
  },
  psalmTimes: ['10:00', '15:00', '19:00'],
}

export function getNotificationPreferences(value: unknown): NotificationPreferences {
  const parsed = NotificationPreferencesSchema.safeParse(value)
  if (!parsed.success) {
    console.error('Stored notification preferences are invalid; defaults were applied.')
    return DEFAULT_NOTIFICATION_PREFERENCES
  }
  return parsed.data as NotificationPreferences
}
