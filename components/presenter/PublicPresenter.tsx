'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatReference, getVerseText } from '../../lib/presenter/bible'
import { normalizeTheme } from '../../lib/presenter/theme'
import type { ThemeSettings } from '../../lib/supabase/types'
import { useAutoFitText } from './useAutoFitText'

interface PublicPresenterProps {
  initialMeta: {
    id: string
    slug: string
    title: string
    settings: ThemeSettings
  }
}

interface PresenterItem {
  order: number
  book: number
  chapter: number
  verse: number
  note: string | null
}

const HIDE_CURSOR_DELAY = 3000
const SWIPE_THRESHOLD = 40

export function PublicPresenter({ initialMeta }: PublicPresenterProps) {
  const baseTheme = useMemo(() => normalizeTheme(initialMeta.settings), [initialMeta.settings])
  const [items, setItems] = useState<PresenterItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTheme, setActiveTheme] = useState<ThemeSettings>(baseTheme)
  const [projectTitle, setProjectTitle] = useState(initialMeta.title)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const hideCursorTimer = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerStartX = useRef<number | null>(null)

  const currentItem = items[currentIndex]
  const verseText = useMemo(() => {
    if (!currentItem) return ''
    return getVerseText(currentItem.book, currentItem.chapter, currentItem.verse)
  }, [currentItem])

  const reference = useMemo(() => {
    if (!currentItem) return ''
    return formatReference(currentItem.book, currentItem.chapter, currentItem.verse)
  }, [currentItem])

  const textContainerRef = useRef<HTMLDivElement>(null)
  const verseTextRef = useRef<HTMLDivElement>(null)
  const slideLineHeight = 1.35
  const verseFontSize = useAutoFitText({
    text: verseText,
    containerRef: textContainerRef,
    contentRef: verseTextRef,
    baseSize: activeTheme.fontSize,
    minSize: 32,
    lineHeight: slideLineHeight,
  })
  const note = currentItem?.note?.trim() ?? ''
  const slidePosition = items.length ? `${currentIndex + 1} / ${items.length}` : null
  const cursorClass = showCursor ? '' : 'cursor-none'
  const chromeVisible = !isFullscreen || showCursor

  useEffect(() => {
    setActiveTheme(baseTheme)
  }, [baseTheme])

  useEffect(() => {
    setProjectTitle(initialMeta.title)
  }, [initialMeta.title])

  useEffect(() => {
    const previousTitle = document.title
    document.title = projectTitle
    return () => {
      document.title = previousTitle
    }
  }, [projectTitle])

  useEffect(() => {
    document.body.classList.add('presenter-mode')
    return () => {
      document.body.classList.remove('presenter-mode')
      if (document.fullscreenElement) {
        document.exitFullscreen?.()
      }
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/presenter/public/${initialMeta.slug}`, { cache: 'no-store' })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to load presenter')
      }
      const result = await response.json()
      const project = result.project ?? null
      if (project?.settings) {
        setActiveTheme(normalizeTheme(project.settings))
      } else {
        setActiveTheme(baseTheme)
      }
      if (project?.title) {
        setProjectTitle(project.title)
      }
      const loadedItems: PresenterItem[] = Array.isArray(result.items) ? result.items : []
      setItems(loadedItems)
      setCurrentIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presenter')
    } finally {
      setLoading(false)
    }
  }, [initialMeta.slug, baseTheme])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    if (!items.length) return
    const resetCursor = () => {
      setShowCursor(true)
      if (hideCursorTimer.current) clearTimeout(hideCursorTimer.current)
      hideCursorTimer.current = setTimeout(() => setShowCursor(false), HIDE_CURSOR_DELAY)
    }
    resetCursor()
    const handleMove = () => resetCursor()
    const handleKey = () => resetCursor()
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('keydown', handleKey)
      if (hideCursorTimer.current) {
        clearTimeout(hideCursorTimer.current)
        hideCursorTimer.current = null
      }
    }
  }, [items.length])

  const handleNext = useCallback(() => {
    setCurrentIndex((index) => {
      if (items.length === 0) return index
      return (index + 1) % items.length
    })
  }, [items.length])

  const handlePrevious = useCallback(() => {
    setCurrentIndex((index) => {
      if (items.length === 0) return index
      return (index - 1 + items.length) % items.length
    })
  }, [items.length])

  useEffect(() => {
    if (!items.length) return
    const handleKey = (event: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault()
        handleNext()
      }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault()
        handlePrevious()
      }
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen?.()
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleNext, handlePrevious, items.length])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerStartX.current = event.clientX
    setShowCursor(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }, [])

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const selection = window.getSelection()
      if (selection && selection.toString().length > 0) {
        pointerStartX.current = null
        return
      }
      const startX = pointerStartX.current ?? event.clientX
      pointerStartX.current = null
      const endX = event.clientX
      const delta = startX - endX
      if (Math.abs(delta) > SWIPE_THRESHOLD) {
        if (delta > 0) {
          handleNext()
        } else {
          handlePrevious()
        }
        return
      }
      const rect = event.currentTarget.getBoundingClientRect()
      const relative = endX - rect.left
      if (relative < rect.width / 2) {
        handlePrevious()
      } else {
        handleNext()
      }
    },
    [handleNext, handlePrevious],
  )

  const handlePointerCancel = useCallback(() => {
    pointerStartX.current = null
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement || isFullscreen) {
      await document.exitFullscreen?.()
      setIsFullscreen(false)
      return
    }
    const target = containerRef.current ?? document.documentElement
    if (target.requestFullscreen) {
      await target.requestFullscreen()
    }
    setIsFullscreen(true)
  }

  const backgroundStyle = useMemo(() => {
    if (activeTheme.gradient.style === 'radial') {
      return {
        background: `radial-gradient(circle, ${activeTheme.gradient.colors.join(', ')})`,
      }
    }
    return {
      background: `linear-gradient(${activeTheme.gradient.angle}deg, ${activeTheme.gradient.colors.join(', ')})`,
    }
  }, [activeTheme])

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Loading presenter...</p>
      </div>
    )
  }

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="card max-w-md text-center bg-neutral-900 text-white">
          <h1 className="text-xl font-semibold mb-2">Unable to load presenter</h1>
          <p className="text-sm text-neutral-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!loading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="card max-w-md text-center bg-neutral-900 text-white">
          <h1 className="text-xl font-semibold mb-2">No verses yet</h1>
          <p className="text-sm text-neutral-300">This presenter does not contain any slides yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-black text-white flex flex-col transition-colors ${cursorClass}`}
    >
      <header
        className={`flex items-center justify-between gap-4 px-6 py-4 text-sm text-neutral-300 transition-opacity duration-300 ${
          chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col">
          <span className="font-medium text-white/90">{projectTitle}</span>
          {slidePosition ? <span className="text-xs text-neutral-400">Slide {slidePosition}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn" onClick={handlePrevious}>
            Prev
          </button>
          <button type="button" className="btn" onClick={handleNext}>
            Next
          </button>
          <button type="button" className="btn" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
        <div
          className="relative aspect-[16/9] w-full max-w-6xl rounded-[36px] overflow-hidden border border-white/10 bg-black shadow-2xl"
          style={backgroundStyle}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
          role="presentation"
        >
          <div className="absolute inset-0 bg-black/15" />
          <div className="relative z-10 flex h-full flex-col px-6 sm:px-12 pt-10 pb-16">
            <div ref={textContainerRef} className="flex-1 flex items-center justify-center w-full">
              <div
                ref={verseTextRef}
                className="w-full text-center font-semibold text-white drop-shadow-2xl whitespace-pre-wrap"
                style={{ fontSize: `${verseFontSize}px`, lineHeight: slideLineHeight }}
              >
                {verseText}
              </div>
            </div>
            {note ? (
              <div className="mx-auto mt-3 max-w-2xl rounded-xl bg-black/35 px-4 py-2 text-center text-sm text-white/90">
                {note}
              </div>
            ) : null}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs sm:text-sm md:text-base uppercase tracking-wide font-semibold text-white/90">
            {reference}
          </div>
        </div>
      </main>
    </div>
  )
}






