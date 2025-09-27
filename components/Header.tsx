'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import BookChapterNav from './BookChapterNav'
import MobileBookNav from './MobileBookNav'
import { Home, Search, MonitorPlay, Menu, X } from 'lucide-react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

export default function Header() {
  const pathname = usePathname() || '/'
  const showBookNav = pathname.startsWith('/book')
  const isHome = pathname === '/'
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const [signingOut, setSigningOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuPanelRef = useRef<HTMLDivElement | null>(null)

  const closeMobileMenu = () => setMobileMenuOpen(false)

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

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  const handleMobileSignOut = async () => {
    await handleSignOut()
    closeMobileMenu()
  }

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
          <Link href="/" className="btn" title="Home">
            <Home className="w-5 h-5" />
          </Link>
          <Link href="/search" className="btn" title="Search">
            <Search className="w-5 h-5" />
          </Link>

          <div className="hidden sm:flex items-center gap-2 md:gap-3">
            <Link
              href="/presenter"
              className="btn inline-flex items-center gap-2"
              title="Build a verse presenter"
            >
              <MonitorPlay className="w-5 h-5" />
              <span className="font-medium">Presenter</span>
            </Link>
            {session ? (
              <button type="button" className="btn" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? 'Signing out...' : 'Sign out'}
              </button>
            ) : (
              <Link href="/presenter" className="btn" title="Sign in">
                Sign in
              </Link>
            )}
            <ThemeToggle />
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

              {session ? (
                <>
                  <button
                    type="button"
                    className="btn w-full justify-start"
                    onClick={handleMobileSignOut}
                    disabled={signingOut}
                  >
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </button>

                </>
              ) : (
                <Link
                  href="/presenter"
                  className="btn w-full justify-start"
                  onClick={closeMobileMenu}
                >
                  Sign in
                </Link>
              )}

              <div className="border-t border-black/10 dark:border-white/10 pt-2 mt-1" />
              <div className="flex justify-start">
                <ThemeToggle />
              </div>
            </div>
          ) : null}
        </nav>
      </div>

      {showBookNav && <MobileBookNav />}
    </header>
  )
}

