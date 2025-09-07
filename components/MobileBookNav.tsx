'use client'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import bible from '../data/bible.json'
import { BOOK_ORDER_DROPDOWN, BOOK_NAMES, combinedBookLabel } from '../lib/data/books'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPsalmCategoryOrder } from '../lib/data/psalmCategories' // ← NEW

export default function MobileBookNav() {
  const router = useRouter()
  const pathname = usePathname()
  const onBookPage = !!pathname && pathname.startsWith('/book')
  if (!onBookPage) return null

  const params = useParams() as any
  const search = useSearchParams()

  const b = params?.bnumber ? Number(params.bnumber) : undefined
  const c = params?.cnumber ? Number(params.cnumber) : undefined
  const cat = search?.get('cat') || null // only relevant for Psalms

  const allBooks = (bible as any).books ?? []
  const order = useMemo(
    () => BOOK_ORDER_DROPDOWN.filter(bn => allBooks.some(x => x.bnumber === bn)),
    [allBooks]
  )

  const currentBook = allBooks.find((x:any) => x.bnumber === b)
  const chapterCount = currentBook?.chapters?.length ?? 0

  // ---- Psalms category context (book 19 only) ----
  const categoryOrder = b === 19 ? getPsalmCategoryOrder(cat) : null
  const catIndex = categoryOrder && typeof c === 'number' ? categoryOrder.indexOf(c) : -1
  const hasPrev = categoryOrder ? catIndex > 0 : (typeof c === 'number' && c > 1)
  const hasNext = categoryOrder
    ? (catIndex >= 0 && catIndex < categoryOrder.length - 1)
    : (typeof c === 'number' && c < chapterCount)

  const changeBook = (bnStr: string) => {
    const bn = Number(bnStr)
    if (!bn) return
    // Changing book clears category context
    router.push(`/book/${bn}${typeof c === 'number' ? `/chapter/1` : ''}`)
  }

  const changeChapter = (cnStr: string) => {
    const cn = Number(cnStr)
    if (!b || !cn) return
    const suffix = cat ? `?cat=${cat}` : ''
    router.push(`/book/${b}/chapter/${cn}${suffix}`)
  }

  const prev = () => {
    if (!b || !c) return
    if (categoryOrder && catIndex > 0) {
      const target = categoryOrder[catIndex - 1]
      router.push(`/book/${b}/chapter/${target}?cat=${cat}`)
    } else if (c > 1) {
      router.push(`/book/${b}/chapter/${c-1}`)
    }
  }

  const next = () => {
    if (!b || !c) return
    if (categoryOrder && catIndex >= 0 && catIndex < categoryOrder.length - 1) {
      const target = categoryOrder[catIndex + 1]
      router.push(`/book/${b}/chapter/${target}?cat=${cat}`)
    } else if (chapterCount && c < chapterCount) {
      router.push(`/book/${b}/chapter/${c+1}`)
    }
  }

  return (
    /* sits just below the sticky header on phones */
    <div className="md:hidden sticky top-[64px] z-30 bg-white/90 dark:bg-black/60 backdrop-blur border-b border-black/10 dark:border-white/10">
      {/* Two rows on phones; no horizontal scrolling */}
      <div className="container py-2 grid grid-cols-12 gap-2">
        {/* Row 1: Book select full width */}
        <div className="col-span-12">
          <select
            className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
            value={b ?? order[0]}
            onChange={(e)=>changeBook(e.target.value)}
          >
            {order.map((bn)=>(
              <option key={bn} value={bn}>
                {combinedBookLabel(bn, BOOK_NAMES[bn])}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: Prev | Chapter | Next (only on chapter pages) */}
        {typeof c === 'number' && chapterCount > 0 && (
          <div className="col-span-12 flex items-center justify-center gap-2">
            <button
              onClick={prev}
              className={`btn btn-chip ${hasPrev ? '' : 'opacity-50 pointer-events-none'}`}
              aria-label="Previous chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              className="w-24 px-2 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-center"
              value={c}
              onChange={(e)=>changeChapter(e.target.value)}
            >
              {Array.from({length: chapterCount}, (_,i)=>i+1).map((n)=>(
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <button
              onClick={next}
              className={`btn btn-chip ${hasNext ? '' : 'opacity-50 pointer-events-none'}`}
              aria-label="Next chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
