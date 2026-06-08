'use client'

import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useDateFormat } from '@/lib/date-format'
import type { Trade } from '@/types/database'

interface Props {
  trades: Trade[]
  onRowClick: (trade: Trade) => void
  onDelete: (trade: Trade) => void
}

const RESULT_ACCENT: Record<string, string> = {
  win:       'bg-emerald-500',
  loss:      'bg-red-500',
  breakeven: 'bg-zinc-500',
  pending:   'bg-amber-400',
}

const RESULT_CHIP: Record<string, string> = {
  win:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  loss:      'bg-red-500/15 text-red-400 border-red-500/25',
  breakeven: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
}

const RESULT_LABEL: Record<string, string> = {
  win:       'Win',
  loss:      'Loss',
  breakeven: 'B/E',
  pending:   'Pending',
}

interface RowProps {
  trade: Trade
  onEdit: () => void
  onDelete: () => void
}

function TradeRow({ trade, onEdit, onDelete }: RowProps) {
  const { fmt } = useDateFormat()

  const accounts    = trade.trade_accounts?.map((ta) => ta.accounts?.account_name).filter(Boolean) ?? []
  const confluences = trade.trade_confluences?.map((tc) => tc.confluences!).filter(Boolean) ?? []
  const result      = trade.result ?? 'pending'
  const pnl         = trade.pnl

  return (
    <motion.div variants={staggerItem}>
      <div
        className="flex cursor-pointer items-stretch overflow-hidden rounded-xl border border-border/50 bg-card transition-colors duration-150 hover:border-border"
        onClick={onEdit}
      >
        {/* Left result accent bar */}
        <div className={cn('w-[3px] shrink-0', RESULT_ACCENT[result] ?? 'bg-zinc-500')} />

        {/* Row content */}
        <div className="flex flex-1 items-center gap-4 py-3.5 pl-4 pr-4 min-w-0">

          {/* Left: symbol + chips + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold tracking-tight">{trade.symbol}</p>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {trade.trade_type && (
                <span className="rounded border border-border/50 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {trade.trade_type}
                </span>
              )}
              <span className={cn('rounded border px-2 py-0.5 text-[10px] font-semibold', RESULT_CHIP[result] ?? RESULT_CHIP.pending)}>
                {RESULT_LABEL[result] ?? 'Pending'}
              </span>
              {confluences.slice(0, 4).map((c) => (
                <span
                  key={c!.id}
                  className="rounded border px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: `${c!.color}18`, color: c!.color, borderColor: `${c!.color}35` }}
                >
                  {c!.name}
                </span>
              ))}
              {confluences.length > 4 && (
                <span className="text-[10px] text-muted-foreground/50">+{confluences.length - 4}</span>
              )}
            </div>

            <p className="mt-1.5 text-[11px] text-muted-foreground/60">
              {fmt(trade.open_date)}
              {accounts.length > 0 && <> · {accounts.join(', ')}</>}
            </p>
          </div>

          {/* Right: P&L + RR + actions */}
          <div className="flex shrink-0 items-center gap-3">
            {/* P&L and R:R */}
            <div className="text-right">
              {pnl != null ? (
                <p className={cn('text-base font-bold tabular-nums', pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/40">No P&L</p>
              )}
              {trade.risk_reward != null && (
                <p className="text-[11px] text-muted-foreground/50">R:R {Number(trade.risk_reward).toFixed(2)}</p>
              )}
            </div>

            {/* Action icons — stop propagation so they don't open edit */}
            <div
              className="flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onEdit}
                className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function TradeTable({ trades, onRowClick, onDelete }: Props) {
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-20 text-center">
        <p className="text-sm font-medium text-muted-foreground">No trades found</p>
        <p className="mt-1 text-xs text-muted-foreground/60">Log your first trade using the button above</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-2"
    >
      {trades.map((t) => (
        <TradeRow
          key={t.id}
          trade={t}
          onEdit={() => onRowClick(t)}
          onDelete={() => onDelete(t)}
        />
      ))}
    </motion.div>
  )
}
