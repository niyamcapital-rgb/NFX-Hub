-- =============================================================
-- NFX Hub — Trade Legs: risk_percent → risk_factor
-- Run AFTER 006_trade_legs_refactor.sql
-- =============================================================
-- risk_factor is now a fraction of the original 1.0 risk unit.
-- e.g. 0.5 = half the original risk, 0.25 = quarter risk.
-- Total position risk = 1.0 (initial) + Σ(risk_factor).
-- Max total risk budget = 2.0, so Σ(risk_factor) ≤ 1.0.
-- =============================================================

ALTER TABLE trade_legs RENAME COLUMN risk_percent TO risk_factor;

-- Add upper-bound guard (Postgres auto-updates the > 0 check after rename)
ALTER TABLE trade_legs
  ADD CONSTRAINT trade_legs_risk_factor_max CHECK (risk_factor <= 1.0);
