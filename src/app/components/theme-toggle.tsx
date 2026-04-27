'use client'

import { useEffect, useState } from 'react'

type ThemeMode = 'hacker' | 'literary'

const THEME_STORAGE_KEY = 'blog-theme-mode'

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('hacker')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    const nextTheme = saved === 'literary' ? 'literary' : 'hacker'
    setTheme(nextTheme)
    applyTheme(nextTheme)
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'hacker' ? 'literary' : 'hacker'
    setTheme(nextTheme)
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    applyTheme(nextTheme)
  }

  const currentThemeLabel = theme === 'hacker' ? '黑客风' : '文艺风'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="切换主题"
      title={mounted ? `当前主题：${currentThemeLabel}` : '切换主题'}
    >
      <span className="theme-toggle__icon">{mounted && theme === 'hacker' ? '>_' : '✦'}</span>
      <span className="theme-toggle__label">{mounted ? currentThemeLabel : '主题切换'}</span>
    </button>
  )
}
