'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, BookOpen, ChevronRight, Languages, Sparkles } from 'lucide-react'
import { LANG_LABELS, type LangCode } from '../../lib/lang'
import { useZoom } from '../providers/ZoomProvider'
import {
  getStudyBook,
  hasStudyTranslation,
  studyBooks,
  type StudyBook,
  type StudyChapter,
  type StudyEntry,
  type StudyLanguageText,
} from '../../lib/data/study/books'
import { useLanguage } from '../providers/LanguageProvider'

const LANGUAGES: LangCode[] = ['en', 'te', 'ta', 'hi', 'he']

function StudyPage({ children }: { children: React.ReactNode }) {
  const { level } = useZoom()
  return (
    <section
      className="study-page"
      style={{ '--study-zoom': 1 + level * 0.12 } as React.CSSProperties}
    >
      <div className="study-page-glow" aria-hidden="true" />
      {children}
    </section>
  )
}

function useStudyLanguage(book?: StudyBook) {
  const { lang, setLang } = useLanguage()
  const isAvailable = (language: LangCode) =>
    book
      ? hasStudyTranslation(book, language)
      : studyBooks.some((studyBook) => hasStudyTranslation(studyBook, language))
  const selectedLanguageAvailable = isAvailable(lang)
  const contentLanguage = selectedLanguageAvailable ? lang : 'te'
  const [notice, setNotice] = useState('')

  const chooseLanguage = (language: LangCode) => {
    if (!isAvailable(language)) {
      setNotice(`${LANG_LABELS[language].name} is not available for this book yet.`)
      return
    }
    setLang(language)
    setNotice('')
  }

  return {
    lang,
    contentLanguage,
    chooseLanguage,
    notice:
      notice ||
      (!selectedLanguageAvailable
        ? `${LANG_LABELS[lang].name} is not available for this book yet. Showing Telugu instead.`
        : ''),
    isAvailable,
  }
}

function LanguagePicker({
  book,
  selectedLanguage,
  notice,
  onSelect,
  isAvailable,
}: {
  book?: StudyBook
  selectedLanguage: LangCode
  notice: string
  onSelect: (language: LangCode) => void
  isAvailable?: (language: LangCode) => boolean
}) {
  return (
    <div className="study-language-panel">
      <div className="study-language-heading">
        <Languages aria-hidden="true" size={17} />
        <span>Read in</span>
      </div>
      <div className="study-language-options" role="group" aria-label="Study language">
        {LANGUAGES.map((language) => {
          const available = isAvailable
            ? isAvailable(language)
            : book
              ? hasStudyTranslation(book, language)
              : false
          return (
            <button
              key={language}
              type="button"
              className={`study-language-option ${selectedLanguage === language ? 'is-selected' : ''} ${!available ? 'is-unavailable' : ''}`}
              aria-pressed={selectedLanguage === language}
              aria-disabled={!available}
              title={available ? LANG_LABELS[language].name : `${LANG_LABELS[language].name} unavailable`}
              onClick={() => onSelect(language)}
            >
              <span className="study-language-glyph">{LANG_LABELS[language].glyph}</span>
              <span>{LANG_LABELS[language].name}</span>
              {!available && <span className="study-language-soon">Soon</span>}
            </button>
          )
        })}
      </div>
      {notice && <p className="study-language-notice" role="status">{notice}</p>}
    </div>
  )
}

function translated(value: StudyLanguageText, language: LangCode) {
  return value[language] || value.en || value.te
}

function StudyHeader({
  title,
  subtitle,
  subtitleLanguage = 'te',
  description,
  backHref,
}: {
  title: string
  subtitle: string
  subtitleLanguage?: 'te' | 'he'
  description?: string
  backHref?: string
}) {
  return (
    <header className="study-page-heading">
      {backHref && (
        <Link className="study-back-link" href={backHref}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>All study books</span>
        </Link>
      )}
      <div className="study-heading-title">
        <span className="study-heading-icon"><BookOpen size={23} aria-hidden="true" /></span>
        <div>
          <p className="study-eyebrow">BETHEL TORAH INDIA · STUDY</p>
          <h1>{title}</h1>
          {subtitle && <p className="study-subtitle" lang={subtitleLanguage} dir={subtitleLanguage === 'he' ? 'rtl' : undefined}>{subtitle}</p>}
        </div>
      </div>
      {description && <p className="study-description">{description}</p>}
    </header>
  )
}

export function StudyLandingScreen() {
  const { contentLanguage, chooseLanguage, notice, isAvailable } = useStudyLanguage()

  return (
    <StudyPage>
      <StudyHeader
        title="Study"
        subtitle="అధ్యయనం"
        description="Explore foundational Noahide teachings and classic Jewish ethical works, with English and Telugu reading options."
      />
      <LanguagePicker
        selectedLanguage={contentLanguage}
        notice={notice}
        onSelect={chooseLanguage}
        isAvailable={isAvailable}
      />
      <div className="study-book-grid">
        {studyBooks.map((book, index) => (
          <Link className="study-book-card" href={`/study/${book.slug}`} key={book.slug}>
            <span className="study-book-card-top">
              <span className="study-book-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="study-book-icon"><Sparkles size={18} aria-hidden="true" /></span>
            </span>
            <span className="study-book-title">{book.title}</span>
            <span className="study-book-subtitle" lang={book.subtitleLanguage || 'te'} dir={book.subtitleLanguage === 'he' ? 'rtl' : undefined}>{book.subtitle}</span>
            <span className="study-book-description">{book.description}</span>
            <span className="study-book-link">
              Explore {book.kind === 'chapters' ? 'chapters' : 'book'}
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
      <div className="study-language-footnote">
        <span className="study-language-footnote-dot" />
        Language availability varies by book; Tamil, Hindi, and Hebrew become selectable as translations are added.
      </div>
    </StudyPage>
  )
}

function StudyEntryCard({ entry, language }: { entry: StudyEntry; language: LangCode }) {
  const text = entry[language]
  return (
    <article className="study-reading-card">
      <span className="study-reading-number">{entry.number || '✦'}</span>
      <p lang={language}>{text}</p>
    </article>
  )
}

function StudyList({ entries, language }: { entries: StudyEntry[]; language: LangCode }) {
  return (
    <div className="study-reading-list">
      {entries.map((entry, index) => <StudyEntryCard key={`${entry.number}-${index}`} entry={entry} language={language} />)}
    </div>
  )
}

function SevenLawsList({ book, language }: { book: Extract<StudyBook, { kind: 'seven-laws' }>; language: LangCode }) {
  return (
    <div className="study-laws-grid">
      {book.laws.map((law) => (
        <article className="study-law-card" key={law.number}>
          <span className="study-reading-number">{law.number}</span>
          <div className="study-law-pair">
            <div>
              <span className="study-law-label">Positive principle</span>
              <p lang={language}>{law.positive[language]}</p>
            </div>
            <div>
              <span className="study-law-label">Avoid</span>
              <p lang={language}>{law.negative[language]}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function StudyChapterGrid({ slug, chapters }: { slug: string; chapters: StudyChapter[] }) {
  return (
    <div className="study-chapter-grid">
      {chapters.map((chapter) => (
        <Link className="study-chapter-card" href={`/study/${slug}/${chapter.number}`} key={chapter.number}>
          <span className="study-chapter-number">{String(chapter.number).padStart(2, '0')}</span>
          <span>
            <strong>Chapter {chapter.number}</strong>
            <small>{chapter.items.filter((item) => item.number > 0).length} teachings</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      ))}
    </div>
  )
}

export function StudyBookScreen({ slug }: { slug: string }) {
  const book = getStudyBook(slug)
  const { contentLanguage, chooseLanguage, notice } = useStudyLanguage(book)
  if (!book) return <StudyNotFound />

  return (
    <StudyPage>
      <StudyHeader
        title={book.title}
        subtitle={book.subtitle}
        subtitleLanguage={book.subtitleLanguage}
        description={book.description}
        backHref="/study"
      />
      <LanguagePicker book={book} selectedLanguage={contentLanguage} notice={notice} onSelect={chooseLanguage} />
      {book.kind === 'chapters' ? (
        <StudyChapterGrid slug={book.slug} chapters={book.chapters} />
      ) : book.kind === 'seven-laws' ? (
        <>
          <h2 className="study-section-title" lang={contentLanguage}>{translated(book.titleByLanguage, contentLanguage)}</h2>
          <SevenLawsList book={book} language={contentLanguage} />
        </>
      ) : (
        <StudyList entries={book.entries} language={contentLanguage} />
      )}
      {book.source && (
        <a className="study-source-link" href={book.source.href} target="_blank" rel="noreferrer">
          {book.source.label}<ArrowUpRight size={14} aria-hidden="true" />
        </a>
      )}
    </StudyPage>
  )
}

export function StudyChapterScreen({ slug, chapterNumber }: { slug: string; chapterNumber: number }) {
  const book = getStudyBook(slug)
  const chapter =
    book?.kind === 'chapters'
      ? book.chapters.find((item) => item.number === chapterNumber)
      : undefined
  const { contentLanguage, chooseLanguage, notice } = useStudyLanguage(book)
  if (!book || !chapter) return <StudyNotFound />

  return (
    <StudyPage>
      <StudyHeader
        title={`${book.title} · Chapter ${chapter.number}`}
        subtitle={book.subtitle}
        subtitleLanguage={book.subtitleLanguage}
        backHref={`/study/${book.slug}`}
      />
      <LanguagePicker book={book} selectedLanguage={contentLanguage} notice={notice} onSelect={chooseLanguage} />
      <StudyList entries={chapter.items} language={contentLanguage} />
      {book.source && (
        <a className="study-source-link" href={book.source.href} target="_blank" rel="noreferrer">
          {book.source.label}<ArrowUpRight size={14} aria-hidden="true" />
        </a>
      )}
    </StudyPage>
  )
}

function StudyNotFound() {
  return (
    <StudyPage>
      <StudyHeader title="Study book not found" subtitle="" />
      <Link className="study-back-link" href="/study">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Return to Study</span>
      </Link>
    </StudyPage>
  )
}
