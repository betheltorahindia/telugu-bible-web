'use client'

import { useEffect, useState } from 'react'
import { Quote } from 'lucide-react'

export default function HeroSpotlight({
  quote,
  author,
}: {
  quote: string
  author: string
}) {
  const [showQuote, setShowQuote] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setShowQuote((current) => !current), 10_000)
    return () => window.clearTimeout(timer)
  }, [showQuote])

  return (
    <div
      role="button"
      tabIndex={0}
      className="home-hero-spotlight"
      aria-label={showQuote ? 'Show Bethel Torah India title' : 'Show today’s quote'}
      onClick={() => setShowQuote((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setShowQuote((current) => !current)
        }
      }}
    >
      <h1 id="home-title" className="sr-only">Bethel Torah India</h1>
      {showQuote ? (
        <section className="daily-quote-card hero-daily-quote" aria-label="Daily Jewish wisdom">
          <Quote className="daily-quote-mark" aria-hidden="true" />
          <blockquote>{quote}</blockquote>
          <p className="daily-quote-author">{author}</p>
        </section>
      ) : (
        <div className="hero-wordmark" aria-hidden="true">
          <span className="hero-letters" aria-hidden="true">
            {'BETHEL'.split('').map((letter, index) => (
              <span key={`${letter}-${index}`} style={{ animationDelay: `${index * 90}ms` }}>
                {letter}
              </span>
            ))}
          </span>
          <span className="hero-title-bottom" aria-hidden="true">TORAH INDIA</span>
        </div>
      )}
      <span className="sr-only">Click to switch between today’s quote and Bethel Torah India.</span>
    </div>
  )
}
