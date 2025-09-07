'use client'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { Home, Search } from 'lucide-react'
import BookChapterNav from './BookChapterNav'
import { usePathname } from 'next/navigation'
import MobileBookNav from './MobileBookNav'
import Image from 'next/image'

export default function Header() {
  const pathname = usePathname() || '/'
  const showBookNav = pathname.startsWith('/book')
  const isHome = pathname === '/'

  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/40">
      <div className="container py-2 md:py-3 flex items-center gap-3 md:gap-4">
        {/* Brand: logo always; text:
            - mobile: only on Home
            - md+: always */}
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
            priority
          />

          {/* Mobile text only on Home */}
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

          {/* Desktop/Tablet text always visible (smaller than before) */}
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-base font-extrabold tracking-wide text-yellow-800">
              TANACH | TELUGU
            </span>
            <span className="text-sm font-medium text-yellow-700">
              powered by Beth-El Torah India
            </span>
          </div>
        </Link>

        {/* Desktop/tablet ONLY (centred) */}
        <div className="flex-1 justify-center hidden md:flex">
          {showBookNav && <BookChapterNav />}
        </div>

        <nav className="ml-auto flex items-center gap-2 md:gap-3">
          <Link href="/" className="btn" title="Home">
            <Home className="w-5 h-5" />
          </Link>
          <Link href="/search" className="btn" title="శోధన">
            <Search className="w-5 h-5" />
          </Link>
          <ThemeToggle />
        </nav>
      </div>

      {/* Phones ONLY: chapter/book toolbar */}
      {showBookNav && <MobileBookNav />}
    </header>
  )
}
