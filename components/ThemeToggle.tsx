'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark';
    setDark(saved);
    document.documentElement.setAttribute('data-theme', saved ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    }
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  return (
    <button onClick={toggle} className="btn" aria-label="Theme toggle">
      {dark ? '🌙' : '☀️'}
    </button>
  )
}
