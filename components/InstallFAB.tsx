'use client'
import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import bible from '../data/bible.json'

/** Chrome/Edge Android event for PWA install prompt */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** Build a list of URLs to pre-cache for full offline use */
function buildAllUrls(base: string) {
  const urls: string[] = []
  // Core pages
  urls.push(`${base}/`)        // home
  urls.push(`${base}/search`)  // search (optional; remove if you don't want it)

  // Books + chapters from bundled bible.json
  const books: any[] = (bible as any).books ?? []
  for (const b of books) {
    urls.push(`${base}/book/${b.bnumber}`)
    for (const ch of b.chapters ?? []) {
      urls.push(`${base}/book/${b.bnumber}/chapter/${ch.cnumber}`)
    }
  }
  return urls
}

export default function InstallFAB() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  // progress UI
  const [status, setStatus] = useState<'idle'|'precaching'|'ready'|'installing'|'done'>('idle')
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)

  // same-origin base; no need to hardcode domain
  const base = ''
  const allUrls = useMemo(() => buildAllUrls(base), [])

  useEffect(() => {
    // If already running as an installed app, never show
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // iOS Safari standalone detection
      // @ts-ignore
      (navigator.standalone === true)

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

  // Only show the FAB when installable and not installed
  if (installed || !deferred) return null

  async function preCacheAll() {
    setStatus('precaching')
    setDone(0)
    setTotal(allUrls.length)

    for (const url of allUrls) {
      try {
        // Go through SW and refresh its cache entries
        await fetch(url, { cache: 'reload' })
      } catch {
        // ignore individual failures; continue
      } finally {
        setDone((d) => d + 1)
        // small yield so UI can update on low-end devices
        await new Promise((r) => setTimeout(r, 5))
      }
    }

    setStatus('ready')
  }

  const clickInstall = async () => {
    try {
      // 1) Pre-cache everything so app is fully usable offline
      await preCacheAll()

      // 2) Trigger install prompt
      if (deferred) {
        setStatus('installing')
        await deferred.prompt()
        await deferred.userChoice
        // event can’t be reused; hide the button either way
        setDeferred(null)
        setStatus('done')
      }
    } catch {
      // If something odd happens, just hide progress and leave button off
      setStatus('idle')
    }
  }

  return (
    <>
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

      {/* Tiny progress toast while we pre-cache */}
      {(status === 'precaching' || status === 'installing') && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm card">
          <div className="font-medium mb-2">
            {status === 'precaching' ? 'ఆఫ్లైన్ కోసం పేజీలు డౌన్‌లోడ్ అవుతున్నాయి…' : 'ఇన్‌స్టాల్ అవుతోంది…'}
          </div>
          {status === 'precaching' && (
            <>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-2 bg-black dark:bg-white transition-all"
                  style={{ width: `${(done / Math.max(total, 1)) * 100}%` }}
                />
              </div>
              <div className="text-xs opacity-70 mt-1">{done} / {total}</div>
            </>
          )}
        </div>
      )}
    </>
  )
}
