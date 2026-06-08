'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const THEME_KEY  = 'nfx-theme'
const ACCENT_KEY = 'nfx-accent'

export const DEFAULT_ACCENT = '#39FF14'

export const ACCENT_PRESETS = [
  { label: 'Neon Green',    value: '#39FF14' },
  { label: 'Electric Blue', value: '#00d2ff' },
  { label: 'Purple',        value: '#a855f7' },
  { label: 'Rose',          value: '#f43f5e' },
  { label: 'Amber',         value: '#f59e0b' },
  { label: 'Cyan',          value: '#06b6d4' },
]

interface ThemeCtx {
  theme:     Theme
  setTheme:  (t: Theme) => void
  accent:    string
  setAccent: (c: string) => void
}

const Ctx = createContext<ThemeCtx>({
  theme:     'dark',
  setTheme:  () => {},
  accent:    DEFAULT_ACCENT,
  setAccent: () => {},
})

function applyAccent(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const root = document.documentElement
  root.style.setProperty('--primary',      hex)
  root.style.setProperty('--neon-green',   hex)
  root.style.setProperty('--ring',         hex)
  root.style.setProperty('--primary-glow', `rgba(${r},${g},${b},0.15)`)
  root.style.setProperty('--neon-glow',    `0 0 15px rgba(${r},${g},${b},0.10), 0 0 30px rgba(${r},${g},${b},0.04)`)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme,  setThemeState]  = useState<Theme>('dark')
  const [accent, setAccentState] = useState(DEFAULT_ACCENT)

  useEffect(() => {
    const t = localStorage.getItem(THEME_KEY) as Theme | null
    const a = localStorage.getItem(ACCENT_KEY)
    if (t === 'dark' || t === 'light') setThemeState(t)
    if (a) setAccentState(a)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    applyAccent(accent)
  }, [accent])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem(THEME_KEY, t)
  }

  function setAccent(c: string) {
    setAccentState(c)
    localStorage.setItem(ACCENT_KEY, c)
  }

  return (
    <Ctx.Provider value={{ theme, setTheme, accent, setAccent }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTheme() {
  return useContext(Ctx)
}
