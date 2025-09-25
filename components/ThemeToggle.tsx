'use client'
import { useEffect, useState } from 'react'

const THEMES = ['light', 'dark', 'rain'] as const
type ThemeName = (typeof THEMES)[number]

const THEME_ICONS: Record<ThemeName, string> = {
  light: '☀️',
  dark: '🌙',
  rain: '💧',
}

function isTheme(value: string | null): value is ThemeName {
  return value !== null && (THEMES as readonly string[]).includes(value)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>('light')

  const applyTheme = (next: ThemeName, persist = true) => {
    setTheme(next)
    if (persist && typeof window !== 'undefined') {
      localStorage.setItem('theme', next)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('theme')
    const initial: ThemeName = isTheme(saved) ? saved : 'light'
    applyTheme(initial, false)
  }, [])

  const toggle = () => {
    const currentIndex = THEMES.indexOf(theme)
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length]
    applyTheme(nextTheme)
  }

  return (
    <button
      onClick={toggle}
      className="btn"
      aria-label={`Theme toggle (current: ${theme})`}
      title="Switch theme"
    >
      {THEME_ICONS[theme]}
    </button>
  )
}
