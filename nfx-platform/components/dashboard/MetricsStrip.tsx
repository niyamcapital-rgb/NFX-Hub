'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Target, BarChart2, DollarSign } from 'lucide-react'
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
  const totalPnl    = trades.reduce((s, t) => s + (t.pnl ?? 0), 0)

  const metrics = [
    { label: 'Total Trades',   value: trades.length.toString(),  sub: `${completed.length} completed`,  icon: BarChart2,  color: 'text-blue-400' },
    { label: 'Win Rate',       value: `${winRate}%`,             sub: `${wins.length} wins`,             icon: Target,     color: 'text-emerald-400' },
    { label: 'Avg Risk:Reward',value: `${avgRR}R`,               sub: 'across all trades',               icon: TrendingUp, color: 'text-amber-400' },
    { label: 'Total P&L',      value: totalPnl >= 0 ? `+$${totalPnl.toFixed(0)}` : `-$${Math.abs(totalPnl).toFixed(0)}`,
      sub: 'realized',  icon: DollarSign, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {metrics.map((m) => (
        <motion.div key={m.label} variants={staggerItem}>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {m.label}
              </CardTitle>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </CardHeader>
            <CardContent className="pb-4">
              <span className="text-2xl font-semibold tracking-tight">{m.value}</span>
              <p className="mt-0.5 text-xs text-muted-foreground">{m.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
