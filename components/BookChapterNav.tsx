'use client'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import bible from '../data/bible.json'
import { BOOK_ORDER_DROPDOWN, combinedBookLabel } from '../lib/data/books'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { getPsalmCategoryOrder } from '../lib/data/psalmCategories'

type B = { bnumber: number; bname: string; chapters: { cnumber: number }[] }

type MenuPos = { top: number; left: number; width: number }

function useFixedMenuPosition(btnRef: React.RefObject<HTMLElement>, open: boolean) {
  const [pos, setPos] = useState<MenuPos | null>(null)

  useLayoutEffect(() => {
    function position() {
      const el = btnRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const top = rect.bottom + 8
      let left = rect.left
      const width = Math.min(Math.max(rect.width, 240), 420)
      const maxLeft = Math.max(0, window.innerWidth - width - 8)
      left = Math.min(left, maxLeft)
      setPos({ top, left, width })
    }

    if (open) {
      position()
      window.addEventListener('resize', position)
      window.addEventListener('scroll', position, true)
      return () => {
        window.removeEventListener('resize', position)
        window.removeEventListener('scroll', position, true)
      }
    } else {
      setPos(null)
    }
  }, [open, btnRef])

  return pos
}

export default function BookChapterNav() {
  const router = useRouter()
  const pathname = usePathname()
  const onBookPage = !!pathname && pathname.startsWith('/book')
  if (!onBookPage) return null

  const params = useParams() as any
  const search = useSearchParams()

  const b = params?.bnumber ? Number(params.bnumber) : undefined
  const c = params?.cnumber ? Number(params.cnumber) : undefined

  // Preserve context from URL
  const mode = search?.get('mode') || null            // 'parashot' | 'categories' | null
  const cat  = search?.get('cat')  || null            // only when mode === 'categories'

  const allBooks: B[] = (bible as any).books ?? []
  const order = BOOK_ORDER_DROPDOWN.filter(bn => allBooks.some(x => x.bnumber === bn))

  const currentBook = allBooks.find(x => x.bnumber === b)
  const chapterCount = currentBook?.chapters?.length ?? 0

  // --- Psalms category logic (only b === 19 and mode === 'categories') ---
  const categoryOrder = (b === 19 && mode === 'categories') ? getPsalmCategoryOrder(cat) : null
  const catIndex = categoryOrder && typeof c === 'number' ? categoryOrder.indexOf(c) : -1
  const hasPrev = categoryOrder ? catIndex > 0 : (typeof c === 'number' && c > 1)
  const hasNext = categoryOrder
    ? (catIndex >= 0 && catIndex < categoryOrder.length - 1)
    : (typeof c === 'number' && c < chapterCount)

  // Build suffix to preserve context on chapter routes
  const buildSuffix = (overrideChapter?: number) => {
    // keep parashot mode (Torah) OR categories mode (Psalms + cat)
    if (mode === 'parashot') {
      return '?mode=parashot'
    }
    if (mode === 'categories' && cat) {
      return `?mode=categories&cat=${encodeURIComponent(cat)}`
    }
    return ''
  }

  // Book dropdown
  const [bookOpen, setBookOpen] = useState(false)
  const bookBtnRef = useRef<HTMLButtonElement | null>(null)
  const bookPos = useFixedMenuPosition(bookBtnRef, bookOpen)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const btn = bookBtnRef.current
      if (bookOpen && btn && !btn.contains(e.target as Node)) {
        const menu = document.getElementById('book-menu-fixed')
        if (!menu || !menu.contains(e.target as Node)) setBookOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [bookOpen])

  const goBook = (bn: number) => {
    setBookOpen(false)
    // When changing book, clear special context
    router.push(`/book/${bn}`)
  }

  // Chapter dropdown
  const [chapOpen, setChapOpen] = useState(false)
  const chapBtnRef = useRef<HTMLButtonElement | null>(null)
  const chapPos = useFixedMenuPosition(chapBtnRef, chapOpen)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const btn = chapBtnRef.current
      if (chapOpen && btn && !btn.contains(e.target as Node)) {
        const menu = document.getElementById('chapter-menu-fixed')
        if (!menu || !menu.contains(e.target as Node)) setChapOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [chapOpen])

  const goChapter = (cn: number) => {
    setChapOpen(false)
    if (!b) return
    const suffix = buildSuffix(cn)
    router.push(`/book/${b}/chapter/${cn}${suffix}`)
  }

  const prevChapter = () => {
    if (!b || !c) return
    if (categoryOrder && catIndex > 0) {
      const target = categoryOrder[catIndex - 1]
      router.push(`/book/${b}/chapter/${target}${buildSuffix(target)}`)
    } else if (c > 1) {
      router.push(`/book/${b}/chapter/${c - 1}${buildSuffix(c - 1)}`)
    }
  }

  const nextChapter = () => {
    if (!b || !c) return
    if (categoryOrder && catIndex >= 0 && catIndex < categoryOrder.length - 1) {
      const target = categoryOrder[catIndex + 1]
      router.push(`/book/${b}/chapter/${target}${buildSuffix(target)}`)
    } else if (chapterCount && c < chapterCount) {
      router.push(`/book/${b}/chapter/${c + 1}${buildSuffix(c + 1)}`)
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto flex-nowrap max-w-full py-1 px-1 md:justify-center">
      {/* Book dropdown trigger */}
      <div className="relative shrink-0">
        <button
          ref={bookBtnRef}
          className="btn shrink-0 px-3 py-2 sm:px-4 min-w-[220px] sm:min-w-[18rem]"
          onClick={() => setBookOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={bookOpen}
          title="Select Book"
        >
          {combinedBookLabel(b ?? order[0], currentBook?.bname)}
          <ChevronDown className="w-4 h-4 opacity-70" />
        </button>
      </div>

      {/* Chapter controls */}
      {typeof c === 'number' && chapterCount > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            className={`btn btn-chip shrink-0 ${hasPrev ? '' : 'opacity-50 pointer-events-none'}`}
            onClick={prevChapter}
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative shrink-0">
            <button
              ref={chapBtnRef}
              className="btn btn-chip shrink-0 px-3"
              onClick={() => setChapOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={chapOpen}
              title="Select chapter"
            >
              {c ?? 1} <ChevronDown className="w-4 h-4 opacity-70" />
            </button>
          </div>

          <button
            className={`btn btn-chip shrink-0 ${hasNext ? '' : 'opacity-50 pointer-events-none'}`}
            onClick={nextChapter}
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------- FIXED MENUS (not clipped by header) ---------- */}
      {bookOpen && bookPos && (
        <div
          id="book-menu-fixed"
          className="card z-[9999] fixed"
          style={{ top: bookPos.top, left: bookPos.left, width: bookPos.width, maxHeight: '60vh', overflow: 'auto' }}
        >
          <ul className="space-y-1">
            {order.map(bn => {
              const isActive = bn === b
              return (
                <li key={bn}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                        : 'hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                    onClick={() => goBook(bn)}
                  >
                    {combinedBookLabel(bn)}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {chapOpen && chapPos && (
        <div
          id="chapter-menu-fixed"
          className="card z-[9999] fixed"
          style={{ top: chapPos.top, left: chapPos.left, width: 176, maxHeight: '50vh', overflow: 'auto' }}
        >
          <ul className="grid grid-cols-4 gap-2">
            {Array.from({ length: chapterCount }, (_, i) => i + 1).map(num => (
              <li key={num}>
                <button
                  className={`w-full px-2 py-1 rounded-lg text-sm transition ${
                    num === c
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                  onClick={() => goChapter(num)}
                >
                  {num}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
