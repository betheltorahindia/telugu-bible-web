import { z } from 'zod'

export type NotificationPreferences = {
  calendar: boolean
  prayers: boolean
  psalms: boolean
  custom: boolean
}

export const NotificationPreferencesSchema = z.object({
  calendar: z.boolean().default(true),
  prayers: z.boolean().default(true),
  psalms: z.boolean().default(true),
  custom: z.boolean().default(true),
})

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  calendar: true,
  prayers: true,
  psalms: true,
  custom: true,
}

export function getNotificationPreferences(value: unknown): NotificationPreferences {
  const parsed = NotificationPreferencesSchema.safeParse(value)
  if (!parsed.success) {
    console.error('Stored notification preferences are invalid; defaults were applied.')
    return DEFAULT_NOTIFICATION_PREFERENCES
  }
  return {
    calendar: parsed.data.calendar ?? true,
    prayers: parsed.data.prayers ?? true,
    psalms: parsed.data.psalms ?? true,
    custom: parsed.data.custom ?? true,
  }
}
