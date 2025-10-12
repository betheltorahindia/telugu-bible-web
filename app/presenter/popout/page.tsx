"use client"

import React, { useEffect, useRef, useState } from 'react'
import { normalizeTheme } from '../../../lib/presenter/theme'
import { useAutoFitText } from '../../../components/presenter/useAutoFitText'

export default function PopoutPage() {
  const [preview, setPreview] = useState<any>(null)
  const [playlistInfo, setPlaylistInfo] = useState<{playlist:any[], selectedId:string|null}|null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [hintVisible, setHintVisible] = useState(false)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const bc = new BroadcastChannel('presenter-popout')
    let mounted = true
    bc.onmessage = (ev) => {
      if (!mounted) return
      if (ev.data?.type === 'preview') {
        setPreview(ev.data.payload)
      }
      if (ev.data?.type === 'playlist') {
        setPlaylistInfo(ev.data.payload)
      }
    }

    // request an initial sync from the main presenter
    bc.postMessage({ type: 'control', payload: { action: 'request-sync' } })

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight') {
        bc.postMessage({ type: 'control', payload: { action: 'next' } })
        ev.preventDefault()
      }
      if (ev.key === 'ArrowLeft') {
        bc.postMessage({ type: 'control', payload: { action: 'prev' } })
        ev.preventDefault()
      }
      if (ev.key === 'Escape') {
        // exit fullscreen if present, otherwise just blur
        const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen
        if (exit) exit.call(document)
      }
    }
    window.addEventListener('keydown', onKey)

    // click-to-next/prev: left half prev, right half next
    const onClick = (ev: MouseEvent) => {
      const rect = document.documentElement.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const w = rect.width
      if (x < w / 2) {
        bc.postMessage({ type: 'control', payload: { action: 'prev' } })
      } else {
        bc.postMessage({ type: 'control', payload: { action: 'next' } })
      }
    }
    window.addEventListener('click', onClick)

    // bring window to front and focus
    try { window.focus() } catch (e) {}

    return () => {
      mounted = false
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
      bc.close()
    }
  }, [])

  // request fullscreen and hide header when mounted
  useEffect(() => {
    document.body.classList.add('presenter-mode')
    const el = document.documentElement
    const request = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen
    if (request) {
      try { request.call(el) } catch (e) { /* ignore */ }
    }
    return () => {
      document.body.classList.remove('presenter-mode')
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen
      if (exit) exit.call(document)
    }
  }, [])

  const fontSize = useAutoFitText({
    text: preview?.previewVerse?.text ?? '',
    containerRef: { current: containerRef.current },
    contentRef: { current: contentRef.current },
    baseSize: 48,
    minSize: 20,
    lineHeight: preview?.previewTheme?.lineHeight ?? 1.35,
  })

  const theme = normalizeTheme(preview?.previewTheme ?? undefined)

  return (
    <div data-presenter-preview style={{ width: '100vw', height: '100vh', position: 'relative', background: theme.gradient.style === 'radial' ? `radial-gradient(circle, ${theme.gradient.colors.join(', ')})` : `linear-gradient(${theme.gradient.angle}deg, ${theme.gradient.colors.join(', ')})` }}>
      <div className="relative flex items-center justify-center w-full h-full presenter-preview-slide">
        <div className="relative z-10 flex h-full w-full flex-col px-6 pt-8 pb-14 sm:px-10 text-white presenter-preview-content" ref={containerRef}>
          <div className="flex-1 flex items-center justify-center w-full">
            <div ref={contentRef} className={"w-full font-semibold drop-shadow-xl whitespace-pre-wrap presenter-preview-card"} style={{ fontSize: `${fontSize}px`, lineHeight: theme.lineHeight, fontFamily: 'Dhurjati, system-ui, -apple-system' }}>
              {preview?.previewVerse?.text}
            </div>
          </div>
          <div className="presenter-preview-reference" style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff3c4', color: '#000', display: 'inline-block', padding: '8px 24px', borderRadius: 6, boxShadow: '0 6px 0 rgba(0,0,0,0.2)', fontWeight: 600 }}>
              {preview?.previewVerse?.reference}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
