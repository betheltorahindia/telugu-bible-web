'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BOOK_NAMES, BOOK_ORDER_DROPDOWN, combinedBookLabel, getLocalizedBookName } from '../../lib/data/books'
import { usePresenterBible } from './usePresenterBible'
import { useLanguage } from '../providers/LanguageProvider'
import { DEFAULT_THEME, GRADIENT_PRESETS, normalizeTheme } from '../../lib/presenter/theme'
import type { ThemeSettings } from '../../lib/supabase/types'
import { useAutoFitText } from './useAutoFitText'
import ReadPresenter from './ReadPresenter'

/* --- helper to accept both legacy and new verse-ref shapes --- */
type VerseRef = { book: number; chapter: number; verse: number }
type LegacyRef = { bnumber: number; cnumber: number; vnumber: number }
function normalizeRef(ref: VerseRef | LegacyRef | null | undefined): VerseRef | null {
  if (!ref) return null
  if ('book' in ref) return ref as VerseRef
  const r = ref as LegacyRef
  return { book: r.bnumber, chapter: r.cnumber, verse: r.vnumber }
}

type PlaylistItem = {
  id: string
  book: number
  chapter: number
  verse: number
  note: string | null
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function SortablePlaylistItem({
  item,
  active,
  onSelect,
  onRemove,
  formatRef,
}: {
  item: PlaylistItem
  active: boolean
  onSelect: () => void
  onRemove: () => void
  formatRef: (b: number, c: number, v: number) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    cursor: 'grab',
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames(
        'rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 px-3 py-2 flex items-center justify-between gap-2 transition-shadow',
        active ? 'ring-2 ring-amber-500 shadow-lg' : undefined,
      )}
      {...attributes}
      {...listeners}
    >
      <button type="button" onClick={onSelect} className="flex-1 text-left text-sm">
        {formatRef(item.book, item.chapter, item.verse)}
      </button>
      <button type="button" className="btn px-2 py-1" onClick={onRemove} aria-label="Remove from set">
        Remove
      </button>
    </div>
  )
}

function enterFullscreen(element: HTMLElement) {
  const request =
    element.requestFullscreen ||
    (element as any).webkitRequestFullscreen ||
    (element as any).msRequestFullscreen ||
    (element as any).mozRequestFullScreen
  if (request) {
    return request.call(element)
  }
  return Promise.resolve()
}

function exitFullscreen() {
  const exit =
    document.exitFullscreen ||
    (document as any).webkitExitFullscreen ||
    (document as any).msExitFullscreen ||
    (document as any).mozCancelFullScreen
  if (exit) {
    exit.call(document)
  }
}

export function PresenterBuilder() {
  const bible = usePresenterBible()
  const { lang } = useLanguage()
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentBook, setCurrentBook] = useState<number>(1)
  const [currentChapter, setCurrentChapter] = useState<number>(1)
  const [currentVerse, setCurrentVerse] = useState<number>(1)
  const [noteDraft, setNoteDraft] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isReadMode, setIsReadMode] = useState(false)
  

  const presenterRef = useRef<HTMLDivElement>(null)
  const previewTextContainerRef = useRef<HTMLDivElement>(null)
  const previewTextRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const chapters = useMemo(() => bible.listChapters(currentBook), [bible, currentBook])
  const verses = useMemo(() => bible.listVerses(currentBook, currentChapter), [bible, currentBook, currentChapter])

  useEffect(() => {
    if (!chapters.includes(currentChapter)) {
      setCurrentChapter(chapters[0] ?? 1)
    }
  }, [chapters, currentChapter])

  useEffect(() => {
    if (!verses.includes(currentVerse)) {
      setCurrentVerse(verses[0] ?? 1)
    }
  }, [verses, currentVerse])

  useEffect(() => {
    if (playlist.length === 0) {
      setSelectedId(null)
      return
    }
    if (selectedId && playlist.some((item) => item.id === selectedId)) {
      return
    }
    setSelectedId(playlist[0]?.id ?? null)
  }, [playlist, selectedId])

  useEffect(() => {
    if (!selectedId) return
    const active = playlist.find((item) => item.id === selectedId)
    if (!active) return
    setCurrentBook(active.book)
    setCurrentChapter(active.chapter)
    setCurrentVerse(active.verse)
    setNoteDraft(active.note ?? '')
  }, [playlist, selectedId])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeElement = document.fullscreenElement || (document as any).webkitFullscreenElement
      const isActive = Boolean(activeElement)
      setIsFullscreen(isActive)
      try {
        if (isActive) document.body.classList.add('presenter-mode')
        else document.body.classList.remove('presenter-mode')
      } catch (e) {
        // ignore (server-side or restricted environments)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange as any)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange as any)
    }
  }, [])

  const selectedIndex = useMemo(() => playlist.findIndex((item) => item.id === selectedId), [playlist, selectedId])
  const activeSlide = selectedIndex >= 0 ? playlist[selectedIndex] : null
  const previewTheme = useMemo(() => normalizeTheme(theme), [theme])

  const previewVerse = useMemo(() => {
    const source = activeSlide ?? {
      book: currentBook,
      chapter: currentChapter,
      verse: currentVerse,
      note: noteDraft.trim() ? noteDraft : null,
    }
    const text = bible.getVerseText(source.book, source.chapter, source.verse)
    return {
      ...source,
      text,
      reference: bible.formatReference(source.book, source.chapter, source.verse),
    }
  }, [bible, activeSlide, currentBook, currentChapter, currentVerse, noteDraft])

  const previewFontSize = useAutoFitText({
    text: previewVerse.text,
    containerRef: previewTextContainerRef,
    contentRef: previewTextRef,
    // Use smaller base size in preview; keep fullscreen at 80
    baseSize: isFullscreen ? 80 : 20,
    minSize: 32,
    lineHeight: previewTheme.lineHeight,
  })

  // Popout / controller session state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [popoutChannel, setPopoutChannel] = useState<BroadcastChannel | null>(null)
  const [popoutWindows, setPopoutWindows] = useState<{display?: Window | null; controller?: Window | null}>({})
  const [toast, setToast] = useState<string | null>(null)

  // helper: create or return a channel-like wrapper with fallback
  type ChannelLike = {
    postMessage: (data: unknown) => void
    onmessage?: ((ev: MessageEvent) => void) | null
    close?: () => void
  }

  function createChannelForSession(sid: string): ChannelLike | BroadcastChannel {
    const name = `presenter-session-${sid}`
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        return new BroadcastChannel(name)
      } catch (e) {
        // fallthrough to localStorage fallback
      }
    }
    // fallback: emulate BroadcastChannel with localStorage
    const fake: ChannelLike = {
      postMessage(data: unknown) {
        try {
          localStorage.setItem(`__bc__${name}`, JSON.stringify({ t: Date.now(), data }))
        } catch (e) {
          // ignore
        }
      },
      onmessage: null,
      close() {
        // noop
      },
    }
    return fake
  }

  const handleAddSlide = useCallback(() => {
    const id = crypto.randomUUID()
    const newItem: PlaylistItem = {
      id,
      book: currentBook,
      chapter: currentChapter,
      verse: currentVerse,
      note: noteDraft.trim() ? noteDraft.trim() : null,
    }
    setPlaylist((prev) => [...prev, newItem])
    setSelectedId(id)
  }, [currentBook, currentChapter, currentVerse, noteDraft])

  const handleUpdateSlide = useCallback(() => {
    if (!selectedId) return
    setPlaylist((prev) =>
      prev.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              book: currentBook,
              chapter: currentChapter,
              verse: currentVerse,
              note: noteDraft.trim() ? noteDraft.trim() : null,
            }
          : item,
      ),
    )
  }, [currentBook, currentChapter, currentVerse, noteDraft, selectedId])

  const handleRemoveSlide = useCallback(
    (id: string) => {
      setPlaylist((prev) => prev.filter((item) => item.id !== id))
      if (selectedId === id) {
        setSelectedId(null)
        setNoteDraft('')
      }
    },
    [selectedId],
  )

  const handleNewSlide = useCallback(() => {
    let next: VerseRef = { book: currentBook, chapter: currentChapter, verse: currentVerse }
    if (activeSlide) {
      const n = normalizeRef(bible.getNextVerse(activeSlide.book, activeSlide.chapter, activeSlide.verse))
      if (n) next = n
    } else if (playlist.length > 0) {
      const last = playlist[playlist.length - 1]
      const n = normalizeRef(bible.getNextVerse(last.book, last.chapter, last.verse))
      if (n) next = n
    }
    setCurrentBook(next.book)
    setCurrentChapter(next.chapter)
    setCurrentVerse(next.verse)
    setNoteDraft('')
    setSelectedId(null)
  }, [activeSlide, currentBook, currentChapter, currentVerse, playlist])

  const handleSelectSlide = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handlePrevSlide = useCallback(() => {
    if (playlist.length > 0) {
      if (selectedIndex <= 0) {
        setSelectedId(playlist[0].id)
        return
      }
      setSelectedId(playlist[selectedIndex - 1].id)
      return
    }

    // no playlist: step to previous verse
    const prev = normalizeRef(bible.getPreviousVerse(currentBook, currentChapter, currentVerse))
    if (!prev) return
    setCurrentBook(prev.book)
    setCurrentChapter(prev.chapter)
    setCurrentVerse(prev.verse)
  }, [playlist, selectedIndex, currentBook, currentChapter, currentVerse])

  const handleNextSlide = useCallback(() => {
    if (playlist.length > 0) {
      if (selectedIndex < 0) {
        setSelectedId(playlist[0].id)
        return
      }
      if (selectedIndex >= playlist.length - 1) {
        setSelectedId(playlist[playlist.length - 1].id)
        return
      }
      setSelectedId(playlist[selectedIndex + 1].id)
      return
    }

    // no playlist: step to next verse
    const nx = normalizeRef(bible.getNextVerse(currentBook, currentChapter, currentVerse))
    if (!nx) return
    setCurrentBook(nx.book)
    setCurrentChapter(nx.chapter)
    setCurrentVerse(nx.verse)
  }, [playlist, selectedIndex, currentBook, currentChapter, currentVerse])

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleNextSlide()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handlePrevSlide()
      }
      if (event.key === 'Escape' && document.fullscreenElement) {
        event.preventDefault()
        exitFullscreen()
      }
    },
    [handleNextSlide, handlePrevSlide],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])

  const handleEnterFullscreen = useCallback(() => {
    const host = presenterRef.current
    if (!host) return
    // enter fullscreen
    enterFullscreen(host)
  }, [])

  const handlePopout = useCallback(() => {
    const sid = crypto.randomUUID()
    setSessionId(sid)
    const channel = createChannelForSession(sid)
    setPopoutChannel(channel as BroadcastChannel)
    const urlBase = `${window.location.origin}/presenter/popout?sessionId=${sid}`
    // open controller first then display — opening both synchronously improves popup success rate
    const controller = window.open(`${urlBase}&role=controller`, '_blank', 'noopener')
    const display = window.open(`${urlBase}&role=display`, '_blank', 'noopener')
    setPopoutWindows({ display, controller })

    if (!display || !controller) {
      setToast('Popup blocked — allow popups for this site to use Pop out')
      setTimeout(() => setToast(null), 4000)
    }

    const sendStateInit = () => {
      const payload = {
        playlist,
        selectedId,
        theme,
        previewTheme,
        fontSize: previewFontSize,
        lineHeight: previewTheme.lineHeight,
      }
      try {
        channel.postMessage?.({ type: 'state:init', payload })
      } catch (e) {
        // ignore
      }
    }

  // broadcast initial state immediately and then on every change (see effects below)
  // Give a tiny tick so popout windows have a chance to attach listeners, then send
  setTimeout(sendStateInit, 50)

    // listen for control messages (nav)
    const onMessage = (ev: MessageEvent) => {
      const data = ev?.data
      if (!data || typeof data !== 'object') return
      if (!data.type) return
      switch (data.type) {
        case 'nav:next':
          handleNextSlide()
          break
        case 'nav:prev':
          handlePrevSlide()
          break
        case 'nav:stop':
          setPopoutWindows({})
          try { channel.close?.() } catch (e) {}
          setPopoutChannel(null)
          setToast('Presentation windows closed')
          setTimeout(() => setToast(null), 3000)
          break
        case 'request:init':
          sendStateInit()
          break
        default:
          break
      }
    }

    // attach listener both to channel and fallback storage events
    if (channel) {
      try {
        ;(channel as ChannelLike).onmessage = onMessage
      } catch (e) {
        // ignore
      }
      try {
        ;(channel as BroadcastChannel).onmessage = onMessage
      } catch (e) {
        // ignore
      }
    }
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return
      if (!e.key.startsWith(`__bc__presenter-session-${sid}`)) return
      try {
        const parsed: unknown = JSON.parse(e.newValue || '')
        if (parsed && typeof parsed === 'object') {
          const obj = parsed as Record<string, unknown>
          if ('data' in obj) {
            onMessage({ data: obj['data'] } as MessageEvent)
          }
        }
      } catch (err) {}
    }
    window.addEventListener('storage', onStorage)

    // watch popout windows close
    const interval = window.setInterval(() => {
      if (display && display.closed) {
        setToast('Presentation window closed')
        setTimeout(() => setToast(null), 3000)
      }
      if (controller && controller.closed) {
        setToast('Controller window closed')
        setTimeout(() => setToast(null), 3000)
      }
      if ((display && display.closed) && (controller && controller.closed)) {
        clearInterval(interval)
      }
    }, 500)

  }, [playlist, selectedId, theme, previewTheme, previewFontSize, handleNextSlide, handlePrevSlide])

  const handleRead = useCallback(() => {
    document.documentElement.requestFullscreen().then(() => {
      setIsReadMode(true)
    }).catch(err => {
      console.error('Failed to enter fullscreen:', err)
      setToast('Failed to enter fullscreen mode')
    })
  }, [])

  // Broadcast updates when popout channel exists
  useEffect(() => {
    if (!popoutChannel || !sessionId) return
    const ch = popoutChannel
    const sendUpdate = () => {
      try {
        ch.postMessage({ type: 'state:update', payload: { playlist, selectedId, theme: previewTheme, previewTheme, previewVerse, fontSize: previewFontSize, lineHeight: previewTheme.lineHeight, sessionId } })
      } catch (e) {}
    }
    // send initial ack
    sendUpdate()
    // send on changes (debounced)
    const id = window.setTimeout(sendUpdate, 50)
    return () => { window.clearTimeout(id) }
  }, [popoutChannel, sessionId, playlist, selectedId, previewTheme, previewFontSize])

  // cleanup popout channel on unmount
  useEffect(() => {
    return () => {
      try { popoutChannel?.close?.() } catch (e) {}
    }
  }, [popoutChannel])


  const handleExitFullscreen = useCallback(() => {
    exitFullscreen()
  }, [])

  // fullscreen hover controls removed — no floating buttons in fullscreen

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = playlist.findIndex((item) => item.id === active.id)
      const newIndex = playlist.findIndex((item) => item.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      setPlaylist((items) => arrayMove(items, oldIndex, newIndex))
    },
    [playlist],
  )

  // Export/import list (clipboard-based, no DB)
  const handleExportList = useCallback(async () => {
    try {
      if (!playlist || playlist.length === 0) {
        alert('No slides to export')
        return
      }
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        playlist,
      }
      const text = JSON.stringify(payload, null, 2)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        alert('Playlist copied to clipboard. Paste it into Import list when needed.')
      } else {
        // fallback: show in prompt so user can copy manually
        window.prompt('Copy the exported playlist JSON below', text)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to export playlist')
    }
  }, [playlist])

  const handleImportList = useCallback(() => {
    try {
      const pasted = window.prompt('Paste exported playlist JSON here')
      if (!pasted) return
      let parsed: any
      try {
        parsed = JSON.parse(pasted)
      } catch (e) {
        // perhaps user pasted raw array
        alert('Invalid JSON')
        return
      }
      let items: any[] | undefined
      if (Array.isArray(parsed)) items = parsed
      else if (parsed && Array.isArray(parsed.playlist)) items = parsed.playlist
      else {
        alert('Invalid playlist format')
        return
      }
      const normalized: PlaylistItem[] = items
        .map((it) => {
          // accept either {book,chapter,verse} or legacy keys
          const book = Number(it.book ?? it.bnumber)
          const chapter = Number(it.chapter ?? it.chapter ?? it.cnumber)
          const verse = Number(it.verse ?? it.verse ?? it.vnumber)
          if (!book || !chapter || !verse) return null
          return {
            id: it.id ?? crypto.randomUUID(),
            book,
            chapter,
            verse,
            note: it.note ?? null,
          } as PlaylistItem
        })
        .filter(Boolean) as PlaylistItem[]
      if (!normalized || normalized.length === 0) {
        alert('No valid slides found in pasted data')
        return
      }
      setPlaylist(normalized)
      setSelectedId(normalized[0].id)
      setCurrentBook(normalized[0].book)
      setCurrentChapter(normalized[0].chapter)
      setCurrentVerse(normalized[0].verse)
      alert('Playlist imported')
    } catch (err) {
      console.error(err)
      alert('Failed to import playlist')
    }
  }, [setPlaylist])

  const handleGradientColorChange = useCallback(
    (index: number, value: string) => {
      setTheme((prev) => {
        const next = normalizeTheme(prev)
        const colors = [...next.gradient.colors]
        colors[index] = value
        return { ...next, gradient: { ...next.gradient, colors } }
      })
    },
    [],
  )

  const handleAddColorStop = useCallback(() => {
    setTheme((prev) => {
      const next = normalizeTheme(prev)
      if (next.gradient.colors.length >= 3) return next
      return {
        ...next,
        gradient: {
          ...next.gradient,
          colors: [...next.gradient.colors, next.gradient.colors[next.gradient.colors.length - 1]],
        },
      }
    })
  }, [])

  const handleRemoveColorStop = useCallback(() => {
    setTheme((prev) => {
      const next = normalizeTheme(prev)
      if (next.gradient.colors.length <= 2) return next
      return { ...next, gradient: { ...next.gradient, colors: next.gradient.colors.slice(0, -1) } }
    })
  }, [])

  const activeReference = useMemo(() => {
    return `${bible.formatReference(previewVerse.book, previewVerse.chapter, previewVerse.verse)}`
  }, [bible, previewVerse.book, previewVerse.chapter, previewVerse.verse])

  const slideCount = playlist.length
  // reuse the `selectedIndex` computed above to avoid redefining the same
  // identifier (was `playlistSelectedIndex` before). This prevents a
  // duplicate binding error during build/transpile.
  const slidePosition = selectedIndex >= 0 ? `${selectedIndex + 1} / ${slideCount}` : null

  if (isReadMode) {
    return (
      <ReadPresenter
        book={currentBook}
        chapter={currentChapter}
        theme={theme}
        fontSize={65}
        onRequestClose={() => setIsReadMode(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {!isFullscreen ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Verse Presenter</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Build a local set list of verses, adjust the theme, then step through slides or go fullscreen.
              </p>
            </div>
          </div>

          {/* Top controls row: Book / Chapter / Verse */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Book</span>
              <select
                value={currentBook}
                onChange={(e) => setCurrentBook(Number(e.target.value))}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2"
              >
                {BOOK_ORDER_DROPDOWN.map((book) => {
                  const name = getLocalizedBookName(book, lang, bible.getBook(book)?.bname || BOOK_NAMES[book])
                  return (
                    <option key={book} value={book}>
                      {combinedBookLabel(book, name, lang === 'en')}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Chapter</span>
              <select
                value={currentChapter}
                onChange={(e) => setCurrentChapter(Number(e.target.value))}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2"
              >
                {chapters.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Verse</span>
              <select
                value={currentVerse}
                onChange={(e) => setCurrentVerse(Number(e.target.value))}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2"
              >
                {verses.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Notes input removed from presenter page UI per request. Notes remain supported on slides but cannot be edited here. */}
        </div>
      ) : null}
      <div className={classNames('grid gap-6', isFullscreen ? '' : 'lg:grid-cols-[minmax(0,1fr)_320px]')}>

        <div
          ref={presenterRef}
          className={classNames(
            'relative flex items-center justify-center rounded-3xl border border-black/10 dark:border-white/10 bg-black/10 overflow-hidden',
            isFullscreen ? 'h-screen w-screen max-w-none rounded-none border-none' : 'aspect-[16/9] w-full shadow-xl',
          )}
          style={{
            background:
              normalizeTheme(theme).gradient.style === 'radial'
                ? `radial-gradient(circle, ${normalizeTheme(theme).gradient.colors.join(', ')})`
                : `linear-gradient(${normalizeTheme(theme).gradient.angle}deg, ${normalizeTheme(theme).gradient.colors.join(', ')})`,
          }}
          data-presenter-preview
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex h-full w-full flex-col px-6 pt-8 pb-14 sm:px-10 text-white">
            <div ref={previewTextContainerRef} className="flex-1 flex items-center justify-center w-full presenter-preview-content">
              <div
                ref={previewTextRef}
                className={classNames(
                  'w-full font-semibold drop-shadow-xl whitespace-pre-wrap presenter-preview-card',
                  normalizeTheme(theme).textAlign === 'center' ? 'text-center' :
                  normalizeTheme(theme).textAlign === 'right' ? 'text-right' : 'text-left',
                )}
                style={{ fontSize: `${previewFontSize}px`, lineHeight: normalizeTheme(theme).lineHeight, fontFamily: lang === 'te' ? "Dhurjati, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" : undefined }}
              >
                {previewVerse.text}
              </div>
            </div>
            {previewVerse.note ? <p className="mt-4 text-sm opacity-80">{previewVerse.note}</p> : null}
            <div
              className="presenter-preview-reference"
              style={{ textAlign: normalizeTheme(theme).referenceAlign === 'center' ? 'center' : normalizeTheme(theme).referenceAlign === 'right' ? 'right' : 'left' }}
            >
              <div className="inline-block bg-amber-100 text-amber-900 dark:bg-amber-700 dark:text-amber-100 font-semibold shadow-[0_6px_0_rgba(0,0,0,0.2)] rounded-md px-4 py-1 text-sm sm:text-base max-w-[90%] truncate">
                {activeReference}
              </div>
            </div>
          </div>
          {/* Fullscreen floating controls removed per request */}
        </div>

        {!isFullscreen ? (
          <aside className="space-y-4">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-4 space-y-3">
              <h2 className="text-lg font-semibold">Theme</h2>
              <div className="grid grid-cols-3 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="h-12 rounded-xl border border-black/10 dark:border-white/10"
                    style={{
                      background:
                        preset.style === 'radial'
                          ? `radial-gradient(circle, ${preset.colors.join(', ')})`
                          : `linear-gradient(${preset.angle}deg, ${preset.colors.join(', ')})`,
                    }}
                    onClick={() =>
                      setTheme((prev) =>
                        normalizeTheme({
                          ...prev,
                          gradient: {
                            colors: preset.colors,
                            angle: preset.angle,
                            style: preset.style ?? 'linear',
                          },
                        }),
                      )
                    }
                  />
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Custom colours</p>
                <div className="flex flex-wrap gap-3">
                  {normalizeTheme(theme).gradient.colors.map((color, index) => (
                    <label key={index} className="flex flex-col items-center gap-1 text-xs">
                      <span>Color {index + 1}</span>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleGradientColorChange(index, e.target.value)}
                        className="h-10 w-16 rounded"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 text-xs">
                  <button type="button" className="btn" onClick={handleAddColorStop} disabled={normalizeTheme(theme).gradient.colors.length >= 3}>
                    Add colour
                  </button>
                  <button type="button" className="btn" onClick={handleRemoveColorStop} disabled={normalizeTheme(theme).gradient.colors.length <= 2}>
                    Remove colour
                  </button>
                </div>
              </div>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Gradient angle ({normalizeTheme(theme).gradient.angle}°)</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={normalizeTheme(theme).gradient.angle}
                  onChange={(e) =>
                    setTheme((prev) =>
                      normalizeTheme({ ...prev, gradient: { ...prev.gradient, angle: Number(e.target.value) } }),
                    )
                  }
                />
              </label>

              {/* Font size and line-height controls removed: presenter uses auto-fit sizing */}
            </div>
          </aside>
        ) : null}
      </div>

      {!isFullscreen ? (
        <div className="space-y-4">
          {/* Controls reordered: Previous / Next / Full screen now appear above Set list */}
          <div className="mt-0 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <button type="button" className="btn" onClick={handlePrevSlide}>Prev</button>
                <button type="button" className="btn" onClick={handleNextSlide}>Next</button>
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn" onClick={handleEnterFullscreen}>Full screen</button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Set list</h2>
            <div className="flex items-center gap-2">
              <button type="button" className="btn" onClick={handleImportList}>Import list</button>
              <button type="button" className="btn" onClick={handleExportList}>Export list</button>
              {slidePosition ? <p className="text-sm text-neutral-600 dark:text-neutral-300">Slide {slidePosition}</p> : null}
            </div>
          </div>
          {playlist.length === 0 ? (
            <>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Add verses to build your set list. They are stored locally and cleared when you reload the page.
              </p>
              <div className="flex justify-end mt-3">
                <button type="button" className="btn" onClick={handleAddSlide}>
                  Add current verse
                </button>
              </div>
            </>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={playlist.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-3">
                    {playlist.map((item) => (
                      <li key={item.id}>
                        <SortablePlaylistItem
                          item={item}
                          active={item.id === selectedId}
                          onSelect={() => handleSelectSlide(item.id)}
                          onRemove={() => handleRemoveSlide(item.id)}
                          formatRef={(b,c,v)=>bible.formatReference(b,c,v)}
                        />
                      </li>
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
              <div className="flex gap-2 mt-3">
                <button type="button" className="btn" onClick={handleAddSlide}>
                  {selectedId ? 'Add as new slide' : 'Add current verse'}
                </button>
                <button type="button" className="btn" onClick={handleUpdateSlide} disabled={!selectedId}>
                  Update selected slide
                </button>
                <button type="button" className="btn" onClick={handleNewSlide}>
                  New slide
                </button>
                <button type="button" className="btn" onClick={() => { setPlaylist([]); setSelectedId(null); }} disabled={playlist.length === 0}>
                  Clear set
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Footer controls removed from bottom; controls moved above Set list per request */}
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="rounded-md bg-black/80 text-white px-4 py-2 shadow">{toast}</div>
        </div>
      ) : null}
    </div>
  )
}

export default PresenterBuilder





