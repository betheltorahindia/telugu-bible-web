'use client'
import { useEffect, useMemo, useState } from 'react'
import verses from '../../data/verses.json'
import Link from 'next/link'
import { BOOK_NAMES } from '../../lib/data/books'

// helper: escape regex special characters from user input
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// component: renders text with <mark> around all matches of query (case-insensitive)
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>

  let re: RegExp
  try {
    re = new RegExp(esc(q), 'gi') // highlight the whole phrase the user typed
  } catch {
    return <>{text}</>
  }

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
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const data = verses as any[]

  useEffect(() => {
    const query = q.trim().toLowerCase()
    if (!query) { setResults([]); return }
    const out: any[] = []
    for (const v of data) {
      if (v.textLower.includes(query)) {
        out.push(v)
        if (out.length >= 200) break // safety cap
      }
    }
    setResults(out)
  }, [q, data])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">వచన శోధన</h1>
      <input
        value={q}
        onChange={e=>setQ(e.target.value)}
        placeholder="పదం / వాక్యం టైప్ చేయండి…"
        className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
      />
      {!q && <p className="opacity-70">తెలిసిన పదం/వాక్యాన్ని టైప్ చేస్తే, అన్ని చోట్లున్న ఫలితాలు ఇక్కడ కనిపిస్తాయి.</p>}

      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="card">
            <div className="flex items-start gap-3">
              <div className="badge">{BOOK_NAMES[r.bnumber] ?? r.bname} {r.cnumber}:{r.vnumber}</div>
              <div className="flex-1">
                <div className="mb-2">
                  <Highlight text={r.text} query={q} />
                </div>
                <Link className="link" href={`/book/${r.bnumber}/chapter/${r.cnumber}#v${r.vnumber}`}>ఆ వచనానికి వెళ్లండి →</Link>
              </div>
            </div>
          </div>
        ))}
        {q && results.length === 0 && <p className="opacity-70">ఫలితాలు లేవు.</p>}
      </div>
    </div>
  )
}
