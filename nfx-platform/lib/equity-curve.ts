import type { Account, Trade, TradeResult } from '@/types/database'

export interface EquityPoint {
  date: string
  balance: number
}

/**
 * Dollar P&L for one settled trade event.
 *
 * Risk is always 1% of the ACCOUNT SIZE per risk_factor unit:
 *   riskDollars = risk_factor × 1% × accountSize
 *
 * Win:       +(risk_reward × riskDollars)   e.g. 6.25R × $1,000 = +$6,250
 * Loss:      -(riskDollars)                 e.g. 1× × $1,000   = -$1,000
 * Breakeven: 0
 *
 * Falls back to the recorded pnl dollar amount when rr is missing.
 */
function eventDollarDelta(
  result: TradeResult | null,
  rr: number | null,
  rf: number | null,
  pnl: number | null,
  accountSize: number,
): number {
  const riskDollars = (rf ?? 1.0) * 0.01 * accountSize

  switch (result) {
    case 'win': {
      if (rr != null) return rr * riskDollars
      if (pnl != null) return pnl
      return 0
    }
    case 'loss': {
      if (rr != null) return -riskDollars
      if (pnl != null) return pnl   // pnl is already negative for a loss
      return -riskDollars
    }
    case 'breakeven': return 0
    default:          return 0
  }
}

/** All calendar dates from `start` to `end` inclusive (YYYY-MM-DD). */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cur  = new Date(start + 'T12:00:00Z')
  const last = new Date(end   + 'T12:00:00Z')
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

/**
 * Builds a daily forward-filled equity curve for one account.
 *
 * A balance point is emitted for EVERY calendar day from account start to
 * today. Days with no trades carry the previous balance forward — this
 * produces the staircase effect when rendered with type="stepAfter".
 */
export function buildEquityCurve(account: Account, trades: Trade[]): EquityPoint[] {
  // Match trades to this account via trade_accounts junction OR legacy account_id field
  const linked = trades.filter(
    (t) =>
      t.account_id === account.id ||
      t.trade_accounts?.some((ta) => ta.account_id === account.id),
  )

  const deltasByDate = new Map<string, number[]>()

  function addEvent(date: string, delta: number) {
    if (!deltasByDate.has(date)) deltasByDate.set(date, [])
    deltasByDate.get(date)!.push(delta)
  }

  const accountSize = account.starting_balance   // fixed base for risk calculations

  for (const trade of linked) {
    if (trade.scale_in_enabled) {
      const parentSettled = !!(trade.close_date && trade.result && trade.result !== 'pending')

      if (parentSettled && trade.result === 'loss') {
        // Campaign loss: total exposure is always exactly 1R regardless of how
        // the individual risk factors are distributed across legs. The user
        // manages position sizing externally to ensure this — never sum rf values.
        addEvent(trade.close_date!, -accountSize * 0.01)
      } else {
        // Campaign win / breakeven: count parent, then sum settled child gains.
        // Child losses are skipped — their stops were managed (moved to BE or
        // profit) before the campaign closed, so no additional downside applies.
        if (parentSettled) {
          addEvent(
            trade.close_date!,
            eventDollarDelta(trade.result!, trade.risk_reward, trade.risk_factor, trade.pnl, accountSize),
          )
        }
        for (const child of trade.children ?? []) {
          if (child.close_date && child.result && child.result !== 'pending') {
            if (child.result === 'loss') continue
            addEvent(
              child.close_date,
              eventDollarDelta(child.result, child.risk_reward, child.risk_factor, child.pnl, accountSize),
            )
          }
        }
      }
    } else {
      if (trade.close_date && trade.result && trade.result !== 'pending') {
        addEvent(
          trade.close_date,
          eventDollarDelta(trade.result, trade.risk_reward, trade.risk_factor, trade.pnl, accountSize),
        )
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const allEventDates = [...deltasByDate.keys()].sort()
  // Start from the earlier of the account start_date or the first trade event date
  // so trades logged before the account start_date are never silently dropped.
  const candidates = [account.start_date, allEventDates[0]].filter(Boolean) as string[]
  const anchorDate = candidates.length > 0 ? candidates.reduce((a, b) => (a < b ? a : b)) : today
  const startDate  = anchorDate <= today ? anchorDate : today

  const days = dateRange(startDate, today)

  // Chart anchors at the Starting Balance (where tracking began on the app).
  // Falls back to Account Size when Starting Balance hasn't been set.
  const initialBalance = account.current_balance ?? account.starting_balance

  const points: EquityPoint[] = []
  let running = initialBalance

  for (const date of days) {
    const deltas = deltasByDate.get(date)
    if (deltas) {
      for (const d of deltas) {
        // Additive: d is a dollar amount; risk is always % of fixed account size
        running = Math.round((running + d) * 100) / 100
      }
    }
    points.push({ date, balance: running })
  }

  if (points.length === 0) {
    return [
      { date: today, balance: initialBalance },
      { date: today, balance: initialBalance },
    ]
  }

  return points
}
