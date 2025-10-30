"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { LangCode } from '../../lib/lang'
import { DEFAULT_LANG, isLang } from '../../lib/lang'

type BibleJSON = { books: Array<{ bnumber: number; bname: string; chapters: Array<{ cnumber: number; verses?: any[] }> }> }

type LanguageContextValue = {
  lang: LangCode
  setLang: (lang: LangCode) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children, initialLang }: { children: React.ReactNode; initialLang?: LangCode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [lang, setLangState] = useState<LangCode>(() => {
    if (typeof window === 'undefined') return initialLang || DEFAULT_LANG
    const fromStorage = window.localStorage.getItem('lang') || ''
    return isLang(fromStorage) ? fromStorage : (initialLang || DEFAULT_LANG)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('lang', lang)
      // cookie for server components
      document.cookie = `lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`
    } catch {}
  }, [lang])

  const setLang = useCallback((l: LangCode) => {
    setLangState((prev) => {
      if (prev !== l) {
        // trigger a soft refresh so server components re-read cookies
        setTimeout(() => router.refresh(), 0)
      }
      return l
    })
  }, [router])

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

// Client hook to load current-language bible JSON dynamically
export function useBible() {
  const { lang } = useLanguage()
  const [data, setData] = useState<BibleJSON | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        let mod: any
        switch (lang) {
          case 'te': mod = await import('../../data/te.json'); break
          case 'en': mod = await import('../../data/en.json'); break
          case 'ta': mod = await import('../../data/ta.json'); break
          case 'hi': mod = await import('../../data/hi.json'); break
          case 'he': mod = await import('../../data/he.json'); break
          default:   mod = await import('../../data/te.json'); break
        }
        if (!alive) return
        setData((mod?.default || mod) as BibleJSON)
      } catch (e) {
        console.error('Failed to load bible for lang', lang, e)
        if (!alive) return
        try {
          const fallback = await import('../../data/te.json')
          setData((fallback?.default || fallback) as BibleJSON)
        } catch {}
      }
    }
    load()
    return () => { alive = false }
  }, [lang])

  return data
}

