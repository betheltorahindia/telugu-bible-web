"use client"

import type { LangCode } from '../../lib/lang'
import { useEffect, useState } from 'react'

type BibleJSON = { books: Array<{ bnumber: number; bname: string; chapters: Array<{ cnumber: number; verses?: any[] }> }> }

export function useBibleFor(lang: LangCode | null) {
  const [data, setData] = useState<BibleJSON | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!lang) { setData(null); return }
      try {
        let mod: any
        switch (lang) {
          case 'te': mod = await import('../../data/te.json'); break
          case 'en': mod = await import('../../data/en.json'); break
          case 'ta': mod = await import('../../data/ta.json'); break
          case 'hi': mod = await import('../../data/hi.json'); break
          case 'he': mod = await import('../../data/he.json'); break
          default: mod = await import('../../data/te.json'); break
        }
        if (!alive) return
        setData((mod?.default || mod) as BibleJSON)
      } catch {
        if (!alive) return
        setData(null)
      }
    }
    load()
    return () => { alive = false }
  }, [lang])

  return data
}

