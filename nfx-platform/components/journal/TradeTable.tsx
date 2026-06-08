'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

function calcTotalRR(trade: Trade): number | null {
  const base = trade.risk_reward
  if (base === null || base === undefined) return null
  const children = trade.children ?? []
  if (children.length === 0) return base
  return base + children.reduce((sum, c) => sum + (c.risk_factor ?? 1) * (c.risk_reward ?? 0), 0)
}

interface RowProps {
  trade: Trade
  onEdit: () => void
  onDelete: () => void
  onEditChild: (child: Trade) => void
}

function TradeRow({ trade, onEdit, onDelete, onEditChild }: RowProps) {
  const { fmt } = useDateFormat()
  const [hovered, setHovered] = useState(false)

  const children    = trade.children ?? []
  const hasChildren = children.length > 0
  const accounts    = trade.trade_accounts?.map((ta) => ta.accounts?.account_name).filter(Boolean) ?? []
  const confluences = trade.trade_confluences?.map((tc) => tc.confluences!).filter(Boolean) ?? []
  const result      = trade.result ?? 'pending'
  const pnl         = trade.pnl
  const totalRR     = calcTotalRR(trade)

  return (
    <motion.div
      variants={staggerItem}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
              {hasChildren && (
                <span className="rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {children.length + 1}L
                </span>
              )}
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
            <div className="text-right">
              {pnl != null ? (
                <p className={cn('text-base font-bold tabular-nums', pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/40">No P&L</p>
              )}
              {totalRR !== null && (
                <p className="text-[11px] text-muted-foreground/50">
                  {hasChildren && <span className="mr-0.5 text-primary/60">Σ</span>}
                  {totalRR.toFixed(2)}R
                </p>
              )}
            </div>

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

      {/* Leg breakdown — expands in flow so cards below are pushed down */}
      <AnimatePresence initial={false}>
        {hovered && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.12 } }}
            className="overflow-hidden"
          >
            <div
              className="mt-1 overflow-hidden rounded-xl border"
              style={{ background: 'rgba(13,13,13,0.98)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              {/* Header */}
              <div
                className="grid grid-cols-3 gap-4 px-4 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">Leg</span>
                <span className="text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">Risk</span>
                <span className="text-right text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">R:R</span>
              </div>

              {/* Parent (initial entry) */}
              <div
                className="grid cursor-pointer grid-cols-3 gap-4 px-4 py-2.5 transition-colors duration-100 hover:bg-white/[0.03]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onClick={onEdit}
              >
                <span className="text-xs font-medium text-muted-foreground">{trade.trade_type ?? 'Initial'}</span>
                <span className="text-center font-mono text-xs text-muted-foreground/60">1.00×</span>
                <span className="text-right font-mono text-xs">
                  {trade.risk_reward !== null ? `${Number(trade.risk_reward).toFixed(2)}R` : '—'}
                </span>
              </div>

              {/* Child legs */}
              {children.map((child, i) => (
                <div
                  key={child.id}
                  className="grid cursor-pointer grid-cols-3 gap-4 px-4 py-2.5 transition-colors duration-100 hover:bg-white/[0.03]"
                  style={{ borderBottom: i < children.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                  onClick={() => onEditChild(child)}
                >
                  <span className="text-xs font-medium capitalize text-muted-foreground">
                    {child.leg_type ?? child.trade_type ?? 'Leg'}
                  </span>
                  <span className="text-center font-mono text-xs text-muted-foreground/60">
                    {(child.risk_factor ?? 1).toFixed(2)}×
                  </span>
                  <span className="text-right font-mono text-xs">
                    {child.risk_reward !== null ? `${Number(child.risk_reward).toFixed(2)}R` : '—'}
                  </span>
                </div>
              ))}

              {/* Total row */}
              <div
                className="grid grid-cols-3 gap-4 px-4 py-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)' }}
              >
                <span className="text-xs font-semibold">Total</span>
                <span />
                <span className="text-right font-mono text-sm font-bold text-primary">
                  {totalRR !== null ? `${totalRR.toFixed(2)}R` : '—'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          onEditChild={(child) => onRowClick(child)}
        />
      ))}
    </motion.div>
  )
}
