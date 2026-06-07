'use client'

import { CheckCircle, XCircle, MinusCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Trade } from '@/types/database'

interface Props {
  trades: Trade[]
  onRowClick: (trade: Trade) => void
}

export function TradeTable({ trades, onRowClick }: Props) {
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-20 text-center">
        <p className="text-sm font-medium text-muted-foreground">No trades found</p>
        <p className="mt-1 text-xs text-muted-foreground">Log your first trade using the button above</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-secondary/30">
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Date</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Symbol</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Account(s)</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Type</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">R:R</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Result</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Confluences</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => {
            const accounts    = t.trade_accounts?.map((ta) => ta.accounts?.account_name).filter(Boolean) ?? []
            const confluences = t.trade_confluences?.map((tc) => tc.confluences!).filter(Boolean) ?? []

            return (
              <tr
                key={t.id}
                onClick={() => onRowClick(t)}
                className="cursor-pointer border-b border-border/30 transition-colors hover:bg-secondary/30 last:border-b-0"
              >
                <td className="px-4 py-3 text-muted-foreground">{t.open_date}</td>
                <td className="px-4 py-3 font-medium">{t.symbol}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{accounts.join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  {t.trade_type ? <Badge variant="secondary" className="text-[10px]">{t.trade_type}</Badge> : '—'}
                </td>
                <td className="px-4 py-3">{t.risk_reward ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {t.result === 'win'       && <><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400 font-medium">Win</span></>}
                    {t.result === 'loss'      && <><XCircle className="h-3.5 w-3.5 text-red-400" /><span className="text-red-400 font-medium">Loss</span></>}
                    {t.result === 'breakeven' && <><MinusCircle className="h-3.5 w-3.5 text-zinc-400" /><span className="text-zinc-400 font-medium">B/E</span></>}
                    {(!t.result || t.result === 'pending') && <><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Pending</span></>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {confluences.slice(0, 2).map((c) => (
                      <span
                        key={c!.id}
                        className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: `${c!.color}22`, color: c!.color, border: `1px solid ${c!.color}44` }}
                      >
                        {c!.name}
                      </span>
                    ))}
                    {confluences.length > 2 && <span className="text-[10px] text-muted-foreground">+{confluences.length - 2}</span>}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
