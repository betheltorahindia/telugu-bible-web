'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type CoverflowProps<T> = {
  items: T[]
  keyOf: (item: T) => string
  render: (item: T, active: boolean) => ReactNode
  baseWidth?: number
  ratio?: number
  label: string
}

export function Coverflow<T>({
  items,
  keyOf,
  render,
  baseWidth = 420,
  ratio = 9 / 16,
  label,
}: CoverflowProps<T>) {
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement | null>(null)

  const go = useCallback((direction: number) => {
    const track = trackRef.current
    if (!track) return
    const firstCard = track.firstElementChild
    if (!(firstCard instanceof HTMLElement)) return
    const step = firstCard.getBoundingClientRect().width + 18
    track.scrollTo({ left: track.scrollLeft + direction * step, behavior: 'smooth' })
  }, [])

  const updateIndex = useCallback(() => {
    const track = trackRef.current
    const firstCard = track?.firstElementChild
    if (!track || !(firstCard instanceof HTMLElement)) return
    const step = firstCard.getBoundingClientRect().width + 18
    setIndex(Math.min(items.length - 1, Math.max(0, Math.round(track.scrollLeft / step))))
  }, [items.length])

  return (
    <div className="sw-carousel" role="group" aria-label={label}>
      <div
        ref={trackRef}
        className="sw-carousel-track"
        onScroll={updateIndex}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') go(1)
          if (event.key === 'ArrowLeft') go(-1)
        }}
        tabIndex={0}
      >
        {items.map((item) => (
          <div
            key={keyOf(item)}
            className="sw-carousel-card"
            style={{ width: `min(${baseWidth}px, 84vw)`, aspectRatio: `${1 / ratio}` }}
          >
            {render(item, true)}
          </div>
        ))}
      </div>

      <div className="sw-carousel-controls">
        <button
          type="button"
          aria-label="Previous item"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="sw-carousel-arrow"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="sw-carousel-count">{items.length ? `${index + 1} / ${items.length}` : '0 / 0'}</span>
        <button
          type="button"
          aria-label="Next item"
          onClick={() => go(1)}
          disabled={index >= items.length - 1}
          className="sw-carousel-arrow"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
