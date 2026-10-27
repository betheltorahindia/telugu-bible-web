'use client'

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  Home,
  Languages,
  Heart,
  Menu,
  MousePointer2,
  Minus,
  MonitorPlay,
  Columns2,
  Search,
  Settings,
  Sparkles,
  Type,
  Users,
  X,
  Plus,
  ZoomIn,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import BookChapterNav from './BookChapterNav'
import MobileBookNav from './MobileBookNav'
import StudyNavigation from './study/StudyNavigation'
import PrayerNavigation from './prayers/PrayerNavigation'
import { uiStrings } from '../lib/i18n'
import { useLanguage } from './providers/LanguageProvider'
import { LANG_LABELS, type LangCode } from '../lib/lang'
import { useZoom } from './providers/ZoomProvider'
import { useParallel } from './providers/ParallelProvider'
import { getStudyBook, hasStudyTranslation, studyBooks } from '../lib/data/study/books'
import { getPrayer, hasPrayerTranslation, hasPrayerTransliteration, prayers } from '../lib/data/prayers'

const primaryLinks = [
  { name: 'Home', href: '/', icon: Home, available: true },
  { name: 'Prayers', href: '/prayers', icon: Heart, available: true },
  { name: 'Tanach', href: '/tanach', icon: BookOpen, available: true },
  { name: 'Social', href: '/social', icon: Users, available: true },
  { name: 'Study', href: '/study', icon: Sparkles, available: true },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays, available: true },
]

export default function Header() {
  const pathname = usePathname() || '/'
  const router = useRouter()
  const searchParams = useSearchParams()
  const showBookNav = pathname.startsWith('/book')
  const showStudyTools = pathname.startsWith('/study')
  const showPrayerTools = pathname.startsWith('/prayers')
  const currentStudyBook = showStudyTools
    ? getStudyBook(pathname.split('/')[2] || '')
    : undefined
  const currentPrayer = showPrayerTools ? getPrayer(pathname.split('/')[2] || '') : undefined
  const currentPrayerSection = showPrayerTools ? pathname.split('/')[3] : undefined
  const showZoom = /^\/book\/\d+\/chapter\//.test(pathname) || pathname.startsWith('/parasha') || showStudyTools || showPrayerTools
  const showTanachTools =
    pathname === '/tanach' ||
    pathname.startsWith('/book') ||
    pathname.startsWith('/parasha') ||
    pathname === '/search' ||
    pathname.startsWith('/presenter') ||
    showStudyTools ||
    showPrayerTools
  const isPrimaryLinkActive = (name: string) => {
    if (name === 'Home') return pathname === '/' && activeHash !== '#prayers' && activeHash !== '#wisdom'
    if (name === 'Tanach') return showTanachTools && !showStudyTools && !showPrayerTools
    if (name === 'Settings') return pathname.startsWith('/settings')
    if (name === 'Prayers') return showPrayerTools || (pathname === '/' && activeHash === '#prayers')
    if (name === 'Study') return pathname.startsWith('/study') || (pathname === '/' && activeHash === '#wisdom')
    const link = primaryLinks.find((item) => item.name === name)
    return link ? pathname.startsWith(link.href) : false
  }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileTanachToolsOpen, setMobileTanachToolsOpen] = useState(false)
  const [activeTanachTool, setActiveTanachTool] = useState<'search' | 'language' | 'zoom' | 'parallel' | null>(null)
  const [tanachToolPopoverTop, setTanachToolPopoverTop] = useState<number | null>(null)
  const [studyLanguageNotice, setStudyLanguageNotice] = useState('')
  const [prayerSearchValue, setPrayerSearchValue] = useState('')
  const [activeHash, setActiveHash] = useState('')
  const { lang, setLang } = useLanguage()
  const UI = uiStrings(lang)
  const { parallel, setParallel } = useParallel()
  const prayerLanguageAvailable = (code: LangCode) =>
    currentPrayer
      ? hasPrayerTranslation(currentPrayer, code, currentPrayerSection)
      : prayers.some((prayer) => hasPrayerTranslation(prayer, code))
  const prayerToolLanguage = lang
  const prayerTransliterationMode = searchParams.get('mode') === 'transliteration'
  const prayerTransliterationAvailable = currentPrayer
    ? hasPrayerTransliteration(currentPrayer, 'te', currentPrayerSection)
    : prayers.some((prayer) => hasPrayerTransliteration(prayer, 'te'))
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuPanelRef = useRef<HTMLDivElement | null>(null)
  const toolsPanelRef = useRef<HTMLElement | null>(null)
  const toolsWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileTanachToolsOpen(false)
    setActiveTanachTool(null)
    setTanachToolPopoverTop(null)
    setStudyLanguageNotice('')
  }, [pathname])

  useEffect(() => {
    setPrayerSearchValue(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash)
    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen && !mobileTanachToolsOpen && !activeTanachTool) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        mobileMenuOpen &&
        !menuPanelRef.current?.contains(target) &&
        !menuButtonRef.current?.contains(target)
      ) {
        setMobileMenuOpen(false)
      }
      if (mobileTanachToolsOpen && !toolsWrapRef.current?.contains(target)) {
        setMobileTanachToolsOpen(false)
      }
      if (
        activeTanachTool &&
        !toolsWrapRef.current?.contains(target) &&
        !toolsPanelRef.current?.contains(target)
      ) {
        setActiveTanachTool(null)
        setTanachToolPopoverTop(null)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        setMobileTanachToolsOpen(false)
        setActiveTanachTool(null)
        setTanachToolPopoverTop(null)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen, mobileTanachToolsOpen, activeTanachTool])

  const toggleTanachTool = (
    tool: 'search' | 'language' | 'zoom' | 'parallel',
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (activeTanachTool === tool) {
      setActiveTanachTool(null)
      setTanachToolPopoverTop(null)
      return
    }
    const bounds = event.currentTarget.getBoundingClientRect()
    const wrapBounds = toolsWrapRef.current?.getBoundingClientRect()
    if (!wrapBounds) return
    const buttonCenter = bounds.top + bounds.height / 2 - wrapBounds.top
    setTanachToolPopoverTop(Math.max(40, Math.min(buttonCenter, wrapBounds.height - 40)))
    setActiveTanachTool(tool)
  }

  const studyLanguageAvailable = (code: LangCode) =>
    currentStudyBook
      ? hasStudyTranslation(currentStudyBook, code)
      : studyBooks.some((book) => hasStudyTranslation(book, code))
  const studyToolLanguage =
    showStudyTools && lang !== 'en' && lang !== 'te' && !studyLanguageAvailable(lang)
      ? 'te'
      : lang

  const submitPrayerSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (prayerSearchValue.trim()) params.set('q', prayerSearchValue.trim())
    else params.delete('q')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const togglePrayerTransliteration = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (prayerTransliterationMode) params.delete('mode')
    else params.set('mode', 'transliteration')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <>
      <header data-site-header className="site-header sticky top-0 z-40">
        <div className="container site-header-inner">
          <Link href="/" className="site-brand">
            <Image
              src="/android-icon-512x512.png"
              alt=""
              width={56}
              height={56}
              className="site-brand-mark object-contain"
              priority
            />
            <span className="site-brand-copy">
              <span className="site-brand-name">BETHEL TORAH INDIA</span>
              <span className="site-brand-tagline">Direct way to Shamayim</span>
            </span>
          </Link>

          <nav className="primary-nav" aria-label="Main navigation">
            {primaryLinks.map(({ name, href, available }) => {
              const isActive = isPrimaryLinkActive(name)
              if (!available) {
                return (
                  <span key={name} className={`primary-nav-link is-coming-soon ${isActive ? 'is-active' : ''}`} title="Coming soon">
                    {name}
                  </span>
                )
              }

              return (
                <Link
                  key={name}
                  href={href}
                  className={`primary-nav-link ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {name}
                </Link>
              )
            })}
          </nav>

          <div className="header-actions">
            <Link
              href="/settings"
              className={`header-icon-link desktop-settings ${isPrimaryLinkActive('Settings') ? 'is-active' : ''}`}
              aria-label="Settings"
              aria-current={isPrimaryLinkActive('Settings') ? 'page' : undefined}
            >
              <Settings className="h-4 w-4" />
            </Link>
            <span className="desktop-theme-toggle"><ThemeToggle /></span>
            <button
              ref={menuButtonRef}
              type="button"
              className="header-icon-link mobile-menu-button"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="primary-mobile-menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div ref={menuPanelRef} id="primary-mobile-menu" className="site-menu mobile-nav-panel">
              <nav className="mobile-primary-nav" aria-label="Mobile navigation">
                {primaryLinks.map(({ name, href, icon: Icon, available }) =>
                  available ? (
                    <Link
                      key={name}
                      href={href}
                      className={`mobile-nav-link ${isPrimaryLinkActive(name) ? 'is-active' : ''}`}
                      aria-current={isPrimaryLinkActive(name) ? 'page' : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {name}
                    </Link>
                  ) : (
                    <span key={name} className="mobile-nav-link is-coming-soon" aria-disabled="true">
                      <Icon className="h-4 w-4" />
                      {name}
                      <span className="mobile-coming-soon">Soon</span>
                    </span>
                  ),
                )}
              </nav>
              <div className="mobile-settings">
                <span className="settings-title">Appearance</span>
                <ThemeToggle />
                <Link
                  href="/settings"
                  className={`mobile-settings-button ${isPrimaryLinkActive('Settings') ? 'is-active' : ''}`}
                  aria-current={isPrimaryLinkActive('Settings') ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {showTanachTools && (
        <>
        <div className={`tanach-tools-wrap ${showStudyTools ? 'study-tools-wrap' : ''} ${showPrayerTools ? 'prayer-tools-wrap' : ''}`} ref={toolsWrapRef}>
          <button
            type="button"
            className="tanach-tools-mobile-toggle"
            aria-label={mobileTanachToolsOpen ? 'Close reading tools' : 'Open reading tools'}
            aria-expanded={mobileTanachToolsOpen}
            aria-controls="tanach-reading-tools-rail"
            onClick={() => {
              setMobileTanachToolsOpen((open) => !open)
              setActiveTanachTool(null)
              setTanachToolPopoverTop(null)
            }}
          >
            {mobileTanachToolsOpen
              ? <X className="h-5 w-5" />
              : <MousePointer2 className="h-5 w-5" />}
          </button>
          <div
            id="tanach-reading-tools-rail"
            className={`tanach-tool-rail ${mobileTanachToolsOpen ? 'is-open' : ''}`}
            role="toolbar"
            aria-label={showPrayerTools ? 'Prayer reading tools' : showStudyTools ? 'Study reading tools' : 'Tanach reading tools'}
          >
            {showPrayerTools ? (
              <button
                type="button"
                className={`tanach-rail-button ${activeTanachTool === 'search' ? 'is-active' : ''}`}
                aria-label="Search prayers"
                aria-expanded={activeTanachTool === 'search'}
                aria-controls={activeTanachTool === 'search' ? 'tanach-reading-tools' : undefined}
                data-label="Search"
                onClick={(event) => toggleTanachTool('search', event)}
              >
                <Search className="h-5 w-5" />
                <span className="tanach-rail-label">Search</span>
              </button>
            ) : (
              <Link href="/search" className="tanach-rail-button" aria-label={UI.search ?? 'Search'} data-label={UI.search ?? 'Search'}>
                <Search className="h-5 w-5" />
                <span className="tanach-rail-label">{UI.search ?? 'Search'}</span>
              </Link>
            )}
            {!showStudyTools && !showPrayerTools && (
              <button
                type="button"
                className="tanach-rail-button"
                aria-label={UI.presenter}
                data-label={UI.presenter}
                onClick={() => router.push('/presenter')}
              >
                <MonitorPlay className="h-5 w-5" />
                <span className="tanach-rail-label">{UI.presenter}</span>
              </button>
            )}
            <button
              type="button"
              className={`tanach-rail-button ${activeTanachTool === 'language' ? 'is-active' : ''}`}
              aria-label={UI.language}
              aria-expanded={activeTanachTool === 'language'}
              aria-controls={activeTanachTool === 'language' ? 'tanach-reading-tools' : undefined}
              data-label={UI.language}
              onClick={(event) => toggleTanachTool('language', event)}
            >
              <Languages className="h-5 w-5" />
              <span className="tanach-rail-label">{UI.language}</span>
            </button>
            {showZoom && (
              <>
                <button
                  type="button"
                  className={`tanach-rail-button ${activeTanachTool === 'zoom' ? 'is-active' : ''}`}
                  aria-label="Zoom"
                  aria-expanded={activeTanachTool === 'zoom'}
                  aria-controls={activeTanachTool === 'zoom' ? 'tanach-reading-tools' : undefined}
                  data-label="Zoom"
                  onClick={(event) => toggleTanachTool('zoom', event)}
                >
                  <ZoomIn className="h-5 w-5" />
                  <span className="tanach-rail-label">Zoom</span>
                </button>
                {showPrayerTools && (
                  <button
                    type="button"
                    className={`tanach-rail-button ${prayerTransliterationMode ? 'is-active' : ''}`}
                    aria-label={prayerTransliterationMode ? 'Show prayer translation' : 'Show transliteration'}
                    aria-pressed={prayerTransliterationMode}
                    disabled={!prayerTransliterationAvailable}
                    data-label="Trans"
                    onClick={togglePrayerTransliteration}
                    title={prayerTransliterationAvailable ? 'Toggle Hebrew-prayer transliteration' : 'Transliteration unavailable for this section'}
                  >
                    <Type className="h-5 w-5" />
                    <span className="tanach-rail-label">Trans</span>
                  </button>
                )}
                {!showStudyTools && !showPrayerTools && (
                  <button
                    type="button"
                    className={`tanach-rail-button ${activeTanachTool === 'parallel' ? 'is-active' : ''}`}
                    aria-label="Parallel reading"
                    aria-expanded={activeTanachTool === 'parallel'}
                    aria-controls={activeTanachTool === 'parallel' ? 'tanach-reading-tools' : undefined}
                    data-label="Parallel"
                    onClick={(event) => toggleTanachTool('parallel', event)}
                  >
                    <Columns2 className="h-5 w-5" />
                    <span className="tanach-rail-label">Parallel</span>
                  </button>
                )}
              </>
            )}
          </div>
          {activeTanachTool && (
            <aside
              ref={toolsPanelRef}
              id="tanach-reading-tools"
              className="tanach-tool-popover"
              style={tanachToolPopoverTop === null ? undefined : { top: `${tanachToolPopoverTop}px` }}
              aria-label={showPrayerTools ? 'Prayer reading tool options' : showStudyTools ? 'Study reading tool options' : 'Tanach reading tool options'}
            >
              <button
                type="button"
                className="tanach-tool-popover-close"
                aria-label="Close Tanach tool options"
                onClick={() => {
                  setActiveTanachTool(null)
                  setTanachToolPopoverTop(null)
                }}
              >
                <X className="h-4 w-4" />
              </button>
              {showPrayerTools && activeTanachTool === 'search' && (
                <form className="tanach-tool-group prayer-search-form" onSubmit={submitPrayerSearch}>
                  <label className="tanach-tool-label" htmlFor="prayer-search">Search prayers</label>
                  <div className="prayer-search-controls">
                    <input
                      id="prayer-search"
                      type="search"
                      value={prayerSearchValue}
                      onChange={(event) => setPrayerSearchValue(event.target.value)}
                      placeholder="Search prayer text"
                    />
                    <button type="submit">Search</button>
                  </div>
                </form>
              )}
              {activeTanachTool === 'language' && (
                <div className="tanach-tool-group">
                  <span className="tanach-tool-label">{UI.language}</span>
                  <LanguageButtons
                    lang={showPrayerTools ? prayerToolLanguage : showStudyTools ? studyToolLanguage : lang}
                    onSelect={(code) => {
                      if (showPrayerTools && !prayerLanguageAvailable(code)) {
                        return
                      }
                      if (showStudyTools && !studyLanguageAvailable(code)) {
                        setStudyLanguageNotice(`${LANG_LABELS[code].name} is not available for this study book yet.`)
                        return
                      }
                      setStudyLanguageNotice('')
                      setLang(code)
                    }}
                    compact
                    isAvailable={showPrayerTools ? prayerLanguageAvailable : showStudyTools ? studyLanguageAvailable : undefined}
                    disableUnavailable={showPrayerTools}
                  />
                  {showStudyTools && studyLanguageNotice && (
                    <p className="study-tool-language-notice" role="status">{studyLanguageNotice}</p>
                  )}
                </div>
              )}
              {activeTanachTool === 'zoom' && <ZoomSlider />}
              {!showStudyTools && !showPrayerTools && activeTanachTool === 'parallel' && (
                <ParallelSelector lang={lang} parallel={parallel} setParallel={setParallel} />
              )}
            </aside>
          )}
        </div>
        {showBookNav && <div className="tanach-chapter-nav desktop-book-nav"><BookChapterNav /></div>}
        {showBookNav && <MobileBookNav />}
        {showStudyTools && <StudyNavigation />}
        {showPrayerTools && <PrayerNavigation />}
        </>
      )}
    </>
  )
}

function LanguageButtons({
  lang,
  onSelect,
  compact = false,
  isAvailable,
  disableUnavailable = false,
}: {
  lang: LangCode
  onSelect: (code: LangCode) => void
  compact?: boolean
  isAvailable?: (code: LangCode) => boolean
  disableUnavailable?: boolean
}) {
  return (
    <div className={`language-buttons ${compact ? 'is-compact' : ''}`}>
      {(['te', 'hi', 'ta', 'en', 'he'] as const).map((code) => (
        <button
          key={code}
          type="button"
          className={`language-button ${lang === code ? 'is-selected' : ''} ${isAvailable && !isAvailable(code) ? 'is-unavailable' : ''}`}
          onClick={() => onSelect(code)}
          disabled={disableUnavailable && isAvailable ? !isAvailable(code) : undefined}
          aria-disabled={isAvailable ? !isAvailable(code) : undefined}
          title={isAvailable && !isAvailable(code) ? `${LANG_LABELS[code].name} unavailable for this content` : LANG_LABELS[code].name}
          aria-label={LANG_LABELS[code].name}
          aria-pressed={lang === code}
        >
          {LANG_LABELS[code].glyph}
        </button>
      ))}
    </div>
  )
}

function ZoomSlider() {
  const { level, setLevel } = useZoom()
  const percent = [0, 25, 50, 75, 100][Math.max(0, Math.min(4, level + 2))]

  return (
    <div className="tanach-tool-group zoom-tools">
      <span className="tanach-tool-label">Zoom</span>
      <div className="zoom-tool-controls">
        <button
          type="button"
          className="tanach-tool-icon"
          onClick={() => setLevel(level - 1)}
          disabled={level <= -2}
          aria-label="Zoom out"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="zoom-value">{percent}%</span>
        <button
          type="button"
          className="tanach-tool-icon"
          onClick={() => setLevel(level + 1)}
          disabled={level >= 2}
          aria-label="Zoom in"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function ParallelSelector({
  lang,
  parallel,
  setParallel,
}: {
  lang: LangCode
  parallel: LangCode | null
  setParallel: (code: LangCode | null) => void
}) {
  return (
    <div className="tanach-tool-group parallel-tools">
      <span className="tanach-tool-label">Parallel</span>
      <select
        className="parallel-select"
        value={parallel ?? ''}
        onChange={(event) =>
          setParallel(event.target.value ? (event.target.value as LangCode) : null)
        }
        aria-label="Parallel language"
      >
        <option value="">Off</option>
        {(['te', 'hi', 'ta', 'en', 'he'] as const)
          .filter((code) => code !== lang)
          .map((code) => (
            <option key={code} value={code}>
              {LANG_LABELS[code].name}
            </option>
          ))}
      </select>
    </div>
  )
}
