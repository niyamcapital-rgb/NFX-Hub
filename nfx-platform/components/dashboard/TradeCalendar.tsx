'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { staggerContainer, staggerItem } from '@/lib/motion'
import type { Trade } from '@/types/database'

interface Props {
  trades: Trade[]
  onDayClick?: (date: string) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function TradeCalendar({ trades, onDayClick }: Props) {
  const [offset, setOffset] = useState(0) // months from today

  const { year, month, weeks } = useMemo(() => {
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const yr = target.getFullYear()
    const mo = target.getMonth()

    // Map trades by date string
    const byDate: Record<string, Trade[]> = {}
    trades.forEach((t) => {
      const key = t.open_date
      if (!byDate[key]) byDate[key] = []
      byDate[key].push(t)
    })

    const firstDay   = new Date(yr, mo, 1).getDay()
    const daysInMonth = new Date(yr, mo + 1, 0).getDate()

    const cells: Array<{ date: number | null; iso: string | null; result: string | null; rr: number | null }> = []

    for (let i = 0; i < firstDay; i++) cells.push({ date: null, iso: null, result: null, rr: null })
    for (let d = 1; d <= daysInMonth; d++) {
      const iso  = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const day  = byDate[iso] ?? []
      const wins = day.filter((t) => t.result === 'win').length
      const losses = day.filter((t) => t.result === 'loss').length
      const be   = day.filter((t) => t.result === 'breakeven').length
      const avgRR = day.length ? day.reduce((s, t) => s + (t.risk_reward ?? 0), 0) / day.length : null

      let result: string | null = null
      if (day.length) result = wins > losses ? 'win' : losses > wins ? 'loss' : be > 0 ? 'be' : 'mixed'

      cells.push({ date: d, iso, result, rr: avgRR })
    }

    const rows: typeof cells[] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

    return { year: yr, month: mo, weeks: rows }
  }, [trades, offset])

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function cellBg(result: string | null) {
    if (!result) return 'bg-secondary/30 hover:bg-secondary/60'
    if (result === 'win')   return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
    if (result === 'loss')  return 'bg-red-500/20 border-red-500/30 text-red-300'
    if (result === 'be')    return 'bg-zinc-500/20 border-zinc-500/30 text-zinc-400'
    return 'bg-blue-500/10 border-blue-500/20 text-blue-300'
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{monthLabel}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOffset((o) => o + 1)} disabled={offset >= 0}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Weeks */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-1">
        {weeks.map((week, wi) => (
          <motion.div key={wi} variants={staggerItem} className="grid grid-cols-7 gap-1">
            {week.map((cell, ci) => (
              <button
                key={ci}
                disabled={!cell.date}
                onClick={() => cell.iso && onDayClick?.(cell.iso)}
                className={`relative h-10 rounded-md border text-xs transition-colors ${
                  cell.date ? `${cellBg(cell.result)} cursor-pointer` : 'opacity-0 cursor-default border-transparent'
                }`}
              >
                {cell.date && (
                  <div className="flex flex-col items-center justify-center h-full gap-0.5">
                    <span className="font-medium leading-none">{cell.date}</span>
                    {cell.rr !== null && (
                      <span className="text-[9px] leading-none opacity-70">{cell.rr.toFixed(1)}R</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        ))}
      </motion.div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        {[
          { color: 'bg-emerald-500/20 border-emerald-500/30', label: 'Win' },
          { color: 'bg-red-500/20 border-red-500/30',         label: 'Loss' },
          { color: 'bg-zinc-500/20 border-zinc-500/30',       label: 'B/E' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded border ${color}`} />
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
