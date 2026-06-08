'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Target, BarChart2, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { staggerContainer, staggerItem } from '@/lib/motion'
import type { Trade } from '@/types/database'

interface Props { trades: Trade[] }

export function MetricsStrip({ trades }: Props) {
  const completed   = trades.filter((t) => t.result && t.result !== 'pending')
  const wins        = completed.filter((t) => t.result === 'win')
  const winRate     = completed.length ? Math.round((wins.length / completed.length) * 100) : 0
  const avgRR       = completed.length
    ? (completed.reduce((s, t) => s + (t.risk_reward ?? 0), 0) / completed.length).toFixed(2)
    : '0.00'
  // Wins add their R:R, losses subtract 1R, breakevens add 0
  const totalRR = completed.reduce((s, t) => {
    if (t.result === 'win')  return s + (t.risk_reward ?? 0)
    if (t.result === 'loss') return s - 1
    return s
  }, 0)
  const totalRRStr = (totalRR >= 0 ? '+' : '') + totalRR.toFixed(2) + 'R'

  const metrics = [
    { label: 'Total Trades',    value: trades.length.toString(),  sub: `${completed.length} completed`,  icon: BarChart2,  color: 'text-blue-400',    accent: 'rgba(59,130,246,0.7)' },
    { label: 'Win Rate',        value: `${winRate}%`,             sub: `${wins.length} wins`,             icon: Target,     color: 'text-emerald-400', accent: 'rgba(16,185,129,0.7)' },
    { label: 'Avg Risk:Reward', value: `${avgRR}R`,               sub: 'across settled trades',           icon: TrendingUp, color: 'text-amber-400',   accent: 'rgba(245,158,11,0.7)' },
    {
      label: 'Total R:R',
      value: totalRRStr,
      sub: 'wins add R:R · losses subtract 1R',
      icon: Zap,
      color: totalRR >= 0 ? 'text-emerald-400' : 'text-red-400',
      accent: totalRR >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)',
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 gap-5 lg:grid-cols-4"
    >
      {metrics.map((m) => (
        <motion.div key={m.label} variants={staggerItem}>
          <Card className="relative overflow-hidden border-border/40">
            {/* Colored top accent line */}
            <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: m.accent }} />

            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {m.label}
              </CardTitle>
              <div className={`rounded-md p-1.5 ${m.color} bg-white/5`}>
                <m.icon className="h-3.5 w-3.5" />
              </div>
            </CardHeader>

            <CardContent className="pb-5">
              <span className="text-[1.6rem] font-semibold leading-none tracking-tight">{m.value}</span>
              <p className="mt-1.5 text-[11px] text-muted-foreground/60">{m.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
