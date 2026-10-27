import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import CalendarGrid from './CalendarGrid'
import { getHebcalMonth } from '../../lib/calendar/hebcal'

export const metadata: Metadata = {
  title: 'Hebrew & Gregorian Calendar',
  description: 'View Hebrew and Gregorian dates, Jewish holidays and weekly Torah readings.',
}

type CalendarPageProps = {
  searchParams: { year?: string; month?: string }
}

function parseDatePart(value: string | undefined, fallback: number, min: number, max: number) {
  if (value === undefined) return fallback
  if (!/^\d+$/.test(value)) notFound()
  const parsed = Number(value)
  if (parsed < min || parsed > max) notFound()
  return parsed
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const now = new Date()
  const year = parseDatePart(searchParams.year, now.getUTCFullYear(), 1900, 2100)
  const month = parseDatePart(searchParams.month, now.getUTCMonth() + 1, 1, 12)
  const days = await getHebcalMonth(year, month)
  const currentDate = new Date(Date.UTC(year, month - 1, 1))
  const previousDate = new Date(Date.UTC(year, month - 2, 1))
  const nextDate = new Date(Date.UTC(year, month, 1))
  const title = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(currentDate)
  const hebrewMonths = Array.from(
    new Set(
      days
        .filter((day) => day.isCurrentMonth)
        .map((day) => day.hebrewDateLong.split(' ')[1])
        .filter((value): value is string => Boolean(value)),
    ),
  )
  const holidayCount = days.filter(
    (day) => day.isCurrentMonth && day.events.some((event) => event.category === 'holiday'),
  ).length
  const parashaCount = days.filter(
    (day) => day.isCurrentMonth && day.events.some((event) => event.category === 'parashat'),
  ).length

  return (
    <div className="calendar-page">
      <section className="calendar-heading">
        <div className="calendar-heading-icon"><CalendarDays className="h-5 w-5" /></div>
        <div>
          <p className="calendar-eyebrow">BETHEL TORAH INDIA · CALENDAR</p>
          <h1>Hebrew &amp; Gregorian calendar</h1>
          <p className="calendar-subtitle">A considered view of Hebrew dates, holidays and weekly Torah readings.</p>
        </div>
      </section>

      <section className="calendar-shell" aria-label={`Calendar for ${title}`}>
        <div className="calendar-toolbar">
          <div className="calendar-current-month">
            <h2>{title}</h2>
            <span>{hebrewMonths.join(' / ') || 'Hebrew dates loading'}</span>
          </div>
          <div className="calendar-toolbar-actions">
            <Link
              href={`/calendar?year=${previousDate.getUTCFullYear()}&month=${previousDate.getUTCMonth() + 1}`}
              className="calendar-nav-button"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link href="/calendar" className="calendar-today-button">Today</Link>
            <Link
              href={`/calendar?year=${nextDate.getUTCFullYear()}&month=${nextDate.getUTCMonth() + 1}`}
              className="calendar-nav-button"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <CalendarGrid days={days} />

        <div className="calendar-legend">
          <span><i className="legend-dot holiday-dot" /> Holidays</span>
          <span><i className="legend-dot parasha-dot" /> Torah readings</span>
          <span><i className="legend-dot today-dot" /> Today</span>
          <a
            className="calendar-source"
            href="https://www.hebcal.com/"
            target="_blank"
            rel="noreferrer noopener"
          >
            Hebcal · Diaspora calendar <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </section>

      <section className="calendar-highlights" aria-label="This month's highlights">
        <div><strong>{holidayCount}</strong><span>Holiday dates</span></div>
        <div><strong>{parashaCount}</strong><span>Weekly readings</span></div>
        <div><strong>{hebrewMonths.length || 1}</strong><span>Hebrew month{hebrewMonths.length === 1 ? '' : 's'}</span></div>
      </section>
    </div>
  )
}
