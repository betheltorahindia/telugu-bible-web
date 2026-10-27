'use client'

export default function CalendarError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <section className="calendar-error">
      <h1>Calendar data is temporarily unavailable</h1>
      <p>We couldn’t load the latest Hebrew dates and holiday listings. Please try again.</p>
      <button type="button" onClick={reset}>Try again</button>
    </section>
  )
}
