import { z } from 'zod'

const EventSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  category: z.string(),
  hdate: z.string().optional(),
  hebrew: z.string().optional(),
})

const ResponseSchema = z.object({ items: z.array(EventSchema) })

export type CalendarEvent = z.infer<typeof EventSchema>

export type CalendarDay = {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  hebrewDate: string
  hebrewDateLong: string
  events: CalendarEvent[]
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function getHebcalMonth(year: number, month: number): Promise<CalendarDay[]> {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1))
  const gridStart = new Date(firstOfMonth)
  gridStart.setUTCDate(1 - firstOfMonth.getUTCDay())
  const gridEnd = new Date(gridStart)
  gridEnd.setUTCDate(gridStart.getUTCDate() + 41)

  const params = new URLSearchParams({
    cfg: 'json',
    v: '1',
    start: toDateKey(gridStart),
    end: toDateKey(gridEnd),
    d: 'on',
    maj: 'on',
    min: 'on',
    mod: 'on',
    nx: 'on',
    ss: 'on',
    mf: 'on',
    c: 'on',
    s: 'on',
    i: 'off',
  })
  const response = await fetch(`https://www.hebcal.com/hebcal?${params}`, {
    next: { revalidate: 86400 },
  })
  if (!response.ok) {
    throw new Error(`Hebcal calendar request failed with status ${response.status}`)
  }

  const data = ResponseSchema.parse(await response.json())
  const eventsByDate = new Map<string, CalendarEvent[]>()
  const hebrewDates = new Map<string, string>()
  const hebrewLongDates = new Map<string, string>()

  for (const event of data.items) {
    if (event.category === 'hebdate') {
      if (event.hebrew) hebrewDates.set(event.date, event.hebrew)
      if (event.hdate) hebrewLongDates.set(event.date, event.hdate)
      continue
    }
    const events = eventsByDate.get(event.date) ?? []
    events.push(event)
    eventsByDate.set(event.date, events)
  }

  const today = toDateKey(new Date())
  const days: CalendarDay[] = []
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart)
    date.setUTCDate(gridStart.getUTCDate() + index)
    const dateKey = toDateKey(date)
    days.push({
      date: dateKey,
      dayNumber: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === month - 1,
      isToday: dateKey === today,
      hebrewDate: hebrewDates.get(dateKey) ?? '',
      hebrewDateLong: hebrewLongDates.get(dateKey) ?? '',
      events: eventsByDate.get(dateKey) ?? [],
    })
  }

  return days
}
