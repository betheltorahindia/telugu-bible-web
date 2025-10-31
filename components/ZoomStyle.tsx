"use client"

import { useEffect } from 'react'
import { useZoom } from './providers/ZoomProvider'
import { useLanguage } from './providers/LanguageProvider'

export default function ZoomStyle() {
  const { level } = useZoom()
  const { lang } = useLanguage()
  useEffect(() => {
    // Map -2..+2 -> 0,25,50,75,100 (for display if needed)
    const percents = [0, 25, 50, 75, 100]
    const idx = Math.max(0, Math.min(4, level + 2))
    const percent = percents[idx]
    const scale = (percent / 50) || 0
    const px = `${level * 2}px`
    document.documentElement.style.setProperty('--chapter-zoom-percent', `${percent}`)
    document.documentElement.style.setProperty('--chapter-zoom-scale', `${scale}`)
    document.documentElement.style.setProperty('--chapter-zoom', px)
    // Hebrew readability boost (only affects text where we apply it)
    document.documentElement.style.setProperty('--hebrew-boost', lang === 'he' ? '4px' : '0px')
  }, [level, lang])
  return null
}
