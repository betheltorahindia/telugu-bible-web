import React, { useEffect, useMemo, useState } from 'react'
import { getVerseText, getChapterCount } from '../../lib/presenter/bible'
import { BOOK_NAMES } from '../../lib/data/books'
import type { ThemeSettings } from '../../lib/supabase/types'
import ReadSlide from './ReadSlide'

type ReadPresenterProps = {
  book: number
  chapter: number
  theme: ThemeSettings
  fontSize?: number
  onRequestClose?: () => void
}

type VerseContent = {
  text: string
  number: number
}

function measureVerseHeight(verse: VerseContent, fontSize: number, container: HTMLElement): number {
  const div = document.createElement('div')
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  // Account for outer slide padding (24px left + 24px right) so measurement
  // matches the actual available width inside the slide. Also include the
  // verse-card's left padding (80px) and right padding (32px) via box-sizing
  // so wrapping behaviour matches the real slide.
  const outerHorizontalPadding = 24 + 24 // slide container left+right
  const contentWidth = Math.max(0, container.offsetWidth - outerHorizontalPadding)
  div.style.boxSizing = 'border-box'
  div.style.width = contentWidth + 'px'
  div.style.fontSize = fontSize + 'px'
  div.style.padding = '24px 32px'
  // ensure left padding used by verse badge is present
  div.style.paddingLeft = '80px'
  div.style.lineHeight = '1.35'
  div.style.whiteSpace = 'pre-wrap'
  div.style.overflowWrap = 'break-word'
  div.innerText = verse.text
  container.appendChild(div)
  const height = div.offsetHeight
  container.removeChild(div)
  // add a small gap between verse cards
  return height + 24
}

function groupVersesIntoSlides(verses: VerseContent[], maxHeight: number, fontSize: number, container: HTMLElement): VerseContent[][] {
  const slides: VerseContent[][] = []
  let currentSlide: VerseContent[] = []
  let currentHeight = 0

  for (const verse of verses) {
    const verseHeight = measureVerseHeight(verse, fontSize, container)
    
    if (currentHeight + verseHeight > maxHeight) {
      slides.push(currentSlide)
      currentSlide = [verse]
      currentHeight = verseHeight
    } else {
      currentSlide.push(verse)
      currentHeight += verseHeight
    }
  }

  if (currentSlide.length > 0) {
    slides.push(currentSlide)
  }

  return slides
}

export default function ReadPresenter({ book, chapter, theme, fontSize = 65, onRequestClose }: ReadPresenterProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [measureContainer, setMeasureContainer] = useState<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  type SlideBlock = { book: number; chapter: number; verses: VerseContent[] }
  const [slides, setSlides] = useState<SlideBlock[]>([])

  // Collect verses starting from the requested book/chapter and continue
  // through subsequent chapters in the book. Each new chapter begins on a new slide.
  const collected = useMemo(() => {
    const out: { book: number; chapter: number; verses: VerseContent[] }[] = []
    const chapterCount = getChapterCount(book)
    for (let c = chapter; c <= chapterCount; c++) {
      const verses: VerseContent[] = []
      let v = 1
      while (true) {
        const text = getVerseText(book, c, v)
        if (!text) break
        verses.push({ text, number: v })
        v++
      }
      out.push({ book, chapter: c, verses })
    }
    return out
  }, [book, chapter])

  // Group collected verses into slides using measurement container.
  useEffect(() => {
    if (!measureContainer) return

    const maxHeight = 900 // space reserved for header/padding
    const newSlides: { book: number; chapter: number; verses: VerseContent[] }[] = []

    for (const chBlock of collected) {
      // Ensure each chapter starts on a fresh slide
      let currentSlide: VerseContent[] = []
      let currentHeight = 0

      for (const verse of chBlock.verses) {
        const verseHeight = measureVerseHeight(verse, fontSize, measureContainer)
        if (currentHeight + verseHeight > maxHeight) {
          // push current slide as a slide belonging to this chapter
          newSlides.push({ book: chBlock.book, chapter: chBlock.chapter, verses: currentSlide })
          currentSlide = [verse]
          currentHeight = verseHeight
        } else {
          currentSlide.push(verse)
          currentHeight += verseHeight
        }
      }

      // push remaining of this chapter
      if (currentSlide.length > 0) {
        newSlides.push({ book: chBlock.book, chapter: chBlock.chapter, verses: currentSlide })
      }
    }

    setSlides(newSlides)
    setCurrentSlideIndex(0)
  }, [collected, fontSize, measureContainer])

  // Compute a responsive scale so the 1920x1080 stage always fits the viewport
  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth || 1920
      const h = window.innerHeight || 1080
      const s = Math.min(w / 1920, h / 1080)
      setScale(s)
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlideIndex(i => Math.min(i + 1, slides.length - 1))
        e.preventDefault()
      }
      else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex(i => Math.max(i - 1, 0))
        e.preventDefault()
      }
      else if (e.key === 'Escape') {
        // If user presses Escape, also exit fullscreen if active
        const exit =
          document.exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).msExitFullscreen ||
          (document as any).mozCancelFullScreen
        try { exit?.call(document) } catch (e) {}
        onRequestClose?.()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length, onRequestClose])

  // Ensure we enter fullscreen on mount if not already, and leave read mode
  // when fullscreen is exited via ESC or system UI.
  useEffect(() => {
    const el = document.documentElement
    const request =
      el.requestFullscreen ||
      (el as any).webkitRequestFullscreen ||
      (el as any).msRequestFullscreen ||
      (el as any).mozRequestFullScreen

    // Try to enter fullscreen if we aren't already
    if (!document.fullscreenElement) {
      try { request?.call(el) } catch (e) {}
    }

    const onFsChange = () => {
      const active = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      )
      if (!active) {
        onRequestClose?.()
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange as any)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange as any)
    }
  }, [onRequestClose])

  // Measurement div for calculating verse heights
  const measureDiv = (
    <div
      ref={setMeasureContainer}
      style={{ 
        position: 'absolute',
        visibility: 'hidden',
        width: '1920px',
        height: '1px',
        overflow: 'hidden'
      }}
    />
  )

  if (!measureContainer || slides.length === 0) {
    return measureDiv
  }

  const active = slides[currentSlideIndex]

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      {measureDiv}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Sized wrapper ensures perfect centering of the scaled slide */}
        <div style={{ width: 1920 * scale, height: 1080 * scale }}>
          <div
            style={{
              width: 1920,
              height: 1080,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
          <ReadSlide
            verses={active?.verses ?? []}
            bookName={BOOK_NAMES[active?.book - 1]}
            chapterNumber={active?.chapter ?? chapter}
            theme={theme}
            fontSize={fontSize}
          />
          </div>
        </div>
      </div>
    </div>
  )
}
