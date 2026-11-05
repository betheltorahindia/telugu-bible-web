'use client'

import { useEffect, useState } from 'react'
import { MaskoPlayer } from '@masko/player/react'

const clip = { webm: '/ezra-wave.webm', hevc: '/ezra-wave.mov' }

export default function EzraMascot({ className = '' }: { className?: string }) {
  const [autoPlay, setAutoPlay] = useState(() =>
    typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setAutoPlay(!motionPreference.matches)
    updateMotionPreference()
    motionPreference.addEventListener('change', updateMotionPreference)
    return () => motionPreference.removeEventListener('change', updateMotionPreference)
  }, [])

  return (
    <span className={`ezra-mascot ${className}`} aria-hidden="true">
      <img className="ezra-mascot-fallback" src="/ezra.png" alt="" />
      <MaskoPlayer
        className="ezra-mascot-player"
        clip={clip}
        autoPlay={autoPlay}
        sound={false}
      />
    </span>
  )
}
