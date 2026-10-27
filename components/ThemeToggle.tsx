'use client'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const THEMES = ['dark', 'light'] as const
type ThemeName = (typeof THEMES)[number]

function isTheme(value: string | null): value is ThemeName {
  return value !== null && (THEMES as readonly string[]).includes(value)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>('light')

  const applyTheme = (next: ThemeName, persist = true) => {
    setTheme(next)
    if (persist && typeof window !== 'undefined') {
      localStorage.setItem('theme-v2', next)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('theme-v2')
    const initial: ThemeName = isTheme(saved) ? saved : 'light'
    applyTheme(initial, false)
  }, [])

  const toggle = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
    </button>
  )
}
