'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BOOK_NAMES, BOOK_ORDER_DROPDOWN, combinedBookLabel } from '../../lib/data/books'
import {
  formatReference,
  getNextVerse,
  getPreviousVerse,
  getVerseText,
  listChapters,
  listVerses,
} from '../../lib/presenter/bible'
import { DEFAULT_THEME, GRADIENT_PRESETS, normalizeTheme } from '../../lib/presenter/theme'
import type { ThemeSettings } from '../../lib/supabase/types'
import { useAutoFitText } from './useAutoFitText'

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
}: {
  item: PlaylistItem
  active: boolean
  onSelect: () => void
  onRemove: () => void
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
        {formatReference(item.book, item.chapter, item.verse)}
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
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentBook, setCurrentBook] = useState<number>(1)
  const [currentChapter, setCurrentChapter] = useState<number>(1)
  const [currentVerse, setCurrentVerse] = useState<number>(1)
  const [noteDraft, setNoteDraft] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  

  const presenterRef = useRef<HTMLDivElement>(null)
  const previewTextContainerRef = useRef<HTMLDivElement>(null)
  const previewTextRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const chapters = useMemo(() => listChapters(currentBook), [currentBook])
  const verses = useMemo(() => listVerses(currentBook, currentChapter), [currentBook, currentChapter])

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
      setIsFullscreen(Boolean(activeElement))
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
    const text = getVerseText(source.book, source.chapter, source.verse)
    return {
      ...source,
      text,
      reference: formatReference(source.book, source.chapter, source.verse),
    }
  }, [activeSlide, currentBook, currentChapter, currentVerse, noteDraft])

  const previewFontSize = useAutoFitText({
    text: previewVerse.text,
    containerRef: previewTextContainerRef,
    contentRef: previewTextRef,
    baseSize: previewTheme.fontSize,
    minSize: 32,
    lineHeight: previewTheme.lineHeight,
  })

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
      const n = normalizeRef(getNextVerse(activeSlide.book, activeSlide.chapter, activeSlide.verse))
      if (n) next = n
    } else if (playlist.length > 0) {
      const last = playlist[playlist.length - 1]
      const n = normalizeRef(getNextVerse(last.book, last.chapter, last.verse))
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
    const prev = normalizeRef(getPreviousVerse(currentBook, currentChapter, currentVerse))
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
    const nx = normalizeRef(getNextVerse(currentBook, currentChapter, currentVerse))
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
    return `${formatReference(previewVerse.book, previewVerse.chapter, previewVerse.verse)}`
  }, [previewVerse.book, previewVerse.chapter, previewVerse.verse])

  const slideCount = playlist.length
  // reuse the `selectedIndex` computed above to avoid redefining the same
  // identifier (was `playlistSelectedIndex` before). This prevents a
  // duplicate binding error during build/transpile.
  const slidePosition = selectedIndex >= 0 ? `${selectedIndex + 1} / ${slideCount}` : null

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
                {BOOK_ORDER_DROPDOWN.map((book) => (
                  <option key={book} value={book}>
                    {combinedBookLabel(book, BOOK_NAMES[book])}
                  </option>
                ))}
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

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Notes (optional)</span>
            <textarea
              rows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2"
              placeholder="Add supporting notes or cues for this verse"
            />
          </label>
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
            <div ref={previewTextContainerRef} className="flex-1 flex items-center justify-center w-full">
              <div
                ref={previewTextRef}
                className={classNames(
                  'w-full font-semibold drop-shadow-xl whitespace-pre-wrap',
                  normalizeTheme(theme).textAlign === 'center' ? 'text-center' :
                  normalizeTheme(theme).textAlign === 'right' ? 'text-right' : 'text-left',
                )}
                style={{ fontSize: `${previewFontSize}px`, lineHeight: normalizeTheme(theme).lineHeight }}
              >
                {previewVerse.text || 'Select a verse to preview'}
              </div>
            </div>
            {previewVerse.note ? <p className="mt-4 text-sm opacity-80">{previewVerse.note}</p> : null}
            <div
              className={classNames(
                'mt-6 text-xs tracking-wide uppercase opacity-80',
                normalizeTheme(theme).referenceAlign === 'center'
                  ? 'text-center'
                  : normalizeTheme(theme).referenceAlign === 'right'
                    ? 'text-right'
                    : 'text-left',
              )}
            >
              {activeReference}
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

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Font size ({Math.round(previewFontSize)}px)</span>
                <input
                  type="range"
                  min={32}
                  max={96}
                  value={normalizeTheme(theme).fontSize}
                  onChange={(e) => setTheme((prev) => normalizeTheme({ ...prev, fontSize: Number(e.target.value) }))}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Line height ({normalizeTheme(theme).lineHeight.toFixed(2)})</span>
                <input
                  type="range"
                  min={1}
                  max={2}
                  step={0.05}
                  value={normalizeTheme(theme).lineHeight}
                  onChange={(e) => setTheme((prev) => normalizeTheme({ ...prev, lineHeight: Number(e.target.value) }))}
                />
              </label>
            </div>
          </aside>
        ) : null}
      </div>

      {!isFullscreen ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Set list</h2>
            {slidePosition ? <p className="text-sm text-neutral-600 dark:text-neutral-300">Slide {slidePosition}</p> : null}
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

      {/* Footer controls */}
      {!isFullscreen ? (
        <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-4">
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
      ) : null}
    </div>
  )
}

export default PresenterBuilder
