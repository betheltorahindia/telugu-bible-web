'use client'

import { useEffect, useState } from 'react'

export default function LaunchAnimation() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => setVisible(false), reducedMotion ? 500 : 4100)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="launch-screen">
      <div className="launch-sky" aria-hidden="true">
        <span className="launch-light-beam" />
        <span className="launch-cloud launch-cloud-one" />
        <span className="launch-cloud launch-cloud-two" />
        <span className="launch-cloud launch-cloud-three" />
        <div className="launch-gate">
          <span className="launch-gate-inner" />
          <span className="launch-gate-light" />
          <span className="launch-gate-glow" />
        </div>
        <div className="launch-stairway">
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              style={{ animationDelay: `${index * 85}ms`, width: `${25 + index * 10}%` }}
            />
          ))}
        </div>
      </div>
      <div className="launch-wordmark">
        <span className="launch-title" aria-label="BETHEL TORAH INDIA" role="status">
          {'BETHEL TORAH INDIA'.split('').map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="launch-title-letter"
              style={{ animationDelay: `${380 + index * 48}ms` }}
              aria-hidden="true"
            >
              {letter === ' ' ? '\u00a0' : letter}
            </span>
          ))}
        </span>
        <span className="launch-tagline">Direct way to Shamayim</span>
      </div>
      <span className="launch-progress" aria-hidden="true"><span /></span>
    </div>
  )
}
