'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { getPrayer, hasPrayerTransliteration, prayers, type Prayer, type PrayerSection } from '../../lib/data/prayers'
import { useLanguage } from '../providers/LanguageProvider'
import { useZoom } from '../providers/ZoomProvider'

function PrayerPage({ children }: { children: React.ReactNode }) {
  const { level } = useZoom()
  return (
    <section
      className="prayer-page"
      style={{ '--prayer-zoom': 1 + level * 0.12 } as React.CSSProperties}
    >
      <div className="prayer-page-glow" aria-hidden="true" />
      {children}
    </section>
  )
}

function usePrayerLanguage() {
  const { lang } = useLanguage()
  return lang
}

function PrayerHeading({
  title,
  subtitle,
  description,
  backHref,
}: {
  title: string
  subtitle?: string
  description?: string
  backHref?: string
}) {
  return (
    <header className="prayer-heading">
      {backHref && (
        <Link className="prayer-back-link" href={backHref}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>All prayers</span>
        </Link>
      )}
      <div className="prayer-heading-title">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="prayer-subtitle" lang="te">{subtitle}</p>}
        </div>
      </div>
      {description && <p className="prayer-description">{description}</p>}
    </header>
  )
}

function SearchNotice({ query }: { query: string }) {
  if (!query) return null
  return <p className="prayer-search-summary">Showing results for “{query}”</p>
}

function prayerMatches(prayer: Prayer, query: string) {
  const haystack = [
    ...Object.values(prayer.title),
    ...prayer.sections.flatMap((section) => [
      ...Object.values(section.title),
      ...section.paragraphs.flatMap((paragraph) => [
        ...Object.values(paragraph.text),
        ...Object.values(paragraph.transliteration),
      ]),
    ]),
  ].join(' ').toLocaleLowerCase()
  return haystack.includes(query.toLocaleLowerCase())
}

function sectionMatches(section: PrayerSection, query: string) {
  const haystack = [
    ...Object.values(section.title),
    ...section.paragraphs.flatMap((paragraph) => [
      ...Object.values(paragraph.text),
      ...Object.values(paragraph.transliteration),
    ]),
  ].join(' ').toLocaleLowerCase()
  return haystack.includes(query.toLocaleLowerCase())
}

function getTeluguTransliterationPairs(section: PrayerSection) {
  const pairs: Array<{ text: string; transliteration: string }> = []

  for (let index = 0; index < section.paragraphs.length; index += 1) {
    const paragraph = section.paragraphs[index]
    let text = paragraph.text.te.trim()
    let transliteration = paragraph.transliteration.te.trim()
    const next = section.paragraphs[index + 1]
    const nextText = next?.text.te.trim() ?? ''
    const nextTransliteration = next?.transliteration.te.trim() ?? ''

    if (text && !transliteration && !nextText && nextTransliteration) {
      transliteration = nextTransliteration
      index += 1
    } else if (!text && transliteration && nextText && !nextTransliteration) {
      text = nextText
      index += 1
    }

    if (text || transliteration) pairs.push({ text, transliteration })
  }

  return pairs
}

export function PrayersLandingScreen() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const matchingPrayers = prayers.filter((prayer) => !query || prayerMatches(prayer, query))

  return (
    <PrayerPage>
      <PrayerHeading
        title="Prayers"
      />
      <SearchNotice query={query} />
      <div className="prayer-list">
        {matchingPrayers.map((prayer) => (
          <Link className="prayer-card" href={`/prayers/${prayer.slug}`} key={prayer.slug}>
            <span className="prayer-card-copy">
              <strong>{prayer.title.en || prayer.slug}</strong>
              {prayer.title.te && <strong lang="te">{prayer.title.te}</strong>}
            </span>
          </Link>
        ))}
        {!matchingPrayers.length && <p className="prayer-empty-state">No prayers match this search.</p>}
      </div>
    </PrayerPage>
  )
}

export function PrayerScreen({ slug }: { slug: string }) {
  const prayer = getPrayer(slug)
  const contentLanguage = usePrayerLanguage()
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  if (!prayer) return <PrayerNotFound />
  const visibleSections = prayer.sections.filter((section) => !query || sectionMatches(section, query))

  return (
    <PrayerPage>
      <PrayerHeading
        title={prayer.title.en || prayer.slug}
        subtitle={prayer.title.te}
        description={prayer.description[contentLanguage]}
        backHref="/prayers"
      />
      <SearchNotice query={query} />
      {visibleSections.length ? (
        <div className="prayer-section-list">
          {visibleSections.map((section) => (
            <Link
              className="prayer-section-card"
              href={`/prayers/${prayer.slug}/${section.slug}`}
              key={section.slug}
            >
              <span className="prayer-section-copy">
                <strong>{section.title.en || section.slug}</strong>
                {section.title.te && <strong lang="te">{section.title.te}</strong>}
              </span>
            </Link>
          ))}
        </div>
      ) : query ? <p className="prayer-empty-state">No sections match this search.</p> : null}
    </PrayerPage>
  )
}

export function PrayerSectionScreen({
  slug,
  sectionSlug,
}: {
  slug: string
  sectionSlug: string
}) {
  const prayer = getPrayer(slug)
  const section = prayer?.sections.find((item) => item.slug === sectionSlug)
  const contentLanguage = usePrayerLanguage()
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const isTransliteration = searchParams.get('mode') === 'transliteration'
  if (!prayer || !section) return <PrayerNotFound />

  const selectedLanguage = isTransliteration ? 'te' : contentLanguage
  const content: Array<{ text: string; transliteration?: string }> = isTransliteration
    ? getTeluguTransliterationPairs(section).filter((paragraph) =>
        !query ||
        `${paragraph.text} ${paragraph.transliteration}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      )
    : section.paragraphs
        .map((paragraph) => ({ text: paragraph.text[selectedLanguage].trim() }))
        .filter((paragraph) =>
          paragraph.text &&
          (!query || paragraph.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
        )
  const hasTransliteration = hasPrayerTransliteration(prayer, 'te', section.slug)
  return (
    <PrayerPage>
      <PrayerHeading
        title={`${prayer.title.en || prayer.slug} · ${section.title.en || section.slug}`}
        subtitle={section.title.te}
        backHref={`/prayers/${prayer.slug}`}
      />
      <SearchNotice query={query} />
      {content.length ? (
        <div className={`prayer-reading-list ${isTransliteration ? 'is-transliteration' : ''}`}>
          {content.map((passage, index) => (
            <article className="prayer-reading-card" key={index}>
              {isTransliteration ? (
                <div className="prayer-reading-pair">
                  <div>
                    <span className="prayer-reading-label" lang="te">తెలుగు</span>
                    <p lang="te">{passage.text}</p>
                  </div>
                  <div>
                    <span className="prayer-reading-label">Transliteration</span>
                    <p lang="te">{passage.transliteration ?? ''}</p>
                  </div>
                </div>
              ) : (
                <p lang={selectedLanguage} dir={selectedLanguage === 'he' ? 'rtl' : undefined}>
                  {passage.text}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : query ? <p className="prayer-empty-state">No passages match this search.</p> : null}
      {isTransliteration && content.length > 0 && (
        <p className="prayer-mode-note"><Sparkles size={14} aria-hidden="true" /> Hebrew-prayer transliteration shown in Telugu script.</p>
      )}
    </PrayerPage>
  )
}

function PrayerNotFound() {
  return (
    <PrayerPage>
      <PrayerHeading title="Prayer not found" />
      <Link className="prayer-back-link" href="/prayers">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Return to Prayers</span>
      </Link>
    </PrayerPage>
  )
}
