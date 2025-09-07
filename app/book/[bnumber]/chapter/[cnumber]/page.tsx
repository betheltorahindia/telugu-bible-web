'use client'
import { useParams } from 'next/navigation'
import bible from '../../../../../data/bible.json'
import { BOOK_NAMES } from '../../../../../lib/data/books'
import { PARASHIYOT, aliyahStartSet, aliyahId } from '../../../../../lib/data/parashiyot'
import { useEffect, useMemo } from 'react'

export default function ChapterPage() {
  const params = useParams<{ bnumber: string, cnumber: string }>()
  const b = parseInt(params.bnumber)
  const c = parseInt(params.cnumber)
  const book = (bible as any).books?.find((x: any) => x.bnumber === b)
  const chapter = book?.chapters?.find((x: any) => x.cnumber === c)

  // Build a map once: "b{b}-c{c}-v{v}" -> aliyah number (1..7)
  const aliyahNumMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of PARASHIYOT) {
      p.aliyot.forEach((a, idx) => {
        m.set(aliyahId(a.b, a.c, a.v), idx + 1)
      })
    }
    return m
  }, [])

  // If URL has #v{n}, scroll to that verse smoothly
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash.startsWith('#v')) {
      const el = document.getElementById(window.location.hash.substring(1))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  if (!book || !chapter) return <div>డేటా లేదు (తర్వాత XML నుంచి వస్తుంది).</div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{BOOK_NAMES[b] ?? book.bname} {c}</h1>
      <div className="space-y-2">
        {chapter.verses.map((v: any) => {
          const id = `v${v.vnumber}`
          const key = aliyahId(b, c, v.vnumber)
          const isAliyahStart = aliyahStartSet.has(key)
          const aliyahNumber = aliyahNumMap.get(key) // undefined if not a start

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
