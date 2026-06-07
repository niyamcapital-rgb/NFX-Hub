'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, MinusCircle, Clock, GitBranch } from 'lucide-react'
import { cardHover } from '@/lib/motion'
import { calcCumulativeRR, calcTotalRisk } from '@/lib/scale-in'
import { cn } from '@/lib/utils'
import type { Trade } from '@/types/database'

interface Props {
  trade: Trade
  onClick: (trade: Trade) => void
}

const RESULT_STYLES = {
  win:       { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', shadow: 'hover:shadow-emerald-500/[0.08]' },
  loss:      { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     shadow: 'hover:shadow-red-500/[0.08]' },
  breakeven: { bg: 'bg-zinc-500/10',    text: 'text-zinc-400',    border: 'border-zinc-500/20',    shadow: '' },
  pending:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   shadow: '' },
} as const

const ResultIcon = ({ result }: { result: string | null }) => {
  if (result === 'win')       return <CheckCircle className="h-3.5 w-3.5" />
  if (result === 'loss')      return <XCircle className="h-3.5 w-3.5" />
  if (result === 'breakeven') return <MinusCircle className="h-3.5 w-3.5" />
  return <Clock className="h-3.5 w-3.5" />
}

export function TradeCard({ trade, onClick }: Props) {
  const confluences  = trade.trade_confluences?.map((tc) => tc.confluences!).filter(Boolean) ?? []
  const hasChart     = trade.entry_chart_url || trade.dxy_chart_url
  const rs           = RESULT_STYLES[(trade.result ?? 'pending') as keyof typeof RESULT_STYLES] ?? RESULT_STYLES.pending
  const legs         = trade.trade_legs ?? []
  const isScaleIn    = trade.scale_in_enabled && legs.length > 0
  const cumRR        = isScaleIn ? calcCumulativeRR(trade.risk_reward, legs) : null
  const totalRisk    = isScaleIn ? calcTotalRisk(legs) : null   // 1.0 + Σrisk_factor
  const displayRR    = cumRR ?? trade.risk_reward

  return (
    <motion.div {...cardHover} onClick={() => onClick(trade)} className="cursor-pointer">
      <div
        className={cn(
          'overflow-hidden rounded-xl border transition-shadow duration-300',
          'bg-[rgba(1,9,22,0.8)] backdrop-blur-md',
          'hover:shadow-xl hover:shadow-blue-950/60',
          rs.shadow,
        )}
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {/* Chart preview */}
        <div className="relative h-40 w-full overflow-hidden bg-white/[0.03]">
          {hasChart ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trade.entry_chart_url || trade.dxy_chart_url || ''} alt="Chart" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-muted-foreground/40">No chart</span>
            </div>
          )}

          {/* Result pill */}
          <div className={cn('absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border px-2 py-0.5', rs.bg, rs.text, rs.border)}>
            <ResultIcon result={trade.result} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">{trade.result ?? 'pending'}</span>
          </div>

          {/* Scale-in badge */}
          {trade.scale_in_enabled && legs.length > 0 && (
            <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5">
              <GitBranch className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary">{legs.length}L</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">{trade.symbol}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{trade.open_date}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {displayRR !== null && displayRR !== undefined && (
                <div className="flex items-center gap-1.5">
                  {cumRR !== null && (
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">Total RR</span>
                  )}
                  <span className="font-mono text-sm font-semibold tabular-nums">{Number(displayRR).toFixed(2)}R</span>
                </div>
              )}
              {totalRisk !== null && (
                <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">Risk</span>
                  <span className="font-mono text-[10px] font-semibold tabular-nums text-amber-400/80">{totalRisk.toFixed(2)}×</span>
                </div>
              )}
              {trade.trade_type && (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {trade.trade_type}
                </span>
              )}
            </div>
          </div>

          {confluences.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {confluences.slice(0, 3).map((c) => (
                <span
                  key={c!.id}
                  className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: `${c!.color}18`, color: c!.color, border: `1px solid ${c!.color}33` }}
                >
                  {c!.name}
                </span>
              ))}
              {confluences.length > 3 && (
                <span className="inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{confluences.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
