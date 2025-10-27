"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeTheme } from '../../../lib/presenter/theme'
import SlideStage from '../../../components/presenter/SlideStage'
import { useAutoFitText } from '../../../components/presenter/useAutoFitText'

type ChannelLike = {
  postMessage: (data: unknown) => void
  onmessage?: ((ev: MessageEvent) => void) | null
  close?: () => void
}

type PreviewVerse = { text?: string; reference?: string }
type PopoutState = {
  previewVerse?: PreviewVerse
  current?: PreviewVerse
  next?: PreviewVerse
  previewTheme?: Record<string, unknown>
  fontSize?: number
  playlist?: Array<{ id: string; reference: string; book: number; chapter: number; verse: number }>
  selectedId?: string | null
  sessionId?: string
}

function createChannel(sid: string): ChannelLike | BroadcastChannel {
  const name = `presenter-session-${sid}`
  if (typeof BroadcastChannel !== 'undefined') {
    try { return new BroadcastChannel(name) }
    catch (e) { /* fallback */ }
  }
  const fake: ChannelLike = {
    postMessage(data: unknown) {
      try { localStorage.setItem(`__bc__${name}`, JSON.stringify({ t: Date.now(), data })) } catch (e) {}
    },
    onmessage: null,
    close() {
      /* noop */
    }
  }
  return fake
}

export default function PopoutPage() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const sessionId = params.get('sessionId')
  const role = params.get('role') || 'display'

  const [state, setState] = useState<PopoutState | null>(null)
  const [connected, setConnected] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const ch = createChannel(sessionId)
    let mounted = true

    const handle = (ev: MessageEvent | { detail?: unknown }) => {
      const evt = ev as MessageEvent
      const msg = evt?.data ?? (ev as { detail?: unknown }).detail ?? undefined
      if (!msg || typeof msg !== 'object') return
      const { type, payload } = msg
      if (!mounted) return
      if (type === 'state:init' || type === 'state:update') {
        setState(payload)
        setConnected(true)
        // ack
        try { ch.postMessage?.({ type: 'ack', payload: { sessionId } }) } catch (e) {}
      }
      if (type === 'nav:next' || type === 'nav:prev' || type === 'nav:stop') {
        // display window should handle nav commands by updating local state if provided
        // but main presenter owns canonical state; we rely on state:update messages
      }
    }

    try {
      ;(ch as ChannelLike).onmessage = handle as (ev: MessageEvent) => void
    } catch (e) { /* ignore */ }
    try {
      ;(ch as BroadcastChannel).onmessage = handle as (ev: MessageEvent) => void
    } catch (e) { /* ignore */ }

    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith(`__bc__presenter-session-${sessionId}`)) return
      try {
        const parsed = JSON.parse(e.newValue || '')
  if (parsed?.data) handle({ detail: parsed.data })
      } catch (err) {}
    }
    window.addEventListener('storage', onStorage)

    // request initial state
    try { ch.postMessage?.({ type: 'request:init' }) } catch (e) {}

    // keyboard nav for both roles (display should accept left/right/esc)
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight') {
        try { ch.postMessage?.({ type: 'nav:next' }) } catch (e) {}
        ev.preventDefault()
      }
      if (ev.key === 'ArrowLeft') {
        try { ch.postMessage?.({ type: 'nav:prev' }) } catch (e) {}
        ev.preventDefault()
      }
      if (ev.key === 'Escape') {
        const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen
        if (exit) exit.call(document)
      }
    }
    window.addEventListener('keydown', onKey)

    try { window.focus() } catch (e) {}

    return () => {
      mounted = false
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('storage', onStorage)
      try { ch.close?.() } catch (e) {}
    }
  }, [sessionId])

  // request fullscreen for display role
  useEffect(() => {
    if (role !== 'display') return
    document.body.classList.add('presenter-mode')
    const el = document.documentElement
    const request = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen
    if (request) {
      try { request.call(el) } catch (e) {}
    }
    return () => {
      document.body.classList.remove('presenter-mode')
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen
      if (exit) exit.call(document)
    }
  }, [role])

  const previewText = state?.previewVerse?.text ?? ''
  const theme = normalizeTheme(state?.previewTheme ?? undefined)
  const fontSize = useAutoFitText({ text: previewText, containerRef: containerRef as unknown as React.MutableRefObject<HTMLDivElement | null>, contentRef: contentRef as unknown as React.MutableRefObject<HTMLDivElement | null>, baseSize: (state?.fontSize as number) ?? 80, minSize: 32, lineHeight: theme.lineHeight })

  if (role === 'controller') {
    // controller UI: show current and next previews and controls
    const current = state?.current ?? state?.previewVerse ?? null
    const next = state?.next ?? null
    const playlist = state?.playlist as any[] | undefined
    const selectedId = state?.selectedId
    const thumbSize = (state?.fontSize as number) ?? 80

    return (
      <div style={{ padding: 16, fontFamily: "Dhurjati, system-ui, -apple-system", maxWidth: '100vw', height: '100vh', overflow: 'auto', background: '#1a1a1a', color: '#fff' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {/* Current slide preview */}
          <div style={{ flex: '2', background: '#000', borderRadius: 12, padding: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
            <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
              <div style={{ transform: 'scale(0.33)', transformOrigin: 'top left', width: '300%', height: '300%', position: 'absolute' }}>
                <SlideStage text={current?.text ?? ''} reference={current?.reference} theme={theme} fontSize={thumbSize} />
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>Now Showing</div>
          </div>
          
          {/* Next slide preview */}
          <div style={{ flex: '1', background: '#000', borderRadius: 12, padding: 8 }}>
            <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
              <div style={{ transform: 'scale(0.33)', transformOrigin: 'top left', width: '300%', height: '300%', position: 'absolute' }}>
                <SlideStage text={next?.text ?? ''} reference={next?.reference} theme={theme} fontSize={thumbSize} />
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>Next</div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => { try { createChannel(sessionId ?? '').postMessage?.({ type: 'nav:prev' }) } catch (e) {} }} 
            className="btn btn-primary">Previous</button>
          <button onClick={() => { try { createChannel(sessionId ?? '').postMessage?.({ type: 'nav:next' }) } catch (e) {} }}
            className="btn btn-primary">Next</button>
          <div style={{ flex: 1 }}></div>
          <button onClick={() => { try { createChannel(sessionId ?? '').postMessage?.({ type: 'nav:stop' }) } catch (e) {} }}
            className="btn btn-secondary">Exit Presentation</button>
        </div>

        {/* Playlist */}
        {playlist && playlist.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Playlist</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {playlist.map((item: any, index) => (
                <div key={item.id} style={{ 
                  padding: 8, 
                  background: item.id === selectedId ? '#2563eb' : '#27272a',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ opacity: 0.7 }}>{index + 1}.</span>
                  <span>{item.reference}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ position: 'fixed', bottom: 16, left: 16, fontSize: 13, color: connected ? '#059669' : '#9CA3AF' }}>
          {connected ? `Connected • session ${sessionId}` : 'Disconnected'}
        </div>
      </div>
    )
  }

  // display role: render slide full-screen
  // Render the SlideStage directly so the popout display matches fullscreen exactly.
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ width: 1920, height: 1080 }}>
        <SlideStage
          text={state?.previewVerse?.text ?? ''}
          reference={state?.previewVerse?.reference ?? ''}
          theme={theme}
          fontSize={(state?.fontSize as number) ?? 80}
          containerRef={containerRef}
          contentRef={contentRef}
        />
      </div>
    </div>
  )
}
