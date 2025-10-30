"use client"

import { useEffect } from 'react'
import { useZoom } from './providers/ZoomProvider'

export default function ZoomStyle() {
  const { level } = useZoom()
  useEffect(() => {
    // Map -2..+2 -> 0,25,50,75,100
    const percents = [0, 25, 50, 75, 100]
    const idx = Math.max(0, Math.min(4, level + 2))
    const percent = percents[idx]
    const scale = (percent / 50) || 0
    document.documentElement.style.setProperty('--chapter-zoom-percent', `${percent}`)
    document.documentElement.style.setProperty('--chapter-zoom-scale', `${scale}`)
  }, [level])
  return null
}
