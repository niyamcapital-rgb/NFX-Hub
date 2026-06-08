'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme           = 'dark' | 'light'
export type RotationMode    = 'conservative' | 'balanced' | 'aggressive'

const THEME_KEY       = 'nfx-theme'
const ACCENT_KEY      = 'nfx-accent'
const ROTATION_KEY    = 'nfx-rotation-enabled'
const ROT_MODE_KEY    = 'nfx-rotation-mode'
const RISK_P1_KEY     = 'nfx-risk-p1'
const RISK_P2_KEY     = 'nfx-risk-p2'
const RISK_LIVE_KEY   = 'nfx-risk-live'
const PROX_KEY        = 'nfx-proximity-threshold'

export const DEFAULT_ACCENT = '#39FF14'

export const ACCENT_PRESETS = [
  { label: 'Neon Green',    value: '#39FF14' },
  { label: 'Electric Blue', value: '#00d2ff' },
  { label: 'Purple',        value: '#a855f7' },
  { label: 'Rose',          value: '#f43f5e' },
  { label: 'Amber',         value: '#f59e0b' },
  { label: 'Cyan',          value: '#06b6d4' },
]

export const ROTATION_MODES: { value: RotationMode; label: string; description: string }[] = [
  { value: 'conservative', label: 'Conservative', description: 'Focus on preservation' },
  { value: 'balanced',     label: 'Balanced',     description: 'Focus on growth' },
  { value: 'aggressive',   label: 'Aggressive',   description: 'Focus on maximum yield' },
]

interface ThemeCtx {
  theme:               Theme
  setTheme:            (t: Theme) => void
  accent:              string
  setAccent:           (c: string) => void
  rotationEnabled:     boolean
  setRotationEnabled:  (v: boolean) => void
  rotationMode:        RotationMode
  setRotationMode:     (m: RotationMode) => void
  riskP1:              number
  setRiskP1:           (v: number) => void
  riskP2:              number
  setRiskP2:           (v: number) => void
  riskLive:            number
  setRiskLive:         (v: number) => void
  proximityThreshold:  number
  setProximityThreshold: (v: number) => void
}

const Ctx = createContext<ThemeCtx>({
  theme:               'dark',
  setTheme:            () => {},
  accent:              DEFAULT_ACCENT,
  setAccent:           () => {},
  rotationEnabled:     false,
  setRotationEnabled:  () => {},
  rotationMode:        'balanced',
  setRotationMode:     () => {},
  riskP1:              0.5,
  setRiskP1:           () => {},
  riskP2:              0.5,
  setRiskP2:           () => {},
  riskLive:            1.0,
  setRiskLive:         () => {},
  proximityThreshold:  10,
  setProximityThreshold: () => {},
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
  const [theme,              setThemeState]             = useState<Theme>('dark')
  const [accent,             setAccentState]            = useState(DEFAULT_ACCENT)
  const [rotationEnabled,    setRotationEnabledState]   = useState(false)
  const [rotationMode,       setRotationModeState]      = useState<RotationMode>('balanced')
  const [riskP1,             setRiskP1State]            = useState(0.5)
  const [riskP2,             setRiskP2State]            = useState(0.5)
  const [riskLive,           setRiskLiveState]          = useState(1.0)
  const [proximityThreshold, setProximityThresholdState] = useState(10)

  useEffect(() => {
    const t   = localStorage.getItem(THEME_KEY) as Theme | null
    const a   = localStorage.getItem(ACCENT_KEY)
    const re  = localStorage.getItem(ROTATION_KEY)
    const rm  = localStorage.getItem(ROT_MODE_KEY) as RotationMode | null
    const r1  = localStorage.getItem(RISK_P1_KEY)
    const r2  = localStorage.getItem(RISK_P2_KEY)
    const rl  = localStorage.getItem(RISK_LIVE_KEY)
    const pt  = localStorage.getItem(PROX_KEY)

    if (t === 'dark' || t === 'light') setThemeState(t)
    if (a)  setAccentState(a)
    if (re) setRotationEnabledState(re === 'true')
    if (rm === 'conservative' || rm === 'balanced' || rm === 'aggressive') setRotationModeState(rm)
    if (r1) { const v = parseFloat(r1); if (!isNaN(v)) setRiskP1State(v) }
    if (r2) { const v = parseFloat(r2); if (!isNaN(v)) setRiskP2State(v) }
    if (rl) { const v = parseFloat(rl); if (!isNaN(v)) setRiskLiveState(v) }
    if (pt) { const v = parseFloat(pt); if (!isNaN(v)) setProximityThresholdState(v) }
  }, [])

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  useEffect(() => { applyAccent(accent) }, [accent])

  function setTheme(t: Theme)            { setThemeState(t);           localStorage.setItem(THEME_KEY, t) }
  function setAccent(c: string)          { setAccentState(c);          localStorage.setItem(ACCENT_KEY, c) }
  function setRotationEnabled(v: boolean){ setRotationEnabledState(v); localStorage.setItem(ROTATION_KEY, String(v)) }
  function setRotationMode(m: RotationMode){ setRotationModeState(m);  localStorage.setItem(ROT_MODE_KEY, m) }
  function setRiskP1(v: number)          { setRiskP1State(v);          localStorage.setItem(RISK_P1_KEY, String(v)) }
  function setRiskP2(v: number)          { setRiskP2State(v);          localStorage.setItem(RISK_P2_KEY, String(v)) }
  function setRiskLive(v: number)        { setRiskLiveState(v);        localStorage.setItem(RISK_LIVE_KEY, String(v)) }
  function setProximityThreshold(v: number){ setProximityThresholdState(v); localStorage.setItem(PROX_KEY, String(v)) }

  return (
    <Ctx.Provider value={{
      theme, setTheme,
      accent, setAccent,
      rotationEnabled, setRotationEnabled,
      rotationMode, setRotationMode,
      riskP1, setRiskP1,
      riskP2, setRiskP2,
      riskLive, setRiskLive,
      proximityThreshold, setProximityThreshold,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTheme() {
  return useContext(Ctx)
}
