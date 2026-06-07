'use client'

import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { cardHover } from '@/lib/motion'
import type { Account } from '@/types/database'

interface Props {
  account: Account
  onClick: (account: Account) => void
}

function buildEquityCurve(acc: Account) {
  const start = acc.starting_balance
  const end   = acc.current_balance ?? start
  const pts   = 12
  const diff  = end - start
  return Array.from({ length: pts }, (_, i) => ({
    v: Math.round(start + (diff / (pts - 1)) * i),
  }))
}

const statusColor: Record<string, string> = {
  active:  'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  passed:  'text-blue-400 border-blue-500/20 bg-blue-500/10',
  blown:   'text-red-400 border-red-500/20 bg-red-500/10',
  paused:  'text-zinc-400 border-zinc-500/20 bg-zinc-500/10',
}

export function AccountCard({ account, onClick }: Props) {
  const balance   = account.current_balance ?? account.starting_balance
  const target    = account.starting_balance * (1 + account.profit_target_pct / 100)
  const progress  = Math.min(100, Math.max(0, ((balance - account.starting_balance) / (target - account.starting_balance)) * 100))
  const maxDDLine = account.starting_balance * (1 - account.max_drawdown_pct / 100)
  const ddUsed    = Math.min(100, Math.max(0, ((account.starting_balance - balance) / (account.starting_balance - maxDDLine)) * 100))
  const dailyDDLabel = account.daily_loss_limit_pct ? `${account.daily_loss_limit_pct}%` : '—'

  const curve = buildEquityCurve(account)
  const isUp  = (account.current_balance ?? account.starting_balance) >= account.starting_balance

  return (
    <motion.div {...cardHover} className="cursor-pointer" onClick={() => onClick(account)}>
      <div className="rounded-lg border border-border/50 bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-black/30">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {account.firm_name}
            </p>
            <h3 className="mt-0.5 text-base font-semibold leading-tight">{account.account_name}</h3>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${statusColor[account.status]}`}>
              {account.status}
            </span>
            {(account.phase || account.grp) && (
              <div className="flex gap-1">
                {account.phase && <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{account.phase}</Badge>}
                {account.grp && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Grp {account.grp}</Badge>}
              </div>
            )}
          </div>
        </div>

        {/* Balance */}
        <p className="mb-3 text-2xl font-semibold tracking-tight">
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        {/* Equity curve */}
        <div className="mb-4 h-14 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={isUp ? '#10b981' : '#ef4444'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive
                animationDuration={800}
              />
              <Tooltip
                contentStyle={{ background: '#010916', border: '1px solid #0a1b2e', borderRadius: 6, fontSize: 11 }}
                formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Balance']}
                labelFormatter={() => ''}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-secondary/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Target Progress</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%`, transition: 'width 0.6s ease' }} />
            </div>
            <p className="mt-1 text-xs font-medium">{progress.toFixed(1)}%</p>
          </div>
          <div className="rounded-md bg-secondary/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Max DD Used</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${ddUsed > 70 ? 'bg-red-500' : ddUsed > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${ddUsed}%`, transition: 'width 0.6s ease' }}
              />
            </div>
            <p className="mt-1 text-xs font-medium">{ddUsed.toFixed(1)}%</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Daily loss limit: {dailyDDLabel}</p>
      </div>
    </motion.div>
  )
}
