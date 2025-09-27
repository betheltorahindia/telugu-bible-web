'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function PublicPresenter({ initialMeta }: PublicPresenterProps) {
  const baseTheme = useMemo(() => normalizeTheme(initialMeta.settings), [initialMeta.settings])

  const [items, setItems] = useState<PresenterItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTheme, setActiveTheme] = useState<ThemeSettings>(baseTheme)
  const [projectTitle, setProjectTitle] = useState(initialMeta.title)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  const hideCursorTimer = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const verseTextRef = useRef<HTMLDivElement>(null)
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

  const resetCursorTimer = useCallback(() => {
    if (hideCursorTimer.current) {
      clearTimeout(hideCursorTimer.current)
    }
    hideCursorTimer.current = setTimeout(() => {
      setShowCursor(false)
    }, HIDE_CURSOR_DELAY)
  }, [])

  const handleUserInteraction = useCallback(() => {
    setShowCursor(true)
    resetCursorTimer()
  }, [resetCursorTimer])

  useEffect(() => {
    resetCursorTimer()
    return () => {
      if (hideCursorTimer.current) {
        clearTimeout(hideCursorTimer.current)
      }
    }
  }, [resetCursorTimer])

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
      const payload = await response.json()
      const project = payload.project ?? null
      const nextItems: PresenterItem[] = Array.isArray(payload.items) ? payload.items : []
      setItems(nextItems)
      setCurrentIndex(0)
      if (project?.settings) {
        setActiveTheme(normalizeTheme(project.settings))
      } else {
        setActiveTheme(baseTheme)
      }
      if (project?.title) {
        setProjectTitle(project.title)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presenter')
    } finally {
      setLoading(false)
    }
  }, [baseTheme, initialMeta.slug])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleNext = useCallback(() => {
    setCurrentIndex((previous) => {
      if (items.length === 0) return previous
      return previous === items.length - 1 ? previous : previous + 1
    })
  }, [items.length])

  const handlePrevious = useCallback(() => {
    setCurrentIndex((previous) => {
      if (items.length === 0) return previous
      return previous === 0 ? 0 : previous - 1
    })
  }, [items.length])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleUserInteraction()
        handleNext()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handleUserInteraction()
        handlePrevious()
      }
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen?.()
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleNext, handlePrevious, handleUserInteraction])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerStartX.current = event.clientX
    event.currentTarget.setPointerCapture?.(event.pointerId)
    handleUserInteraction()
  }, [handleUserInteraction])

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartX.current
    pointerStartX.current = null
    if (start === null) return
    const delta = event.clientX - start
    if (delta > SWIPE_THRESHOLD) {
      handleUserInteraction()
      handlePrevious()
    } else if (delta < -SWIPE_THRESHOLD) {
      handleUserInteraction()
      handleNext()
    }
  }, [handleNext, handlePrevious, handleUserInteraction])

  const handlePointerCancel = useCallback(() => {
    pointerStartX.current = null
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement || isFullscreen) {
      await document.exitFullscreen?.()
      setIsFullscreen(false)
      return
    }
    const target = containerRef.current ?? document.documentElement
    if (target.requestFullscreen) {
      await target.requestFullscreen()
      setIsFullscreen(true)
    }
  }, [isFullscreen])

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

  const mainClass = classNames(
    'presenter-main flex-1 flex justify-center w-full',
    isFullscreen ? 'items-stretch' : 'items-center px-4 py-8 sm:px-8',
  )

  const slideClass = classNames(
    'presenter-slide',
    isFullscreen
      ? 'relative w-full h-full overflow-hidden bg-black'
      : 'relative aspect-[16/9] w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/10 bg-black shadow-2xl',
  )

  const slideContentClass = classNames(
    'presenter-slide-content relative z-10 flex h-full flex-col text-white',
    isFullscreen ? 'px-[max(5vw,24px)] py-[max(6vh,48px)]' : 'px-6 sm:px-12 pt-10 pb-16',
  )

  const noteClass = classNames(
    'presenter-note mx-auto rounded-xl bg-black/35 text-center text-white/90',
    isFullscreen
      ? 'mt-[max(3vh,16px)] max-w-[min(70vw,960px)] px-[max(4vw,24px)] py-3 text-base'
      : 'mt-3 max-w-2xl px-4 py-2 text-sm',
  )

  const referenceClass = classNames(
    'presenter-reference uppercase tracking-wide font-semibold text-white/90',
    isFullscreen
      ? 'absolute bottom-[max(4vh,32px)] left-1/2 -translate-x-1/2 text-sm sm:text-base lg:text-lg'
      : 'absolute bottom-6 left-1/2 -translate-x-1/2 text-xs sm:text-sm md:text-base',
  )

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
      data-presenter-root
      className={classNames('min-h-screen w-full bg-black text-white flex flex-col transition-colors', cursorClass)}
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      <header
        className={classNames(
          'presenter-header flex items-center justify-between gap-4 px-6 py-4 text-sm text-neutral-300 transition-opacity duration-300',
          chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <div className="flex flex-col">
          <span className="font-medium text-white/90">{projectTitle}</span>
          {slidePosition ? <span className="text-xs text-neutral-400">Slide {slidePosition}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn" onClick={() => { handleUserInteraction(); handlePrevious() }}>
            Prev
          </button>
          <button type="button" className="btn" onClick={() => { handleUserInteraction(); handleNext() }}>
            Next
          </button>
          <button type="button" className="btn" onClick={() => { handleUserInteraction(); toggleFullscreen() }}>
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>
      </header>
      <main className={mainClass}>
        <div
          className={slideClass}
          style={backgroundStyle}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
          role="presentation"
        >
          <div className="absolute inset-0 bg-black/15" />
          <div className={slideContentClass}>
            <div ref={textContainerRef} className="flex-1 flex items-center justify-center w-full">
              <div
                ref={verseTextRef}
                className="w-full text-center font-semibold text-white drop-shadow-2xl whitespace-pre-wrap"
                style={{ fontSize: `${verseFontSize}px`, lineHeight: slideLineHeight }}
              >
                {verseText}
              </div>
            </div>
            {note ? <div className={noteClass}>{note}</div> : null}
          </div>
          <div className={referenceClass}>{reference}</div>
        </div>
      </main>
    </div>
  )
}
