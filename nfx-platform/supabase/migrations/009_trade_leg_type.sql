-- =============================================================
-- NFX Hub — Add leg_type to trades for campaign architecture
-- Run AFTER 008_trade_risk_factor.sql
-- =============================================================
-- leg_type is only set on child trades (parent_trade_id IS NOT NULL).
-- NULL on root trades.
-- Supported values: Placeholder, Swing, ScaleIn
-- =============================================================

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS leg_type TEXT;

ALTER TABLE trades
  DROP CONSTRAINT IF EXISTS trades_leg_type_check;

ALTER TABLE trades
  ADD CONSTRAINT trades_leg_type_check
  CHECK (leg_type IN ('Placeholder', 'Swing', 'ScaleIn'));
