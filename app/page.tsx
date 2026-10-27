import Link from 'next/link'
import { ArrowUpRight, BookOpen, CalendarDays, Heart, Quote, Sparkles, Users } from 'lucide-react'
import { getDailyQuote } from '../lib/api/dailyQuote'
import HomeNavigationCarousel from '../components/HomeNavigationCarousel'
import InstallFAB from '../components/InstallFAB'
import BethelChat from '../components/BethelChat'
import ParashaTeaser from '../components/ParashaTeaser'

export const metadata = {
  title: 'BETHEL TORAH INDIA',
  description:
    'A growing home for Torah learning, community, stories and useful tools from Bethel Torah India.',
  alternates: { canonical: '/' },
}

const letters = Array.from('BETHEL')
const HEBREW_WEEKDAYS = [
  'Yom Rishon',
  'Yom Sheni',
  'Yom Shlishi',
  'Yom Revi’i',
  'Yom Chamishi',
  'Yom Shishi',
  'Yom Shabbat',
]

function formatHebrewDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-u-ca-hebrew', { ...options, timeZone: 'UTC' }).format(date)
}

export default async function Home() {
  const quote = await getDailyQuote()
  const today = new Date()
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const englishDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
  const hebrewDate = `${HEBREW_WEEKDAYS[date.getUTCDay()]}, ${formatHebrewDate(date, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`
  return (
    <div className="community-home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />

        <div className="hero-date-panels" aria-label="Today’s dates">
          <div className="hero-date-card">
            <span className="hero-date-label">Gregorian calendar</span>
            <strong>{englishDate}</strong>
          </div>
          <div className="hero-date-card hero-hebrew-date">
            <span className="hero-date-label">Hebrew calendar</span>
            <strong>{hebrewDate}</strong>
          </div>
        </div>

        <div className="hero-content">
          <h1 id="home-title" className="hero-wordmark">
            <span className="hero-letters" aria-hidden="true">
              {letters.map((letter, index) => (
                <span key={`${letter}-${index}`} style={{ animationDelay: `${index * 90}ms` }}>
                  {letter}
                </span>
              ))}
            </span>
            <span className="sr-only">BETHEL TORAH INDIA</span>
            <span className="hero-title-bottom" aria-hidden="true">TORAH INDIA</span>
          </h1>
          <HomeNavigationCarousel />
        </div>
      </section>

      <section className="daily-quote-card" aria-label="Daily Jewish wisdom">
        <Quote className="daily-quote-mark" aria-hidden="true" />
        <blockquote>{quote.text}</blockquote>
        <p className="daily-quote-author">{quote.author}</p>
      </section>

      <section className="home-readings" aria-labelledby="home-readings-title">
        <div className="home-readings-heading">
          <div>
            <p className="home-kicker"><CalendarDays className="h-3.5 w-3.5" /> THIS WEEK IN TORAH</p>
            <h2 id="home-readings-title">Weekly Torah readings</h2>
          </div>
          <Link href="/tanach" className="home-readings-calendar">
            Explore Tanach <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="home-reading-grid home-reading-grid-tanach">
          <ParashaTeaser />
        </div>
      </section>

      <section id="discover" className="home-discover" aria-labelledby="discover-title">
        <div className="home-section-heading">
          <div>
            <p className="home-kicker"><Sparkles className="h-3.5 w-3.5" /> YOUR PLACE TO BEGIN</p>
            <h2 id="discover-title">Explore what matters to you.</h2>
          </div>
          <p>One home for learning, connection and the things we build together.</p>
        </div>

        <div className="home-feature-grid">
          <Link href="/tanach" className="home-feature-card home-feature-tanach">
            <span className="feature-icon"><BookOpen className="h-5 w-5" /></span>
            <span className="feature-index">01 / SCRIPTURE</span>
            <span className="feature-title">The Tanach</span>
            <span className="feature-description">
              Read the Telugu scriptures, weekly Parashiyot and Torah readings.
            </span>
            <span className="feature-link">Explore Tanach <ArrowUpRight className="h-4 w-4" /></span>
          </Link>
          <Link href="/social" className="home-feature-card home-feature-community">
            <span className="feature-icon"><Users className="h-5 w-5" /></span>
            <span className="feature-index">02 / COMMUNITY</span>
            <span className="feature-title">Connect & share</span>
            <span className="feature-description">
              Step into the community space and see what is happening.
            </span>
            <span className="feature-link">Visit community <ArrowUpRight className="h-4 w-4" /></span>
          </Link>
          <Link href="/calendar" className="home-feature-card home-feature-growing">
            <span className="feature-icon"><CalendarDays className="h-5 w-5" /></span>
            <span className="feature-index">03 / CALENDAR</span>
            <span className="feature-title">Dates &amp; readings</span>
            <span className="feature-description">
              Explore English and Hebrew dates, holidays and Torah readings.
            </span>
            <span className="feature-link">Open calendar <ArrowUpRight className="h-4 w-4" /></span>
          </Link>
          <Link id="prayers" href="/prayers" className="home-feature-card home-feature-coming-soon">
            <span className="feature-icon"><Heart className="h-5 w-5" /></span>
            <span className="feature-index">04 / PRAYER</span>
            <span className="feature-title">Prayers</span>
            <span className="feature-description">Explore daily prayers, Telugu translations, and Hebrew-prayer transliterations.</span>
            <span className="feature-link">Open prayers <ArrowUpRight className="h-4 w-4" /></span>
          </Link>
          <Link id="wisdom" href="/study" className="home-feature-card home-feature-growing">
            <span className="feature-icon"><Sparkles className="h-5 w-5" /></span>
            <span className="feature-index">05 / STUDY</span>
            <span className="feature-title">Study</span>
            <span className="feature-description">Explore Noahide teachings and classic ethical works in English and Telugu.</span>
            <span className="feature-link">Explore Study <ArrowUpRight className="h-4 w-4" /></span>
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <span>BETHEL TORAH INDIA</span>
        <span>A community in the making.</span>
      </footer>
      <div className="home-floating-actions">
        <BethelChat />
        <InstallFAB />
      </div>
    </div>
  )
}
