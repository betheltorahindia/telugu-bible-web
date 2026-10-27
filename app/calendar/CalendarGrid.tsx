'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { CalendarDay } from '../../lib/calendar/hebcal'

const WEEKDAYS = [
  ['Sunday', 'Sun'],
  ['Monday', 'Mon'],
  ['Tuesday', 'Tue'],
  ['Wednesday', 'Wed'],
  ['Thursday', 'Thu'],
  ['Friday', 'Fri'],
  ['Saturday', 'Sat'],
]

function prettyDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

function englishHebrewDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).formatToParts(parsed)
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return month && day ? `${month} ${day}` : ''
}

function zodiacForRoshChodesh(title: string) {
  const month = title.replace(/^Rosh Chodesh\s*/i, '').toLowerCase()
  const signs: [string[], string][] = [
    [['nisan'], '♈'],
    [['iyar'], '♉'],
    [['sivan'], '♊'],
    [['tammuz'], '♋'],
    [['av'], '♌'],
    [['elul'], '♍'],
    [['tishrei', 'tishri'], '♎'],
    [['cheshvan', 'marcheshvan', 'heshvan'], '♏'],
    [['kislev'], '♐'],
    [['tevet'], '♑'],
    [['shevat', 'shvat'], '♒'],
    [['adar'], '♓'],
  ]
  return signs.find(([months]) => months.some((name) => month.includes(name)))?.[1]
}

export default function CalendarGrid({
  days,
}: {
  days: CalendarDay[]
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const selectedDay = useMemo(
    () => days.find((day) => day.date === selectedDate) ?? null,
    [days, selectedDate],
  )

  return (
    <>
      <p className="calendar-scroll-hint">Swipe horizontally to see every day of the week</p>
      <div className="calendar-grid-scroll" role="region" aria-label="Calendar dates" tabIndex={0}>
        <div className="calendar-grid">
          {WEEKDAYS.map(([weekday, shortWeekday]) => (
            <div key={weekday} className="calendar-weekday">
              <span className="calendar-weekday-long">{weekday}</span>
              <span className="calendar-weekday-short">{shortWeekday}</span>
            </div>
          ))}
          {days.map((day) => {
            const holidays = day.events.filter(
              (event) => event.category === 'holiday' || event.category === 'roshchodesh',
            )
            const readings = day.events.filter((event) => event.category === 'parashat')
            const otherEvents = day.events.filter(
              (event) => !['holiday', 'roshchodesh', 'parashat', 'hebdate'].includes(event.category),
            )
            const roshChodesh = day.events.find((event) => event.category === 'roshchodesh')
            const zodiac = roshChodesh ? zodiacForRoshChodesh(roshChodesh.title) : undefined
            const hebrewDate = day.hebrewDate ? englishHebrewDate(day.date) : ''
            const classes = [
              'calendar-day',
              !day.isCurrentMonth && 'is-outside',
              day.isToday && 'is-today',
              day.events.some((event) => event.category !== 'hebdate') && 'has-events',
              holidays.length > 0 && 'has-holiday',
              readings.length > 0 && 'has-reading',
              selectedDate === day.date && 'is-selected',
            ].filter(Boolean).join(' ')

            return (
              <div key={day.date} className={classes}>
                <button
                  type="button"
                  className="calendar-date-select"
                  onClick={() => setSelectedDate(day.date)}
                  aria-label={`${prettyDate(day.date)}${hebrewDate ? `, Hebrew date ${hebrewDate}` : ''}${day.events.length ? `, ${day.events.map((event) => event.title).join(', ')}` : ''}`}
                  aria-pressed={selectedDate === day.date}
                >
                  <span className="calendar-date-row">
                    <span className="calendar-day-number">{day.dayNumber}</span>
                    {zodiac && (
                      <span
                        className="calendar-date-zodiac"
                        title={`Rosh Chodesh zodiac sign ${zodiac}`}
                        aria-label={`Rosh Chodesh zodiac sign ${zodiac}`}
                      >
                        {zodiac}
                      </span>
                    )}
                    {day.isToday && <span className="calendar-today-chip">Today</span>}
                  </span>
                </button>
                <span className="calendar-hebrew-date">{hebrewDate || '\u00a0'}</span>
                <span className="calendar-event-list">
                  {holidays.slice(0, 2).map((event) => (
                    <button
                      key={event.title}
                      type="button"
                      className="calendar-event holiday-event"
                      title={event.title}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      {event.title}
                    </button>
                  ))}
                  {readings.slice(0, 1).map((event) => (
                    <Link
                      key={event.title}
                      href={`/parasha/${day.date}`}
                      className="calendar-event parasha-event"
                      title={`Open ${event.title}`}
                    >
                      {event.title.replace(/^Parashat /, '')}
                    </Link>
                  ))}
                  {holidays.length + readings.length === 0 && otherEvents[0] && (
                    <button
                      key={otherEvents[0].title}
                      type="button"
                      className="calendar-event other-event"
                      title={otherEvents[0].title}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      {otherEvents[0].title}
                    </button>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="calendar-day-detail" aria-live="polite">
        {selectedDay ? (
          <>
            <div className="calendar-detail-date">
              <span>{prettyDate(selectedDay.date)}</span>
              {selectedDay.hebrewDate && (
                <strong>{englishHebrewDate(selectedDay.date)}</strong>
              )}
            </div>
            <div className="calendar-detail-events">
              {selectedDay.events.length ? selectedDay.events
                .filter((event) => event.category !== 'hebdate')
                .map((event) => event.category === 'parashat' ? (
                  <Link key={`${event.category}-${event.title}`} href={`/parasha/${selectedDay.date}`}>
                    {event.title}
                  </Link>
                ) : (
                  <span key={`${event.category}-${event.title}`}>{event.title}</span>
                )) :
                <span>No holidays or Torah readings listed for this date.</span>}
            </div>
          </>
        ) : (
          <span>Select a date to view its Hebrew date, holidays and readings.</span>
        )}
      </div>
    </>
  )
}
