"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import SlideStage from '../../../components/presenter/SlideStage'
import { normalizeTheme } from '../../../lib/presenter/theme'
import { BOOK_NAMES } from '../../../lib/data/books'
import { usePresenterBible } from '../../../components/presenter/usePresenterBible'
import { useLanguage } from '../../../components/providers/LanguageProvider'

export default function ReadPage() {
  const bible = usePresenterBible()
  const { lang } = useLanguage()
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const book = Number(params.get('book') ?? 1)
  const chapter = Number(params.get('chapter') ?? 1)
  const requestedFontSize = Number(params.get('fontSize') ?? 48)
  const themeParam = params.get('theme')
  const theme = normalizeTheme(themeParam ? JSON.parse(decodeURIComponent(themeParam)) : undefined)

  const verses = useMemo(() => bible.listVerses(book, chapter), [bible, book, chapter])

  // slides will be array of { text, reference }
  const [slides, setSlides] = useState<Array<{text: string; reference: string}>>([])
  const [index, setIndex] = useState(0)

  const measureContainerRef = useRef<HTMLDivElement | null>(null)
  const measureContentRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth || 1920
      const h = window.innerHeight || 1080
      setScale(Math.min(w / 1920, h / 1080))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // Build slides by measuring text using an offscreen renderer
  useEffect(() => {
    let mounted = true
    const build = async () => {
      const results: Array<{text: string; reference: string}> = []
      // helper to measure if text fits
      const fits = (text: string): boolean => {
        const container = measureContainerRef.current
        const content = measureContentRef.current
        if (!container || !content) return true
        content.textContent = text
        // force reflow
        const overflow = content.scrollHeight > container.clientHeight || content.scrollWidth > container.clientWidth
        return !overflow
      }

      for (const v of verses) {
        const verseText = bible.getVerseText(book, chapter, v)
        const reference = bible.formatReference(book, chapter, v)
        // try full verse
        if (fits(verseText)) {
          results.push({ text: verseText, reference })
          continue
        }
        // otherwise split by words
        const words = verseText.split(/(\s+)/)
        let part = ''
        for (let i = 0; i < words.length; i++) {
          const w = words[i]
          const candidate = part ? part + w : w
          if (fits(candidate)) {
            part = candidate
            continue
          }
          // candidate doesn't fit: push previous part (ensure non-empty)
          if (part.trim().length > 0) {
            results.push({ text: part.trim(), reference })
            part = w
            // if remaining single word too large, still push it to avoid infinite loop
            if (!fits(part)) {
              results.push({ text: part.trim(), reference })
              part = ''
            }
          } else {
            // single long token doesn't fit; force break
            results.push({ text: w.trim(), reference })
            part = ''
          }
        }
        if (part && part.trim().length > 0) {
          results.push({ text: part.trim(), reference })
        }
      }

      if (mounted) setSlides(results)
    }

    // allow a tick to mount measurement nodes
    setTimeout(build, 50)
    return () => { mounted = false }
  }, [book, chapter, verses, requestedFontSize, theme])

  useEffect(() => {
    // request fullscreen
    document.body.classList.add('presenter-mode')
    const el = document.documentElement
    const request = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen
    if (request) {
      try { request.call(el) } catch (e) {}
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight') {
        setIndex((i) => Math.min(i + 1, slides.length - 1))
      }
      if (ev.key === 'ArrowLeft') {
        setIndex((i) => Math.max(i - 1, 0))
      }
      if (ev.key === 'Escape') {
        const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen
        if (exit) exit.call(document)
        try { window.close() } catch (e) {}
        try { window.location.href = '/presenter' } catch (e) {}
      }
    }
    window.addEventListener('keydown', onKey)
    const onFsChange = () => {
      const active = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement)
      if (!active) {
        try { window.location.href = '/presenter' } catch (e) {}
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange as any)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange as any)
      document.body.classList.remove('presenter-mode')
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen
      if (exit) exit.call(document)
    }
  }, [slides.length])

  if (!slides || slides.length === 0) {
    // render measurement nodes invisibly so we can measure
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <div style={{ position: 'absolute', left: -9999, top: -9999 }}>
          <div style={{ width: 1920, height: 1080, padding: '32px 24px 56px 24px' }} ref={measureContainerRef}>
            <div ref={measureContentRef} style={{ width: '100%', fontWeight: 600, whiteSpace: 'pre-wrap', fontSize: `${requestedFontSize}px`, lineHeight: theme.lineHeight ?? 1.35, fontFamily: lang === 'te' ? "Dhurjati, system-ui, -apple-system" : undefined }} />
          </div>
        </div>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center text-neutral-600">Preparing slides…</div>
        </div>
      </div>
    )
  }

  const slide = slides[index]

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: theme.gradient.style === 'radial' ? `radial-gradient(circle, ${theme.gradient.colors.join(', ')})` : `linear-gradient(${theme.gradient.angle}deg, ${theme.gradient.colors.join(', ')})` }}>
      <div style={{ position: 'absolute', left: 24, top: 24, color: 'white', fontWeight: 600, fontSize: 20 }} dir={lang==='he'?'rtl':undefined}>{`${(bible.getBook(book)?.bname ?? BOOK_NAMES[book] ?? 'Book')} ${chapter}`}</div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 1920 * scale, height: 1080 * scale }}>
          <div style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <SlideStage text={slide.text} reference={slide.reference} theme={theme} fontSize={requestedFontSize} />
          </div>
        </div>
      </div>
    </div>
  )
}
