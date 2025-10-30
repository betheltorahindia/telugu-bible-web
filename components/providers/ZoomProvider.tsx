"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type ZoomCtx = { level: number; setLevel: (n: number) => void }

const Ctx = createContext<ZoomCtx | null>(null)

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const [level, setLevelState] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    const s = window.localStorage.getItem('chapterZoom')
    const n = s ? Number(s) : 0
    return Number.isFinite(n) ? Math.max(-2, Math.min(2, n)) : 0
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('chapterZoom', String(level)) } catch {}
    }
  }, [level])

  const setLevel = useCallback((n: number) => {
    setLevelState(Math.max(-2, Math.min(2, Math.round(n))))
  }, [])

  const value = useMemo(() => ({ level, setLevel }), [level, setLevel])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useZoom() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useZoom must be used within ZoomProvider')
  return v
}

