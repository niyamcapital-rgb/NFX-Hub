'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { cardHover } from '@/lib/motion'
import { buildEquityCurve } from '@/lib/equity-curve'
import type { Account, Trade } from '@/types/database'

interface Props {
  account: Account
  trades: Trade[]
  onClick: (account: Account) => void
}

const statusColor: Record<string, string> = {
  active: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  passed: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
  blown:  'text-red-400 border-red-500/20 bg-red-500/10',
  paused: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10',
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtPct(v: number) {
  const sign = v > 0 ? '+' : ''
  return `${sign}${Math.abs(v) % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { date: string; pct: number } }>
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const { date, pct } = payload[0].payload
  return (
    <div
      style={{
        background: '#010916',
        border: '1px solid #0a1b2e',
        borderRadius: 6,
        padding: '5px 9px',
        fontSize: 11,
      }}
    >
      <p style={{ color: '#8a8f9c', marginBottom: 2 }}>{fmtDate(date)}</p>
      <p style={{ color: pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
        {fmtPct(pct)}
      </p>
    </div>
  )
}

export function AccountCard({ account, trades, onClick }: Props) {
  const curve = useMemo(() => buildEquityCurve(account, trades), [account, trades])

  // Starting balance = current_balance if set (account state when tracking began),
  // otherwise fall back to the purchased account size.
  const startingBalance = account.current_balance ?? account.starting_balance

  // Current balance = last computed equity curve point — auto-updates as trades are logged.
  const computedBalance = curve.at(-1)?.balance ?? startingBalance

  // ── Reference lines — % of account size (stored values, always relative to 0%) ──
  const ptRef    =  account.profit_target_pct   // e.g. +10
  const maxDdRef = -account.max_drawdown_pct    // e.g. -5

  // ── Progress bars ──────────────────────────────────────────────────────
  const accountSize   = account.starting_balance
  const targetAmt     = accountSize * (1 + account.profit_target_pct / 100)
  const maxDDFloorAmt = accountSize * (1 - account.max_drawdown_pct / 100)

  const progress = Math.min(100, Math.max(0,
    ((computedBalance - startingBalance) / (targetAmt - startingBalance)) * 100,
  ))
  const ddUsed = Math.min(100, Math.max(0,
    ((startingBalance - computedBalance) / (startingBalance - maxDDFloorAmt)) * 100,
  ))
  const dailyDDLabel = account.daily_loss_limit_pct ? `${account.daily_loss_limit_pct}%` : '—'

  // ── Curve as % from account size (0% = account size, always) ──────────
  const curvePct = useMemo(
    () =>
      curve.map((p) => ({
        date: p.date,
        pct: parseFloat((((p.balance - accountSize) / accountSize) * 100).toFixed(3)),
      })),
    [curve, accountSize],
  )

  const finalPct = curvePct.at(-1)?.pct ?? 0
  const isUp     = finalPct >= 0

  // Domain always shows both reference lines regardless of actual curve range
  const allPcts = curvePct.map((p) => p.pct)
  const yMin = Math.min(maxDdRef, ...allPcts)
  const yMax = Math.max(ptRef,    ...allPcts)
  const yPad = Math.max((yMax - yMin) * 0.12, 0.5)
  const domain: [number, number] = [yMin - yPad, yMax + yPad]

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
                {account.grp   && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Grp {account.grp}</Badge>}
              </div>
            )}
          </div>
        </div>

        {/* Computed current balance — auto-updates from logged trades */}
        <p className="mb-3 text-2xl font-semibold tracking-tight">
          ${computedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        {/* ── Equity curve ─────────────────────────────────────────────── */}
        <div className="mb-4 h-[110px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart data={curvePct} margin={{ top: 6, right: 6, left: 0, bottom: 4 }}>

              <XAxis dataKey="date" hide />

              <YAxis
                domain={domain}
                ticks={[maxDdRef, 0, ptRef]}
                tickFormatter={fmtPct}
                tick={{ fontSize: 9, fill: '#8a8f9c' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />

              {/* Profit target — always visible */}
              <ReferenceLine
                y={ptRef}
                stroke="#10b981"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{
                  value: `Target ${fmtPct(ptRef)}`,
                  position: 'insideTopRight',
                  fill: '#10b981',
                  fontSize: 8,
                  fontWeight: 600,
                }}
              />

              {/* Max drawdown floor — always visible */}
              <ReferenceLine
                y={maxDdRef}
                stroke="#ef4444"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{
                  value: `Max DD ${fmtPct(maxDdRef)}`,
                  position: 'insideBottomRight',
                  fill: '#ef4444',
                  fontSize: 8,
                  fontWeight: 600,
                }}
              />

              {/* Starting balance baseline */}
              <ReferenceLine
                y={0}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="3 3"
                strokeWidth={1}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />

              <Area
                type="stepAfter"
                dataKey="pct"
                stroke={isUp ? '#10b981' : '#ef4444'}
                strokeWidth={1.5}
                fill={isUp ? '#10b981' : '#ef4444'}
                fillOpacity={0.08}
                dot={false}
                activeDot={{ r: 3, fill: isUp ? '#10b981' : '#ef4444', strokeWidth: 0 }}
                isAnimationActive
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-secondary/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Target Progress</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%`, transition: 'width 0.6s ease' }}
              />
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
