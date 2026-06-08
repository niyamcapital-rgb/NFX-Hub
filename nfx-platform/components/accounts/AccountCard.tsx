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
import { Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cardHover } from '@/lib/motion'
import { buildEquityCurve } from '@/lib/equity-curve'
import { useDateFormat } from '@/lib/date-format'
import { useTheme } from '@/lib/theme'
import type { Account, Trade } from '@/types/database'

interface Props {
  account: Account
  trades: Trade[]
  onClick: (account: Account) => void
}

const statusColor: Record<string, string> = {
  active:   'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  inactive: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10',
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
  const { fmt } = useDateFormat()
  if (!active || !payload?.length) return null
  const { date, pct } = payload[0].payload
  return (
    <div
      style={{
        background: '#0d0d0d',
        border: '1px solid #1c1c1c',
        borderRadius: 6,
        padding: '5px 9px',
        fontSize: 11,
      }}
    >
      <p style={{ color: '#8a8f9c', marginBottom: 2 }}>{fmt(date)}</p>
      <p style={{ color: pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
        {fmtPct(pct)}
      </p>
    </div>
  )
}

export function AccountCard({ account, trades, onClick }: Props) {
  const { proximityThreshold } = useTheme()
  const curve = useMemo(() => buildEquityCurve(account, trades), [account, trades])

  // Starting balance = current_balance if set (account state when tracking began),
  // otherwise fall back to the purchased account size.
  const startingBalance = account.current_balance ?? account.starting_balance

  // Current balance = last computed equity curve point — auto-updates as trades are logged.
  const computedBalance = curve.at(-1)?.balance ?? startingBalance

  // ── Near-pass detection ────────────────────────────────────────────────────
  const targetGain   = account.starting_balance * (account.profit_target_pct / 100)
  const currentGain  = computedBalance - account.starting_balance
  const remaining    = targetGain - currentGain
  const remainingPct = remaining > 0 ? (remaining / account.starting_balance) * 100 : 0
  const isNearPass   = account.status === 'active' && remaining > 0 && remainingPct <= proximityThreshold

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

  // Gradient with userSpaceOnUse so coordinates are absolute SVG pixels.
  // This avoids the objectBoundingBox problem where the gradient is relative
  // to the path's bounding box (actual data range) rather than the domain.
  // Chart container = h-[110px], margin top=6 bottom=4 → plot y: 6..106.
  const PLOT_TOP    = 6
  const PLOT_BOTTOM = 106
  const zeroFromTop = Math.max(0, Math.min(1, domain[1] / (domain[1] - domain[0])))
  const zeroOffset  = `${(zeroFromTop * 100).toFixed(3)}%`
  const gradId      = `acct-${account.id.replace(/-/g, '').slice(0, 12)}`

  return (
    <motion.div
      {...cardHover}
      inherit={false}
      className="cursor-pointer"
      onClick={() => onClick(account)}
    >
      <div
        className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 glow-green"
      >

        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {account.firm_name}
            </p>
            <h3 className="mt-0.5 text-base font-semibold leading-tight">{account.account_name}</h3>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1">
              {isNearPass && (
                <span className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  <Target className="h-2.5 w-2.5" />
                  Close to passing
                </span>
              )}
              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${statusColor[account.status]}`}>
                {account.status}
              </span>
            </div>
            {(account.phase || account.grp) && (
              <div className="flex gap-1">
                {account.phase && <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{account.phase}</Badge>}
                {account.grp   && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{account.grp}</Badge>}
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
              <defs>
                {/* userSpaceOnUse: y coords are absolute SVG pixels matching the plot area.
                    This makes the zero crossing pixel-perfect regardless of actual data range. */}
                <linearGradient id={`stroke-${gradId}`} x1="0" y1={PLOT_TOP} x2="0" y2={PLOT_BOTTOM} gradientUnits="userSpaceOnUse">
                  <stop offset={zeroOffset} stopColor="#10b981" stopOpacity={1} />
                  <stop offset={zeroOffset} stopColor="#ef4444" stopOpacity={1} />
                </linearGradient>
                <linearGradient id={`fill-${gradId}`} x1="0" y1={PLOT_TOP} x2="0" y2={PLOT_BOTTOM} gradientUnits="userSpaceOnUse">
                  <stop offset="0%"         stopColor="#10b981" stopOpacity={0.14} />
                  <stop offset={zeroOffset} stopColor="#10b981" stopOpacity={0.03} />
                  <stop offset={zeroOffset} stopColor="#ef4444" stopOpacity={0.03} />
                  <stop offset="100%"       stopColor="#ef4444" stopOpacity={0.14} />
                </linearGradient>
              </defs>

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
                stroke={`url(#stroke-${gradId})`}
                strokeWidth={1.5}
                fill={`url(#fill-${gradId})`}
                fillOpacity={1}
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
                style={{ width: `${progress}%`, transition: 'width 0.6s cubic-bezier(0.23, 1, 0.32, 1)' }}
              />
            </div>
            <p className="mt-1 text-xs font-medium">{progress.toFixed(1)}%</p>
          </div>
          <div className="rounded-md bg-secondary/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Max DD Used</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${ddUsed > 70 ? 'bg-red-500' : ddUsed > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${ddUsed}%`, transition: 'width 0.6s cubic-bezier(0.23, 1, 0.32, 1)' }}
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
