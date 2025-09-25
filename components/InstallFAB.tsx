'use client'
import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function InstallFAB() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [iosFallback, setIosFallback] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    // If already running as an installed app, hide the button
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // iOS Safari
      (navigator as any).standalone

    if (isStandalone) setInstalled(true)

    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) || (ua.includes('mac') && 'ontouchend' in window)
    const isSafari = ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios')

    if (isIosDevice && isSafari) {
      // iOS/iPadOS Safari does not emit beforeinstallprompt. Show manual hint instead.
      setIosFallback(true)
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      // Ask the SW to warm the cache in the background
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage('warm-cache')
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall as any)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as any)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    if (!showIosHint) return
    const timer = window.setTimeout(() => setShowIosHint(false), 8000)
    return () => window.clearTimeout(timer)
  }, [showIosHint])

  if (installed) return null

  const shouldShow = Boolean(deferred) || iosFallback
  if (!shouldShow) return null

  const clickInstall = async () => {
    try {
      if (deferred) {
        await deferred.prompt()
        await deferred.userChoice
        // event cannot be reused
        setDeferred(null)
      } else if (iosFallback) {
        setShowIosHint(true)
      }
    } catch {}
  }

  return (
    <>
      <button
        onClick={clickInstall}
        aria-label="Install app"
        title="ఇన్స్టాల్"
        className="
          lg:hidden fixed bottom-5 right-5 z-50
          w-14 h-14 rounded-full bg-red-600 text-white
          shadow-lg shadow-red-600/40 flex items-center justify-center
          active:scale-95 transition
        "
      >
        <Download className="w-6 h-6" />
      </button>

      {iosFallback && showIosHint && (
        <div
          className="
            fixed bottom-24 right-5 z-50 w-60 text-sm leading-snug
            rounded-xl bg-white/95 text-gray-900 shadow-lg shadow-red-600/20
            border border-red-100 p-3
          "
          role="status"
          aria-live="polite"
        >
          iPhone/iPad: Tap the Share icon (square with arrow) and choose
          <strong> Add to Home Screen</strong> to install.
        </div>
      )}
    </>
  )
}
