'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import BookChapterNav from './BookChapterNav'
import MobileBookNav from './MobileBookNav'
import { Home, Search, MonitorPlay, Menu, X, Plus, Minus } from 'lucide-react'
import { uiStrings } from '../lib/i18n'
import { useLanguage } from './providers/LanguageProvider'
import { LANG_LABELS } from '../lib/lang'
import { useZoom } from './providers/ZoomProvider'

export default function Header() {
  const pathname = usePathname() || '/'
  const showBookNav = pathname.startsWith('/book')
  const isChapter = /^\/book\/\d+\/chapter\//.test(pathname || '')
  const isParasha = (pathname || '').startsWith('/parasha')
  const showZoom = isChapter || isParasha
  const isHome = pathname === '/'
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang, setLang } = useLanguage()
  const UI = uiStrings(lang)
  

  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuPanelRef = useRef<HTMLDivElement | null>(null)

  const closeMobileMenu = () => setMobileMenuOpen(false)
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    closeMobileMenu()
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        menuPanelRef.current &&
        !menuPanelRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        closeMobileMenu()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileMenu()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev)
  }

  const toggleMenu = () => setMenuOpen((o) => !o)

  // Sign in/out removed from header per request

  return (
    <header
      data-site-header
      className="sticky top-0 z-40 backdrop-blur border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/40"
    >
      <div className="container py-2 md:py-3 flex items-center gap-3 md:gap-4">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
            priority
          />

          {isHome ? (
            <div className="flex flex-col leading-tight md:hidden">
              <span className="text-[14px] font-extrabold tracking-wide text-yellow-800">
                TANACH | TELUGU
              </span>
              <span className="text-[11px] font-medium text-yellow-700">
                powered by Beth-El Torah India
              </span>
            </div>
          ) : null}

          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-base font-extrabold tracking-wide text-yellow-800">
              TANACH | TELUGU
            </span>
            <span className="text-sm font-medium text-yellow-700">
              powered by Beth-El Torah India
            </span>
          </div>
        </Link>

        <div className="flex-1 justify-center hidden md:flex">
          {showBookNav && <BookChapterNav />}
        </div>

        <nav className="relative ml-auto flex items-center gap-2 md:gap-3">
          <Link href="/" className="btn" title={UI.home ?? 'Home'}>
            <Home className="w-5 h-5" />
          </Link>
          <Link href="/search" className="btn" title={UI.search ?? 'Search'}>
            <Search className="w-5 h-5" />
          </Link>

          {/* Single menu button for all actions (desktop + mobile) */}
          <div className="relative hidden sm:block">
            <button
              className="btn"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={toggleMenu}
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {menuOpen ? (
              <div
                className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 shadow-xl p-3 flex flex-col gap-2 z-50"
                role="menu"
              >
                <button
                  className="btn w-full justify-start gap-2"
                  onClick={() => { closeMenu(); router.push('/presenter') }}
                >
                  <MonitorPlay className="w-5 h-5" />
                  <span>{UI.presenter}</span>
                </button>

                <div className="border-t border-black/10 dark:border-white/10 pt-2 mt-1" />

                {/* Language selector */}
                <div className="px-1 pb-1 text-sm opacity-70">{UI.language}</div>
                <div className="grid grid-cols-5 gap-1">
                  {(['te','hi','ta','en','he'] as const).map(code => (
                    <button
                      key={code}
                      className={`btn ${lang===code ? 'font-semibold bg-amber-200 text-black dark:bg-amber-300' : ''}`}
                      onClick={() => { setLang(code); closeMenu() }}
                      title={LANG_LABELS[code].name}
                    >
                      {LANG_LABELS[code].glyph}
                    </button>
                  ))}
                </div>

                <div className="border-t border-black/10 dark:border-white/10 pt-2 mt-1" />
                <div className="flex justify-start">
                  <ThemeToggle />
                </div>

                {/* Zoom slider (desktop menu, chapter pages only) */}
                {showZoom && (
                  <div className="mt-2">
                    <ZoomSlider />
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="btn sm:hidden"
            aria-haspopup="true"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-header-menu"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="sr-only">Toggle menu</span>
          </button>

          {mobileMenuOpen ? (
            <div
              ref={menuPanelRef}
              id="mobile-header-menu"
              className="sm:hidden absolute right-0 top-full mt-2 w-52 rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 shadow-xl p-3 flex flex-col gap-2 z-50"
            >
              <Link
                href="/presenter"
                className="btn w-full justify-start gap-2"
                onClick={closeMobileMenu}
              >
                <MonitorPlay className="w-5 h-5" />
                <span>Presenter</span>
              </Link>

              {/* Language selector on mobile */}
              <div className="border-t border-black/10 dark:border-white/10 pt-2 mt-1" />
                <div className="px-1 pb-1 text-sm opacity-70">{UI.language}</div>
              <div className="grid grid-cols-5 gap-1">
                {(['te','hi','ta','en','he'] as const).map(code => (
                  <button
                    key={code}
                    className={`btn ${lang===code ? 'font-semibold bg-amber-200 text-black dark:bg-amber-300' : ''}`}
                    onClick={() => { setLang(code); closeMobileMenu() }}
                    title={LANG_LABELS[code].name}
                  >
                    {LANG_LABELS[code].glyph}
                  </button>
                ))}
              </div>

              <div className="border-t border-black/10 dark:border-white/10 pt-2 mt-1" />
              <div className="flex justify-start">
                <ThemeToggle />
              </div>

              {/* Zoom slider (mobile menu, chapter pages only) */}
              {showZoom && (
                <div className="mt-2">
                  <ZoomSlider />
                </div>
              )}
            </div>
          ) : null}
        </nav>
      </div>

      {showBookNav && <MobileBookNav />}
    </header>
  )
}

function ZoomSlider() {
  const { level, setLevel } = useZoom()
  // 5 steps mapped to 0,25,50,75,100%
  const percents = [0, 25, 50, 75, 100]
  const idx = Math.max(0, Math.min(4, level + 2))
  const percent = percents[idx]

  const inc = () => setLevel(level + 1)
  const dec = () => setLevel(level - 1)

  return (
    <div className="space-y-2">
      <div className="text-sm opacity-70 mb-1 text-center">Zoom</div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          className={`btn btn-chip ${level <= -2 ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={dec}
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="min-w-[64px] text-center font-semibold select-none">{percent}%</div>
        <button
          type="button"
          className={`btn btn-chip ${level >= 2 ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={inc}
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

