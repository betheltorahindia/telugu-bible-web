import { z } from 'zod'

export type NotificationPreferences = {
  calendar: boolean
}

export const NotificationPreferencesSchema = z.object({
  calendar: z.boolean(),
})

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  calendar: true,
}

export function getNotificationPreferences(value: unknown): NotificationPreferences {
  const parsed = NotificationPreferencesSchema.safeParse(value)
  if (!parsed.success) {
    console.error('Stored notification preferences are invalid; defaults were applied.')
    return DEFAULT_NOTIFICATION_PREFERENCES
  }
  return { calendar: parsed.data.calendar }
}
