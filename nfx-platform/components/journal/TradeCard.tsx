'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, MinusCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cardHover } from '@/lib/motion'
import type { Trade } from '@/types/database'

interface Props {
  trade: Trade
  onClick: (trade: Trade) => void
}

const ResultIcon = ({ result }: { result: string | null }) => {
  if (result === 'win')       return <CheckCircle className="h-4 w-4 text-emerald-400" />
  if (result === 'loss')      return <XCircle className="h-4 w-4 text-red-400" />
  if (result === 'breakeven') return <MinusCircle className="h-4 w-4 text-zinc-400" />
  return <Clock className="h-4 w-4 text-muted-foreground" />
}

export function TradeCard({ trade, onClick }: Props) {
  const confluences = trade.trade_confluences?.map((tc) => tc.confluences!).filter(Boolean) ?? []
  const hasChart = trade.entry_chart_url || trade.dxy_chart_url

  return (
    <motion.div {...cardHover} onClick={() => onClick(trade)} className="cursor-pointer">
      <div className="overflow-hidden rounded-lg border border-border/50 bg-card transition-shadow hover:shadow-lg hover:shadow-black/30">
        {/* Chart preview */}
        <div className="relative h-32 w-full bg-secondary/30">
          {hasChart ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trade.entry_chart_url || trade.dxy_chart_url || ''}
              alt="Chart"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-muted-foreground">No chart uploaded</span>
            </div>
          )}
          <div className="absolute right-2 top-2">
            <ResultIcon result={trade.result} />
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{trade.symbol}</p>
              <p className="text-xs text-muted-foreground">{trade.open_date}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {trade.risk_reward && (
                <span className="text-xs font-medium">{trade.risk_reward}R</span>
              )}
              {trade.trade_type && (
                <Badge variant="secondary" className="text-[10px]">{trade.trade_type}</Badge>
              )}
            </div>
          </div>

          {/* Confluences */}
          {confluences.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {confluences.slice(0, 3).map((c) => (
                <span
                  key={c!.id}
                  className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: `${c!.color}22`, color: c!.color, border: `1px solid ${c!.color}44` }}
                >
                  {c!.name}
                </span>
              ))}
              {confluences.length > 3 && (
                <span className="inline-block rounded px-1.5 py-0.5 text-[10px] text-muted-foreground">
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
