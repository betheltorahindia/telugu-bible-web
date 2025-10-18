"use client"

import React, { useEffect, useState } from 'react'
import PresenterBuilder from './PresenterBuilder'

export default function PresenterClientWrapper() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(true)

  useEffect(() => {
    const m = window.matchMedia('(max-width: 640px)')
    const handler = () => setIsMobile(m.matches)
    handler()
    m.addEventListener?.('change', handler)
    return () => m.removeEventListener?.('change', handler)
  }, [])

  // while we don't know the screen size, render nothing to avoid hydration mismatch
  if (isMobile === null) return null

  if (isMobile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {showModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 rounded-md" />
            <div className="relative max-w-lg w-full bg-amber-500 rounded-xl shadow-xl p-6 text-white">
              <button
                aria-label="Close"
                className="absolute top-3 right-3 text-white/90 hover:text-white"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
              <h3 className="text-lg font-semibold">Presenter is for larger screens</h3>
              <p className="mt-2 text-sm opacity-95">
                This feature is designed for larger devices such as desktops and tablets. For the best experience, please open the Presenter on a desktop or tablet device.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-neutral-600">Presenter is not available on small screens.</div>
        )}
      </div>
    )
  }

  return <PresenterBuilder />
}
