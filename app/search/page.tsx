"use client"

import { useEffect, useMemo, useState } from 'react'
import verses from '../../data/verses.json'
import Link from 'next/link'
import { useLanguage } from '../../components/providers/LanguageProvider'
import { useBible } from '../../components/providers/LanguageProvider'
import { uiStrings } from '../../lib/i18n'

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  let re: RegExp
  try { re = new RegExp(esc(q), 'gi') } catch { return <>{text}</> }
  const parts = text.split(re)
  const matches = text.match(re) || []
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < matches.length && <mark style={{ background: 'yellow' }}>{matches[i]}</mark>}
        </span>
      ))}
    </>
  )
}

export default function SearchPage() {
  const { lang } = useLanguage()
  const UI = uiStrings(lang)
  const bible: any = useBible()

  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])

  // Build a lightweight search dataset for non-Telugu languages from the
  // currently selected Bible JSON. Keep existing prebuilt Telugu index.
  const dynData = useMemo(() => {
    if (lang === 'te') return [] as any[]
    const b = bible as any
    if (!b || !b.books) return [] as any[]
    const out: any[] = []
    for (const book of b.books) {
      for (const ch of book.chapters || []) {
        for (const v of ch.verses || []) {
          const text = String(v.text || '')
          out.push({
            bnumber: book.bnumber,
            bname: book.bname,
            cnumber: ch.cnumber,
            vnumber: v.vnumber,
            text,
            textLower: text.toLowerCase(),
          })
        }
      }
    }
    return out
  }, [lang, bible])

  const data = (lang === 'te' ? (verses as any[]) : dynData)

  useEffect(() => {
    const query = q.trim().toLowerCase()
    if (!query) { setResults([]); return }
    const out: any[] = []
    for (const v of data) {
      if (v.textLower.includes(query)) {
        out.push(v)
        if (out.length >= 200) break
      }
    }
    setResults(out)
  }, [q, data])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{UI.search}</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={UI.search}
        className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
      />
      {!q && <p className="opacity-70">{UI.search}</p>}

      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="card">
            <div className="flex items-start gap-3">
              <div className="badge">{(bible?.books?.find((b: any) => b.bnumber === r.bnumber)?.bname) ?? r.bname} {r.cnumber}:{r.vnumber}</div>
              <div className="flex-1">
                <div className="mb-2">
                  <Highlight text={r.text} query={q} />
                </div>
                <Link className="link" href={`/book/${r.bnumber}/chapter/${r.cnumber}#v${r.vnumber}`}>{UI.reading}</Link>
              </div>
            </div>
          </div>
        ))}
        {q && results.length === 0 && <p className="opacity-70">0</p>}
      </div>
    </div>
  )
}

