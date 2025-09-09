'use client'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import bible from '../../../data/bible.json'
import { BOOK_NAMES, DIVISION_BOOKS } from '../../../lib/data/books'
import { PARASHIYOT } from '../../../lib/data/parashiyot'
import { useMemo, useState, useEffect } from 'react'
import { PSALM_CATEGORIES } from '../../../lib/data/psalmCategories'

export default function BookPage() {
  // Keep this simple & robust
  const params = useParams() as { [key: string]: string }
  const search = useSearchParams()

  const bnum = Number(params.bnumber)
  const book = (bible as any).books?.find((b: any) => b.bnumber === bnum)

  // Modes:
  // - 'parashot' is only used/shown for Torah
  // - 'categories' is only used/shown for Psalms (book 19)
  type Mode = 'chapters' | 'parashot' | 'categories'

  // Read mode from URL (so back button can return to the same tab)
  const urlMode = (search?.get('mode') as Mode) || 'chapters'
  const [mode, setMode] = useState<Mode>('chapters')

  useEffect(() => {
    setMode(urlMode)
  }, [urlMode])

  const isTorah = DIVISION_BOOKS['Torah'].includes(bnum)
  const isPsalms = bnum === 19
  const parashot = useMemo(() => PARASHIYOT.filter(p => p.book === bnum), [bnum])

  if (!book) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{BOOK_NAMES[bnum] ?? `Book ${bnum}`}</h1>
        <p className="opacity-70">ఈ పుస్తకానికి డేటా లేదు (తర్వాత XML నుంచి లోడ్ అవుతుంది).</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Title + toggles (Torah/Psalms only) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{BOOK_NAMES[bnum] ?? book.bname}</h1>

        {/* Torah toggle */}
        {isTorah && (
          <div className="flex items-center gap-2 overflow-x-auto flex-nowrap -mx-1 px-1">
            <span className="badge shrink-0">అధ్యాయాలు / పరాషాలు</span>
            <div className="btn shrink-0">
              <button
                onClick={() => setMode('chapters')}
                className={mode === 'chapters' ? 'font-semibold' : ''}
              >
                అధ్యాయాలు
              </button>
              <span className="mx-1">|</span>
              <button
                onClick={() => setMode('parashot')}
                className={mode === 'parashot' ? 'font-semibold' : ''}
              >
                పరాషాలు
              </button>
            </div>
          </div>
        )}

        {/* Psalms toggle */}
        {isPsalms && (
          <div className="flex items-center gap-2 overflow-x-auto flex-nowrap -mx-1 px-1">
            <div className="btn shrink-0">
              <button
                onClick={() => setMode('chapters')}
                className={mode === 'chapters' ? 'font-semibold' : ''}
              >
                అధ్యాయాలు
              </button>
              <span className="mx-1">|</span>
              <button
                onClick={() => setMode('categories')}
                className={mode === 'categories' ? 'font-semibold' : ''}
              >
                వివిధ సందర్భాలు
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CHAPTERS (default for all books) */}
      {mode === 'chapters' && (
        <div className="card">
          {/* Responsive chapter grid: phones→4, sm→6, md→8, lg→10 */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {book.chapters.map((ch: any) => (
              <Link
                className="btn btn-chip"
                key={ch.cnumber}
                href={`/book/${bnum}/chapter/${ch.cnumber}`}
              >
                {ch.cnumber}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* PARASHOT (Torah only) */}
      {mode === 'parashot' && isTorah && (
        <div className="space-y-3">
          {parashot.length === 0 && (
            <p className="opacity-70">ఈ పుస్తకానికి పరాషాలు కాన్ఫిగర్ చేయలేదు.</p>
          )}

          {parashot.map((p) => (
            <div key={p.name} className="card space-y-2">
              <div className="font-medium">{p.name}</div>
              {/* Responsive aliyot grid to match chapters */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {p.aliyot.map((a, idx) => (
                  <Link
                    key={idx}
                    className="btn btn-chip"
                    href={`/book/${a.b}/chapter/${a.c}?mode=parashot#v${a.v}`}
                  >
                    {idx + 1} అలియా
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CATEGORIES (Psalms only) */}
      {mode === 'categories' && isPsalms && (
        <div className="space-y-3">
          {PSALM_CATEGORIES.map(cat => (
            <div key={cat.key} className="card space-y-2">
              <div className="font-medium">{cat.label}</div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {cat.order.map(psalm => (
                  <Link
                    key={psalm}
                    className="btn btn-chip"
                    href={`/book/19/chapter/${psalm}?mode=categories&cat=${cat.key}`}
                    title={`${cat.label} → కీర్తన ${psalm}`}
                  >
                    {psalm}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
