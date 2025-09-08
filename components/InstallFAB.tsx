'use client'
import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

/** Chrome/Edge Android event for PWA install prompt */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallFAB() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // If already running as an installed app, never show
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // iOS Safari standalone detection
      (navigator as any).standalone

    if (isStandalone) setInstalled(true)

    const onBeforeInstall = (e: Event) => {
      // Prevent Chrome’s mini-infobar; store the event so we can trigger later
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)

    window.addEventListener('beforeinstallprompt', onBeforeInstall as any)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as any)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Only show the FAB on mobile (md:hidden), when installable and not installed
  if (installed || !deferred) return null

  const clickInstall = async () => {
    try {
      await deferred.prompt()
      await deferred.userChoice
      // Event can’t be reused; hide the button
      setDeferred(null)
    } catch {
      // user dismissed or error — keep silent
    }
  }

  return (
    <button
      onClick={clickInstall}
      aria-label="Install app"
      title="ఇన్స్టాల్"
      className="
        md:hidden fixed bottom-5 right-5 z-50
        w-14 h-14 rounded-full
        bg-red-600 text-white shadow-lg shadow-red-600/40
        flex items-center justify-center
        active:scale-95 transition
      "
    >
      <Download className="w-6 h-6" />
    </button>
  )
}
