"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { LangCode } from '../../lib/lang'

type ParallelCtx = { parallel: LangCode | null; setParallel: (code: LangCode | null) => void }

const Ctx = createContext<ParallelCtx | null>(null)

export function ParallelProvider({ children }: { children: React.ReactNode }) {
  const [parallel, setParallelState] = useState<LangCode | null>(() => {
    if (typeof window === 'undefined') return null
    const v = window.localStorage.getItem('parallelLang')
    return (v === 'te' || v === 'en' || v === 'ta' || v === 'hi' || v === 'he') ? (v as LangCode) : null
  })

  const setParallel = useCallback((code: LangCode | null) => {
    setParallelState(code)
    if (typeof window !== 'undefined') {
      try {
        if (code) window.localStorage.setItem('parallelLang', code)
        else window.localStorage.removeItem('parallelLang')
      } catch {}
    }
  }, [])

  const value = useMemo(() => ({ parallel, setParallel }), [parallel, setParallel])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useParallel() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useParallel must be used within ParallelProvider')
  return ctx
}

