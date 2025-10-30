"use client"

import { useEffect } from 'react'
import { useZoom } from './providers/ZoomProvider'

export default function ZoomStyle() {
  const { level } = useZoom()
  useEffect(() => {
    const px = `${level * 2}px`
    document.documentElement.style.setProperty('--chapter-zoom', px)
  }, [level])
  return null
}

