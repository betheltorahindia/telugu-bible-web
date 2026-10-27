import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BookOpen, CalendarDays, Users, Video } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Bethel Torah India',
  description: 'Learn about Bethel Torah India and the tools available in the app.',
}

export default function AboutPage() {
  return (
    <div className="settings-page about-page">
      <Link href="/settings" className="settings-back-link"><ArrowLeft className="h-4 w-4" /> Settings</Link>
      <header className="settings-page-heading">
        <span className="settings-page-icon"><Users className="h-5 w-5" /></span>
        <div>
          <p className="settings-page-eyebrow">BETHEL TORAH INDIA</p>
          <h1>About our community</h1>
          <p>A place for learning, connection and shared stories.</p>
        </div>
      </header>

      <section className="about-story-card">
        <p className="settings-page-eyebrow">OUR STORY</p>
        <h2>Scripture-based learning in Telugu</h2>
        <p>
          BethEL Torah India | Telugu is part of the Noahide Academy community. It welcomes
          Telugu-speaking seekers of the Creator who want to grow through clear, deep and
          Scripture-based teaching.
        </p>
        <p>
          The community shares verse-by-verse Bible studies, scriptural insights, teachings on
          biblical festivals and prophecies, Hebrew worship songs, and uplifting messages. Its
          focus is on seeking truth with a pure heart, walking humbly with God, and learning
          directly from Scripture.
        </p>
      </section>

      <section className="about-feature-grid" aria-label="How the app works">
        <article>
          <BookOpen className="h-5 w-5" />
          <h2>Read and study</h2>
          <p>Explore the Tanach with language, zoom and parallel-reading tools.</p>
        </article>
        <article>
          <CalendarDays className="h-5 w-5" />
          <h2>Follow the calendar</h2>
          <p>Find Hebrew and Gregorian dates, holidays and weekly Torah readings.</p>
        </article>
        <article>
          <Users className="h-5 w-5" />
          <h2>Stay connected</h2>
          <p>Visit the community space and keep up with shared updates.</p>
        </article>
      </section>

      <section className="about-contact-card">
        <div className="about-leader-frame" aria-label="Photo frame for the community leader">
          <div className="about-photo-placeholder"><Users className="h-8 w-8" /></div>
          <span>LEADERSHIP</span>
        </div>
        <div className="about-contact-copy">
          <p className="settings-page-eyebrow">LEADERSHIP &amp; CONTACT</p>
          <h2>Rosh Yeshiva</h2>
          <p className="about-leader-name">Sir Ovadia Ravi Kumar</p>
          <address>
            21-51-2, Chengal Rao Peta,<br />
            Visakhapatnam, Andhra Pradesh 530001
          </address>
          <div className="about-contact-links">
            <a href="mailto:pas.obadiah@gmail.com">pas.obadiah@gmail.com</a>
            <a href="https://www.youtube.com/@BethELTorahIndia" target="_blank" rel="noreferrer noopener">
              YouTube · BethEL Torah India
            </a>
          </div>
        </div>
      </section>

      <section className="about-photo-gallery" aria-label="Community photo gallery">
        <div>
          <p className="settings-page-eyebrow">OUR COMMUNITY</p>
          <h2>People, learning and fellowship</h2>
        </div>
        <div className="about-photo-grid">
          {[
            { label: 'Community leader', Icon: Users },
            { label: 'Bible study', Icon: BookOpen },
            { label: 'Community gathering', Icon: Video },
          ].map(({ label, Icon }) => (
            <figure className="about-gallery-frame" key={label}>
              <div className="about-gallery-placeholder"><Icon className="h-7 w-7" /></div>
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}
