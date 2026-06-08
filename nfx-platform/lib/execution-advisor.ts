import type { Account } from '@/types/database'

export type NearPassStrategy = 'conservative' | 'balanced' | 'aggressive'

export function getNearPassInfo(
  account: Account,
  proximityThreshold: number,
  computedBalance?: number,
): { isNearPass: boolean; remainingPct: number } {
  const balance    = computedBalance ?? account.current_balance ?? account.starting_balance
  const targetGain = account.starting_balance * (account.profit_target_pct / 100)
  const currentGain = balance - account.starting_balance
  const remaining  = targetGain - currentGain

  if (remaining <= 0) return { isNearPass: false, remainingPct: 0 }

  const remainingPct = (remaining / account.starting_balance) * 100
  return {
    isNearPass:   remainingPct <= proximityThreshold,
    remainingPct: Math.round(remainingPct * 100) / 100,
  }
}

// When an account is near pass, risk drops to a protective 1–1.5% range
// regardless of the configured base risk. The rotation strategy picks within range.
export function nearPassRisk(strategy: NearPassStrategy): number {
  if (strategy === 'conservative') return 1.0
  if (strategy === 'aggressive')   return 1.5
  return 1.25
}
