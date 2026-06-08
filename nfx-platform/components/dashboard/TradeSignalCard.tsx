'use client'

import { TrendingUp, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useDateFormat } from '@/lib/date-format'
import { useTheme } from '@/lib/theme'
import { getNearPassInfo, nearPassRisk } from '@/lib/execution-advisor'
import { buildEquityCurve } from '@/lib/equity-curve'
import type { Account, Trade } from '@/types/database'

interface Props {
  accounts: Account[]
  trades:   Trade[]
}

interface AccountSignal {
  account:   Account
  lastTrade: Trade | null
  riskPct:   number
  isActive:  boolean
}

interface GroupSignal {
  phase:    'P1' | 'P2' | 'Funded'
  label:    string
  accounts: AccountSignal[]
}


function computeGroups(
  accounts: Account[],
  trades: Trade[],
  riskByPhase: { P1: number; P2: number; Funded: number },
  proximityThreshold: number,
  rotationStrategy: 'conservative' | 'balanced' | 'aggressive',
): GroupSignal[] {
  const GROUPS: { phase: 'P1' | 'P2' | 'Funded'; label: string }[] = [
    { phase: 'P1',     label: 'Phase 1' },
    { phase: 'P2',     label: 'Phase 2' },
    { phase: 'Funded', label: 'Funded'  },
  ]

  const result: GroupSignal[] = []

  for (const { phase, label } of GROUPS) {
    const groupAccounts = accounts.filter(
      (a) => a.phase === phase && (a.status === 'active' || a.status === 'passed'),
    )
    if (groupAccounts.length === 0) continue

    const groupIds = new Set(groupAccounts.map((a) => a.id))

    // Most recent settled trade involving any account in this group
    const lastGroupTrade =
      trades.find(
        (t) =>
          t.result &&
          t.result !== 'pending' &&
          t.trade_accounts?.some((ta) => groupIds.has(ta.account_id)),
      ) ?? null

    let activeIndex = 0

    if (groupAccounts.length === 1) {
      // No rotation possible — always index 0
      activeIndex = 0
    } else if (lastGroupTrade) {
      // Find which account in the group was on the last trade
      const lastAccountId = lastGroupTrade.trade_accounts?.find((ta) =>
        groupIds.has(ta.account_id),
      )?.account_id
      const lastIdx = groupAccounts.findIndex((a) => a.id === lastAccountId)

      if (lastGroupTrade.result === 'loss') {
        // Rotate to next account on loss
        activeIndex = lastIdx >= 0 ? (lastIdx + 1) % groupAccounts.length : 0
      } else {
        // Win / breakeven — stay on same account
        activeIndex = lastIdx >= 0 ? lastIdx : 0
      }
    }

    const baseRisk = riskByPhase[phase]

    // Compute equity-curve balance per account (same source of truth as AccountCard)
    const curveBalances = new Map<string, number>(
      groupAccounts.map((a) => {
        const curve = buildEquityCurve(a, trades)
        const bal   = curve.at(-1)?.balance ?? a.current_balance ?? a.starting_balance
        return [a.id, bal]
      }),
    )

    // If the rotation-selected account is near-pass, also activate the next account
    const activeAccount = groupAccounts[activeIndex]
    const { isNearPass: activeIsNearPass } = getNearPassInfo(
      activeAccount, proximityThreshold, curveBalances.get(activeAccount.id),
    )
    const secondaryIndex = activeIsNearPass && groupAccounts.length > 1
      ? (activeIndex + 1) % groupAccounts.length
      : -1

    const accountSignals: AccountSignal[] = groupAccounts.map((account, i) => {
      const lastTrade =
        trades.find(
          (t) =>
            t.result &&
            t.result !== 'pending' &&
            t.trade_accounts?.some((ta) => ta.account_id === account.id),
        ) ?? null

      const isActive = i === activeIndex || i === secondaryIndex
      const { isNearPass } = getNearPassInfo(account, proximityThreshold, curveBalances.get(account.id))
      const riskPct = isNearPass ? nearPassRisk(rotationStrategy) : baseRisk

      return { account, lastTrade, riskPct, isActive }
    })

    result.push({ phase, label, accounts: accountSignals })
  }

  return result
}

export function TradeSignalCard({ accounts, trades }: Props) {
  const { fmt }                                          = useDateFormat()
  const { rotationEnabled, riskP1, riskP2, riskLive, proximityThreshold, rotationMode } = useTheme()
  const riskByPhase = { P1: riskP1, P2: riskP2, Funded: riskLive }
  const groups      = computeGroups(accounts, trades, riskByPhase, proximityThreshold, rotationMode)

  if (!rotationEnabled) return null

  if (groups.length === 0) {
    return (
      <Card className="border-border/40">
        <CardHeader className="border-b border-border/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            <TrendingUp className="h-3.5 w-3.5" />
            Account Rotation
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-muted-foreground/50">No active accounts</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="border-b border-border/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            <TrendingUp className="h-3.5 w-3.5" />
            Account Rotation
          </CardTitle>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
            <RotateCcw className="h-3 w-3" />
            <span>rotate on loss</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {groups.map(({ phase, label, accounts: accs }, gi) => (
          <div key={phase} className={cn(gi > 0 && 'border-t border-border/30')}>
            {/* Group heading */}
            <div className="flex items-center gap-2 px-4 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {label}
              </span>
              {accs.length > 1 && (
                <span className="rounded-full border border-border/40 bg-secondary/30 px-1.5 py-px text-[9px] text-muted-foreground/40">
                  {accs.length} accounts
                </span>
              )}
            </div>

            {/* Active account row only */}
            {accs.filter((a) => a.isActive).map(({ account, lastTrade, riskPct }) => (
              <div key={account.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">
                    {account.account_name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                    {lastTrade ? (
                      <>
                        Last:{' '}
                        <span className={
                          lastTrade.result === 'win'
                            ? 'text-emerald-400'
                            : lastTrade.result === 'loss'
                              ? 'text-red-400'
                              : 'text-muted-foreground'
                        }>
                          {lastTrade.result}
                        </span>{' '}
                        · {fmt(lastTrade.open_date)}
                      </>
                    ) : (
                      'No trades yet'
                    )}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-primary">
                    {riskPct.toFixed(2)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">risk</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
