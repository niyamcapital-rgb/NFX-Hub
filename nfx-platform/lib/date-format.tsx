'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type DateFormat = 'YMD' | 'MDY' | 'DMY'

const STORAGE_KEY = 'nfx-date-format'
const DEFAULT: DateFormat = 'YMD'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/** Format a YYYY-MM-DD string without any timezone shifting. */
export function formatDate(dateStr: string | null | undefined, fmt: DateFormat): string {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [y, m, d] = parts
  const monthName = MONTHS[(parseInt(m, 10) - 1)] ?? m
  if (fmt === 'YMD') return `${y}/${m}/${d}`
  if (fmt === 'DMY') return `${d}/${m}/${y}`
  return `${m}/${d}/${y}`
}

/** Format a week range (YYYY-MM-DD start → +6 days), no timezone shift. */
export function formatWeekRange(weekStart: string, fmt: DateFormat): string {
  const parts = weekStart.split('-')
  if (parts.length !== 3) return weekStart
  const [y, m, d] = parts.map(Number)
  const start = new Date(y, m - 1, d)
  const end   = new Date(y, m - 1, d + 6)
  const fmtDay = (dt: Date) => {
    const dy = dt.getFullYear()
    const dm = String(dt.getMonth() + 1).padStart(2, '0')
    const dd = String(dt.getDate()).padStart(2, '0')
    return formatDate(`${dy}-${dm}-${dd}`, fmt)
  }
  return `${fmtDay(start)} – ${fmtDay(end)}`
}

// ── Context ────────────────────────────────────────────────────────────────

interface DateFormatCtx {
  format:    DateFormat
  setFormat: (f: DateFormat) => void
  fmt:       (dateStr: string | null | undefined) => string
  fmtWeek:   (weekStart: string) => string
}

const Ctx = createContext<DateFormatCtx>({
  format:    DEFAULT,
  setFormat: () => {},
  fmt:       (d) => formatDate(d, DEFAULT),
  fmtWeek:   (w) => formatWeekRange(w, DEFAULT),
})

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
  const [format, setFormatState] = useState<DateFormat>(DEFAULT)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as DateFormat | null
    if (stored === 'YMD' || stored === 'MDY') setFormatState(stored)
  }, [])

  function setFormat(f: DateFormat) {
    setFormatState(f)
    localStorage.setItem(STORAGE_KEY, f)
  }

  return (
    <Ctx.Provider value={{
      format,
      setFormat,
      fmt:     (d) => formatDate(d, format),
      fmtWeek: (w) => formatWeekRange(w, format),
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useDateFormat() {
  return useContext(Ctx)
}
