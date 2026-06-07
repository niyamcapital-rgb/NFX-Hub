-- =============================================================
-- NFX Hub — Add risk_factor to trades for campaign scale-ins
-- Run AFTER 007_trade_legs_risk_factor.sql
-- =============================================================
-- risk_factor on a child trade represents the fraction of the
-- root trade's 1.0 risk unit allocated to this scale-in entry.
-- NULL on root trades (parent_trade_id IS NULL).
-- =============================================================

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS risk_factor NUMERIC(8, 4);
