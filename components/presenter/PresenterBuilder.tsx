'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation } from '@tanstack/react-query'
import { BOOK_NAMES, BOOK_ORDER_DROPDOWN } from '../../lib/data/books'
import {
  formatReference,
  getNextVerse,
  getPreviousVerse,
  getVerseText,
  listChapters,
  listVerses,
} from '../../lib/presenter/bible'
import type { PresenterBootstrap, PresenterProject, PresenterProjectWithItems } from '../../lib/presenter/types'
import type { ThemeSettings } from '../../lib/supabase/types'
import { DEFAULT_THEME, GRADIENT_PRESETS, normalizeTheme } from '../../lib/presenter/theme'
import { createProject, deleteProject, loadProject, updateProject } from '../../lib/presenter/api'
import type { UpsertProjectInput } from '../../lib/presenter/schema'
import { Modal } from '../common/Modal'
import { useAutoFitText } from './useAutoFitText'

type PlaylistItemDraft = {
  key: string
  book: number
  chapter: number
  verse: number
  note?: string | null
}

type PresenterBuilderProps = {
  bootstrap: PresenterBootstrap | null
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? ''

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function playlistFromProject(project: PresenterProjectWithItems | null): PlaylistItemDraft[] {
  if (!project) return []
  return project.items.map((item) => ({
    key: crypto.randomUUID(),
    book: item.book,
    chapter: item.chapter,
    verse: item.verse,
    note: item.note ?? null,
  }))
}

function toUpsertPayload(
  title: string,
  slug: string,
  theme: ThemeSettings,
  playlist: PlaylistItemDraft[],
): UpsertProjectInput {
  return {
    title,
    slug,
    settings: normalizeTheme(theme),
    items: playlist.map((item) => ({
      book: item.book,
      chapter: item.chapter,
      verse: item.verse,
      note: item.note ?? null,
    })),
  }
}
function computeShareUrl(slug: string) {
  const base =
    SITE_URL ||
    (typeof window !== 'undefined' && window.location ? window.location.origin : '')
  if (!base) return `/present/${slug}`
  return `${base.replace(/\/\/+$/, '')}/present/${slug}`
}

function toProjectSummary(project: PresenterProjectWithItems): PresenterProject {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    ownerUserId: project.ownerUserId,
    settings: project.settings,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

function SortablePlaylistItem({ item, active, onSelect, onRemove }: {
  item: PlaylistItemDraft
  active: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key })

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
        'rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 px-3 py-2 flex items-center justify-between gap-2',
        active ? 'ring-2 ring-amber-500' : undefined,
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
export function PresenterBuilder({ bootstrap }: PresenterBuilderProps) {
  if (!bootstrap) {
    return (
      <div className="card max-w-xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">Verse Presenter</h1>
        <p>We could not load your Supabase session. Please refresh and sign in again.</p>
      </div>
    )
  }

  const [projects, setProjects] = useState(bootstrap.projects)
  const [quota, setQuota] = useState(bootstrap.quota)
  const [projectsSearch, setProjectsSearch] = useState('')

  const [projectId, setProjectId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME)
  const [playlist, setPlaylist] = useState<PlaylistItemDraft[]>([])
  const playlistCount = playlist.length
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const [currentBook, setCurrentBook] = useState<number>(1)
  const [currentChapter, setCurrentChapter] = useState<number>(1)
  const [currentVerse, setCurrentVerse] = useState<number>(1)
  const [noteDraft, setNoteDraft] = useState('')

  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [projectsModalOpen, setProjectsModalOpen] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareTitle, setShareTitle] = useState('')
  const [shareSlug, setShareSlug] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null)

  const previewRef = useRef<HTMLDivElement>(null)

  const resetState = useCallback(() => {
    setProjectId(null)
    setTitle('')
    setSlug('')
    setTheme(DEFAULT_THEME)
    setPlaylist([])
    setSelectedIndex(null)
    setCurrentBook(1)
    setCurrentChapter(1)
    setCurrentVerse(1)
    setNoteDraft('')
    setShareTitle('')
    setShareSlug('')
    setShareUrl(null)
  }, [])

  const applyProject = useCallback((project: PresenterProjectWithItems) => {
    const normalizedTheme = normalizeTheme(project.settings)
    setProjectId(project.id)
    setTitle(project.title)
    setSlug(project.slug)
    setTheme(normalizedTheme)
    const nextPlaylist = playlistFromProject(project)
    setPlaylist(nextPlaylist)
    if (nextPlaylist.length > 0) {
      setSelectedIndex(0)
      const first = nextPlaylist[0]
      setCurrentBook(first.book)
      setCurrentChapter(first.chapter)
      setCurrentVerse(first.verse)
      setNoteDraft(first.note ?? '')
    } else {
      setSelectedIndex(null)
      setCurrentBook(1)
      setCurrentChapter(1)
      setCurrentVerse(1)
      setNoteDraft('')
    }
    setShareTitle(project.title)
    setShareSlug(project.slug)
    setShareUrl(computeShareUrl(project.slug))
  }, [])

  const handleSelectPlaylistItem = useCallback(
    (index: number) => {
      setSelectedIndex(index)
      const item = playlist[index]
      if (item) {
        setCurrentBook(item.book)
        setCurrentChapter(item.chapter)
        setCurrentVerse(item.verse)
        setNoteDraft(item.note ?? '')
      }
    },
    [playlist],
  )

  const handleAddToPlaylist = useCallback(() => {
    setShareError(null)
    if (playlistCount >= 200) {
      setShareError('Playlists are limited to 200 slides.')
      return
    }
    const note = noteDraft.trim()
    const newItem: PlaylistItemDraft = {
      key: crypto.randomUUID(),
      book: currentBook,
      chapter: currentChapter,
      verse: currentVerse,
      note: note ? note : null,
    }
    setPlaylist((prev) => {
      const next = [...prev, newItem]
      setSelectedIndex(next.length - 1)
      return next
    })
  }, [playlistCount, noteDraft, currentBook, currentChapter, currentVerse])

  const handleRemoveFromPlaylist = useCallback((key: string) => {
    setPlaylist((prev) => {
      const index = prev.findIndex((item) => item.key === key)
      if (index === -1) return prev
      const next = prev.filter((item) => item.key !== key)
      setSelectedIndex((current) => {
        if (current === null) return current
        if (current === index) {
          if (next.length === 0) {
            setNoteDraft('')
            return null
          }
          return Math.min(index, next.length - 1)
        }
        if (current > index) {
          return current - 1
        }
        return current
      })
      return next
    })
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      setPlaylist((prev) => {
        const oldIndex = prev.findIndex((item) => item.key === active.id)
        const newIndex = prev.findIndex((item) => item.key === over.id)
        if (oldIndex === -1 || newIndex === -1) return prev
        const next = arrayMove(prev, oldIndex, newIndex)
        if (selectedIndex !== null) {
          const selectedKey = prev[selectedIndex]?.key
          if (selectedKey) {
            const nextSelectedIndex = next.findIndex((item) => item.key === selectedKey)
            setSelectedIndex(nextSelectedIndex === -1 ? null : nextSelectedIndex)
          }
        }
        return next
      })
    },
    [selectedIndex],
  )

  const handleNextVerse = useCallback(() => {
    const next = getNextVerse(currentBook, currentChapter, currentVerse)
    if (!next) return
    setCurrentBook(next.bnumber)
    setCurrentChapter(next.cnumber)
    setCurrentVerse(next.vnumber)
  }, [currentBook, currentChapter, currentVerse])

  const handlePreviousVerse = useCallback(() => {
    const prevVerse = getPreviousVerse(currentBook, currentChapter, currentVerse)
    if (!prevVerse) return
    setCurrentBook(prevVerse.bnumber)
    setCurrentChapter(prevVerse.cnumber)
    setCurrentVerse(prevVerse.vnumber)
  }, [currentBook, currentChapter, currentVerse])

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.()
      setIsFullscreen(false)
      return
    }
    const target = previewRef.current
    if (target?.requestFullscreen) {
      await target.requestFullscreen()
      setIsFullscreen(true)
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const currentVerseText = useMemo(
    () => getVerseText(currentBook, currentChapter, currentVerse),
    [currentBook, currentChapter, currentVerse],
  )

  const currentReference = useMemo(
    () => formatReference(currentBook, currentChapter, currentVerse),
    [currentBook, currentChapter, currentVerse],
  )

  const createMutation = useMutation({
    mutationFn: (payload: UpsertProjectInput) => createProject(payload),
    onSuccess: (project) => {
      applyProject(project)
      const summary = toProjectSummary(project)
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === summary.id)
        if (!exists) {
          setQuota((prevQuota) => ({
            limit: prevQuota.limit,
            used: prevQuota.used + 1,
          }))
        }
        return [summary, ...prev.filter((p) => p.id !== summary.id)]
      })
      setShareError(null)
    },
    onError: (error: Error) => {
      setShareError(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: UpsertProjectInput }) =>
      updateProject(projectId, payload),
    onSuccess: (project) => {
      applyProject(project)
      const summary = toProjectSummary(project)
      setProjects((prev) => [summary, ...prev.filter((p) => p.id !== summary.id)])
      setShareError(null)
    },
    onError: (error: Error) => {
      setShareError(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_res, id) => {
      setProjects((prev) => prev.filter((project) => project.id !== id))
      setQuota((prev) => ({ limit: prev.limit, used: Math.max(0, prev.used - 1) }))
      if (projectId === id) {
        resetState()
      }
    },
  })

  const handleSaveProject = async () => {
    setShareError(null)
    if (!shareTitle.trim()) {
      setShareError('Enter a project title')
      return
    }
    if (!shareSlug.trim()) {
      setShareError('Enter a project slug')
      return
    }
    if (!playlist.length) {
      setShareError('Add at least one verse to the set list')
      return
    }

    const payload = toUpsertPayload(shareTitle.trim(), shareSlug.trim(), theme, playlist)

    if (projectId) {
      updateMutation.mutate({ projectId, payload })
      return
    }

    if (quota.limit !== null && quota.used >= quota.limit) {
      setShareError('You reached your project limit. Delete an existing project or upgrade.')
      return
    }

    createMutation.mutate(payload)
  }
const openShareModal = () => {
    const fallbackTitle = title || 'New Presenter Project'
    const computedSlug = slug || slugify(title || 'new-presenter')
    setShareTitle(fallbackTitle)
    setShareSlug(computedSlug)
    setShareError(null)
    setShareUrl(projectId ? `${SITE_URL || window.location.origin}/present/${computedSlug}` : null)
    setShareModalOpen(true)
  }

  const handleOpenProject = async (id: string) => {
    setLoadingProjectId(id)
    try {
      const project = await loadProject(id)
      applyProject(project)
      setProjectsModalOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingProjectId(null)
    }
  }
  const quotaLabel = useMemo(() => {
    if (quota.limit === null) return 'Unlimited projects'
    return `${quota.used} of ${quota.limit} used`
  }, [quota])

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (!projectsSearch.trim()) return true
        const term = projectsSearch.toLowerCase()
        return (
          project.title.toLowerCase().includes(term) ||
          project.slug.toLowerCase().includes(term)
        )
      }),
    [projects, projectsSearch],
  )

  const verseOptions = useMemo(() => listVerses(currentBook, currentChapter), [currentBook, currentChapter])
  const chapterOptions = useMemo(() => listChapters(currentBook), [currentBook])
  const previewTextContainerRef = useRef<HTMLDivElement>(null)
  const previewTextRef = useRef<HTMLDivElement>(null)
  const previewLineHeight = theme.lineHeight
  const previewFontSize = useAutoFitText({
    text: currentVerseText || 'Select a verse to preview',
    containerRef: previewTextContainerRef,
    contentRef: previewTextRef,
    baseSize: theme.fontSize,
    minSize: 28,
    lineHeight: previewLineHeight,
  })
  useEffect(() => {
    if (!chapterOptions.includes(currentChapter)) {
      const nextChapter = chapterOptions[0] ?? 1
      setCurrentChapter(nextChapter)
    }
  }, [chapterOptions, currentChapter])

  useEffect(() => {
    if (!verseOptions.includes(currentVerse)) {
      const nextVerse = verseOptions[0] ?? 1
      setCurrentVerse(nextVerse)
    }
  }, [verseOptions, currentVerse])

  useEffect(() => {
    if (projects.length === 0) {
      resetState()
    }
  }, [projects, resetState])

  useEffect(() => {
    if (selectedIndex === null) {
      setNoteDraft('')
      return
    }
    const item = playlist[selectedIndex]
    if (!item) {
      return
    }
    setNoteDraft(item.note ?? '')
  }, [playlist, selectedIndex])

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  useEffect(() => {
    if (!isFullscreen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        document.exitFullscreen?.()
        setIsFullscreen(false)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleNextVerse()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handlePreviousVerse()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isFullscreen, handleNextVerse, handlePreviousVerse])
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Verse Presenter</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Build a playlist of verses, adjust the gradient theme, then share a fullscreen presentation link.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{quotaLabel}</span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setProjectsSearch('')
              setProjectsModalOpen(true)
            }}
          >
            Projects
          </button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex flex-col text-sm font-medium">
              Book
              <select
                value={currentBook}
                onChange={(event) => setCurrentBook(Number(event.target.value))}
                className="mt-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2"
              >
                {BOOK_ORDER_DROPDOWN.map((bookNumber) => (
                  <option key={bookNumber} value={bookNumber}>
                    {BOOK_NAMES[bookNumber] ?? `Book ${bookNumber}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium">
              Chapter
              <select
                value={currentChapter}
                onChange={(event) => setCurrentChapter(Number(event.target.value))}
                className="mt-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2"
              >
                {chapterOptions.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium">
              Verse
              <select
                value={currentVerse}
                onChange={(event) => setCurrentVerse(Number(event.target.value))}
                className="mt-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2"
              >
                {verseOptions.map((verse) => (
                  <option key={verse} value={verse}>
                    {verse}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div ref={previewRef} className="relative flex items-center justify-center">
            <div
              className="relative aspect-[16/9] w-full max-w-4xl rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 shadow-xl"
              style={{
                background:
                  theme.gradient.style === 'radial'
                    ? `radial-gradient(circle, ${theme.gradient.colors.join(', ')})`
                    : `linear-gradient(${theme.gradient.angle}deg, ${theme.gradient.colors.join(', ')})`,
              }}
            >
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 flex h-full flex-col px-6 sm:px-10 pt-8 pb-14 text-white">
                <div ref={previewTextContainerRef} className="flex-1 flex items-center justify-center w-full">
                  <div
                    ref={previewTextRef}
                    className="w-full text-center font-semibold drop-shadow-xl whitespace-pre-wrap"
                    style={{ fontSize: `${previewFontSize}px`, lineHeight: previewLineHeight }}
                  >
                    {currentVerseText || 'Select a verse to preview'}
                  </div>
                </div>
                {noteDraft ? (
                  <div className="mx-auto mt-3 max-w-2xl rounded-xl bg-black/35 px-4 py-2 text-center text-sm text-white/90">
                    {noteDraft}
                  </div>
                ) : null}
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs sm:text-sm uppercase tracking-wide font-semibold text-white/90">
                {currentReference}
              </div>
            </div>
          </div>
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Set list</h2>
              <button type="button" className="btn" onClick={handleAddToPlaylist}>
                Add current verse
              </button>
            </div>
            {playlist.length === 0 ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                The set list is empty. Add the current verse to start your playlist.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={playlist.map((item) => item.key)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {playlist.map((item, index) => (
                      <SortablePlaylistItem
                        key={item.key}
                        item={item}
                        active={selectedIndex === index}
                        onSelect={() => handleSelectPlaylistItem(index)}
                        onRemove={() => handleRemoveFromPlaylist(item.key)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            {selectedIndex !== null ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Optional note
                  <textarea
                    value={noteDraft}
                    onChange={(event) => {
                      const value = event.target.value
                      setNoteDraft(value)
                      setPlaylist((prev) => {
                        const next = [...prev]
                        const target = next[selectedIndex]
                        if (target) {
                          target.note = value ? value : null
                        }
                        return next
                      })
                    }}
                    className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Add presenter cue (optional)"
                  />
                </label>
              </div>
            ) : null}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-lg font-semibold">Theme</h2>
            <div className="grid grid-cols-2 gap-3">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setTheme((prev) => ({
                      ...prev,
                      gradient: {
                        colors: preset.colors,
                        angle: preset.angle,
                        style: preset.style ?? 'linear',
                      },
                    }))
                  }
                  className={classNames(
                    'rounded-2xl h-16 border border-black/10 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-transform',
                    theme.gradient.colors.join(',') === preset.colors.join(',') ? 'ring-2 ring-amber-500 scale-[1.02]' : undefined,
                  )}
                  style={{
                    background:
                      (preset.style ?? 'linear') === 'radial'
                        ? `radial-gradient(circle, ${preset.colors.join(', ')})`
                        : `linear-gradient(${preset.angle}deg, ${preset.colors.join(', ')})`,
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {theme.gradient.colors.map((color, index) => (
                <label key={index} className="block text-sm font-medium">
                  Color {index + 1}
                  <input
                    type="color"
                    value={color}
                    onChange={(event) =>
                      setTheme((prev) => {
                        const nextColors = [...prev.gradient.colors]
                        nextColors[index] = event.target.value
                        return { ...prev, gradient: { ...prev.gradient, colors: nextColors } }
                      })
                    }
                    className="mt-1 h-10 w-full cursor-pointer rounded border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80"
                  />
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setTheme((prev) => ({
                    ...prev,
                    gradient: {
                      ...prev.gradient,
                      colors: [...prev.gradient.colors, prev.gradient.colors[prev.gradient.colors.length - 1] ?? '#ffffff'],
                    },
                  }))
                }
                disabled={theme.gradient.colors.length >= 3}
              >
                Add color
              </button>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setTheme((prev) => ({
                    ...prev,
                    gradient: {
                      ...prev.gradient,
                      colors: prev.gradient.colors.slice(0, Math.max(2, prev.gradient.colors.length - 1)),
                    },
                  }))
                }
                disabled={theme.gradient.colors.length <= 2}
              >
                Remove color
              </button>
            </div>
            <label className="block text-sm font-medium">
              Gradient angle
              <input
                type="range"
                min={0}
                max={360}
                value={theme.gradient.angle}
                onChange={(event) =>
                  setTheme((prev) => ({
                    ...prev,
                    gradient: { ...prev.gradient, angle: Number(event.target.value) },
                  }))
                }
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-sm font-medium">
              Font size
              <input
                type="range"
                min={28}
                max={72}
                value={theme.fontSize}
                onChange={(event) => setTheme((prev) => ({ ...prev, fontSize: Number(event.target.value) }))}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-sm font-medium">
              Line height
              <input
                type="range"
                min={10}
                max={20}
                value={Math.round(theme.lineHeight * 10)}
                onChange={(event) => setTheme((prev) => ({ ...prev, lineHeight: Number(event.target.value) / 10 }))}
                className="mt-1 w-full"
              />
            </label>
                      </div>
        </div>
      </div>
      <div className="sticky bottom-4 z-10">
        <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" className="btn" onClick={handlePreviousVerse}>
              Prev
            </button>
            <button type="button" className="btn" onClick={handleNextVerse}>
              Next
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn" onClick={toggleFullscreen}>
              {isFullscreen ? 'Exit full screen' : 'Full screen'}
            </button>
            <button type="button" className="btn" onClick={openShareModal}>
              Share link
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setProjectsSearch('')
                setProjectsModalOpen(true)
              }}
            >
              Projects
            </button>
          </div>
        </div>
      </div>
      {isFullscreen ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-black text-white" role="presentation">
          <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-12">
            <div
              className="relative aspect-[16/9] w-full max-w-6xl rounded-[36px] overflow-hidden border border-white/10 shadow-2xl"
              style={{
                background:
                  theme.gradient.style === 'radial'
                    ? `radial-gradient(circle, ${theme.gradient.colors.join(', ')})`
                    : `linear-gradient(${theme.gradient.angle}deg, ${theme.gradient.colors.join(', ')})`,
              }}
            >
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 flex h-full flex-col px-8 md:px-16 pt-10 pb-16">
                <div className="flex-1 flex items-center justify-center w-full">
                  <div
                    className="w-full text-center font-semibold drop-shadow-2xl whitespace-pre-wrap"
                    style={{ fontSize: `${previewFontSize}px`, lineHeight: previewLineHeight }}
                  >
                    {currentVerseText || 'Select a verse to preview'}
                  </div>
                </div>
                {noteDraft ? (
                  <div className="mx-auto mt-4 max-w-3xl rounded-xl bg-black/35 px-6 py-3 text-center text-base text-white/90">
                    {noteDraft}
                  </div>
                ) : null}
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm md:text-base uppercase tracking-wide font-semibold text-white/90">
                {currentReference}
              </div>
            </div>
          </div>
          <div className="px-6 pb-6 flex justify-end">
            <button type="button" className="btn" onClick={toggleFullscreen}>
              Exit full screen
            </button>
          </div>
        </div>
       ) : null}
      <Modal
        open={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false)
          setShareError(null)
        }}
        title="Share presenter"
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Title
            <input
              value={shareTitle}
              onChange={(event) => {
                const value = event.target.value
                setShareTitle(value)
                if (!projectId) {
                  const auto = slugify(value)
                  if (auto) {
                    setShareSlug(auto)
                  }
                }
              }}
              className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Slug
            <input
              value={shareSlug}
              onChange={(event) => setShareSlug(slugify(event.target.value))}
              className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2"
            />
          </label>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {playlist.length} slide{playlist.length === 1 ? '' : 's'} in this project.
          </p>
          {shareError ? <p className="text-sm text-red-600 dark:text-red-400">{shareError}</p> : null}
          {shareUrl ? (
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-neutral-100/60 dark:bg-neutral-800/60 px-3 py-2 text-sm">
              {shareUrl}
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setShareModalOpen(false)
              setShareError(null)
            }}
          >
            Close
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleSaveProject}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : projectId ? 'Update project' : 'Create project'}
          </button>
        </div>
      </Modal>
      <Modal
        open={projectsModalOpen}
        onClose={() => {
          setProjectsModalOpen(false)
          setProjectsSearch('')
        }}
        title="Your projects"
        widthClassName="max-w-2xl"
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setProjectsModalOpen(false)
              resetState()
            }}
          >
            New blank project
          </button>
          {projects.length > 0 ? (
            <input
              type="search"
              value={projectsSearch}
              onChange={(event) => setProjectsSearch(event.target.value)}
              placeholder="Search by title or slug"
              className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 px-3 py-2 text-sm"
            />
          ) : null}
          {projects.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              No projects yet. Create one using Share link.
            </p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">No projects matched your search.</p>
          ) : (
            <ul className="space-y-3">
              {filteredProjects.map((project) => (
                <li key={project.id} className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{project.title}</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">/present/{project.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleOpenProject(project.id)}
                        disabled={loadingProjectId === project.id}
                      >
                        {loadingProjectId === project.id ? 'Opening...' : 'Open'}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => deleteMutation.mutate(project.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  )
}



















































