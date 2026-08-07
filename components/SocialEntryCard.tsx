'use client'

import Link from 'next/link'
import './social-card.css'

/**
 * Entry card for the Social world.
 * Fully self-contained: all styles live in social-card.css under the
 * .stw-card scope, so it cannot affect any existing home page styling.
 */
export default function SocialEntryCard() {
  return (
    <Link href="/social" className="stw-card" aria-label="Open the Social page">
      <span className="stw-glow" aria-hidden />
      <span className="stw-icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.6 2.6 15 0 18M12 3C9.4 5.6 9.4 18 12 21" />
        </svg>
      </span>
      <span className="stw-body">
        <span className="stw-title">Explore Teachings &amp; Podcasts</span>
        <span className="stw-sub">Latest YouTube videos and every Spotify episode</span>
      </span>
      <span className="stw-cta">Open</span>
    </Link>
  )
}