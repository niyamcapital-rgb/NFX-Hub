// Scale-In calculation engine — Risk-Recycling Additive model
//
// All entries (initial + legs) are treated uniformly:
//   Contribution_i = risk_factor_i × target_rr_i
//   Total_Trade_RR = Σ(Contribution_i) / Initial_Base_Risk_Unit   (base = 1.0)
//
// Because the base is always 1.0, the division is trivial and the formula
// reduces to:
//   Total_Trade_RR = (1.0 × initial_rr) + Σ(risk_factor_i × target_rr_i)
//
// Example: 1% risk at 3R initial, scale-in 0.5% at 1R
//   = (1.0×3 + 0.5×1) / 1.0 = 3.5R
//
// Total risk is ADDITIVE — it exceeds 1.0 as legs are added, showing true exposure.

export interface LegInput {
  risk_factor: number
  target_rr:   number
}

/**
 * Total Trade RR using the risk-recycling additive model.
 * initialRR: RR of the first entry (fixed risk_factor = 1.0).
 * legs:      each scale-in contributes (risk_factor × target_rr).
 * Returns null when initialRR is not set.
 */
export function calcCumulativeRR(initialRR: number | null, legs: LegInput[]): number | null {
  if (initialRR === null || initialRR === undefined) return null
  return initialRR + legs.reduce((sum, l) => sum + l.risk_factor * l.target_rr, 0)
}

/** Total position risk units: 1.0 (initial) + sum of all leg risk_factors. */
export function calcTotalRisk(legs: LegInput[]): number {
  return 1.0 + legs.reduce((sum, l) => sum + l.risk_factor, 0)
}

/** Remaining budget before hitting the max (default 2.0 total risk units). */
export function calcRemainingRisk(legs: LegInput[], maxRisk = 2.0): number {
  return Math.max(0, maxRisk - calcTotalRisk(legs))
}

/** Sum of just the scale-in legs' risk_factors (excludes the base 1.0). */
export function calcLegRiskSum(legs: LegInput[]): number {
  return legs.reduce((sum, l) => sum + l.risk_factor, 0)
}
