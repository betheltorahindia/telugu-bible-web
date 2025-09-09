'use client'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import bible from '../../../../../data/bible.json'
import { BOOK_NAMES } from '../../../../../lib/data/books'
import { PARASHIYOT, aliyahStartSet, aliyahId } from '../../../../../lib/data/parashiyot'
import { useEffect, useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'

export default function ChapterPage() {
  const params = useParams<{ bnumber: string, cnumber: string }>()
  const search = useSearchParams()

  const b = parseInt(params.bnumber)
  const c = parseInt(params.cnumber)

  const mode = search?.get('mode') || null
  const cat  = search?.get('cat')  || null

  const book = (bible as any).books?.find((x: any) => x.bnumber === b)
  const chapter = book?.chapters?.find((x: any) => x.cnumber === c)

  let backHref = `/book/${b}`
  if (mode === 'parashot') {
    backHref = `/book/${b}?mode=parashot`
  } else if (mode === 'categories') {
    backHref = cat ? `/book/${b}?mode=categories&cat=${encodeURIComponent(cat)}` : `/book/${b}?mode=categories`
  }

  const aliyahNumMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of PARASHIYOT) {
      p.aliyot.forEach((a, idx) => {
        m.set(aliyahId(a.b, a.c, a.v), idx + 1)
      })
    }
    return m
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash.startsWith('#v')) {
      const el = document.getElementById(window.location.hash.substring(1))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  if (!book || !chapter) return <div>డేటా లేదు (తర్వాత XML నుంచి వస్తుంది).</div>

  return (
    <div className="space-y-4 relative">
      {/* Back button at top-left, under header */}
      <Link
        href={backHref}
        title="పుస్తకానికి వెనుకకు"
        className="
          fixed top-25 left-4 z-50
          w-9 h-9 rounded-full
          bg-black text-white dark:bg-white dark:text-black
          flex items-center justify-center shadow-md
          active:scale-95 transition
        "
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>

      {/* Chapter title */}
      <h1 className="text-xl font-semibold text-center">
        {BOOK_NAMES[b] ?? book.bname} {c}
      </h1>

      <div className="space-y-2">
        {chapter.verses.map((v: any) => {
          const id = `v${v.vnumber}`
          const key = aliyahId(b, c, v.vnumber)
          const isAliyahStart = aliyahStartSet.has(key)
          const aliyahNumber = aliyahNumMap.get(key)

          return (
            <div key={id} id={id} className="card">
              <div className="flex items-start gap-3">
                <span className="badge">{v.vnumber}</span>
                <div className="leading-relaxed">
                  <span>{v.text}</span>
                  {isAliyahStart && (
                    <span className="ml-2 badge">
                      ▸ అలియా {aliyahNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
