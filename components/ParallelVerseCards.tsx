"use client"

import React from 'react'
import { useParallel } from './providers/ParallelProvider'
import { useLanguage } from './providers/LanguageProvider'
import { useBibleFor } from './hooks/useBibleFor'

type Props = {
  verse: { b: number; c: number; v: number; text: string }
  mainLang: string
}

export default function ParallelVerseCards({ verse, mainLang }: Props) {
  const { parallel } = useParallel()
  const { lang } = useLanguage()
  const activeParallel = parallel && parallel !== lang ? parallel : null
  const pb = useBibleFor(activeParallel || null)

  // Determine if parallel content available
  let parallelText: string | null = null
  if (activeParallel && pb) {
    const book = (pb as any)?.books?.find((b: any) => b.bnumber === verse.b)
    const ch = book?.chapters?.find((c: any) => c.cnumber === verse.c)
    const vv = ch?.verses?.find((x: any) => x.vnumber === verse.v)
    parallelText = vv?.text ?? null
  }

  const hasParallel = Boolean(activeParallel && parallelText)

  const mainFont = `calc(1em + var(--chapter-zoom, 0px) + ${mainLang === 'he' ? '4px' : '0px'})`
  const parIsHe = activeParallel === 'he'
  const parFont = `calc(1em + var(--chapter-zoom, 0px) + ${parIsHe ? '4px' : '0px'})`

  return (
    <div className={`grid gap-2 ${hasParallel ? 'md:grid-cols-2' : ''}`}>
      <div className="card">
        <div className={`flex items-start gap-3 ${mainLang === 'he' ? 'flex-row-reverse' : ''}`}>
          <span className="badge">{verse.v}</span>
          <div className={`${mainLang === 'he' ? 'text-right' : ''}`} dir={mainLang === 'he' ? 'rtl' : undefined} style={{ fontSize: mainFont }}>
            {verse.text}
          </div>
        </div>
      </div>

      {hasParallel ? (
        <div className="card card-parallel">
          <div className={`flex items-start gap-3 ${parIsHe ? 'flex-row-reverse' : ''}`}>
            <span className="badge">{verse.v}</span>
            <div className={`${parIsHe ? 'text-right' : ''}`} dir={parIsHe ? 'rtl' : undefined} style={{ fontSize: parFont }}>
              {parallelText}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

