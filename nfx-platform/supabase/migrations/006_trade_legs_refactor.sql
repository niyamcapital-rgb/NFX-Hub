-- =============================================================
-- NFX Hub — Trade Legs: swap entry_price → target_rr
-- Run AFTER 005_trade_legs.sql
-- =============================================================
-- entry_price is removed; RR is now declared per-leg directly.
-- Existing legs (if any) receive target_rr = 2.00 as a safe default.
-- =============================================================

ALTER TABLE trade_legs
  DROP COLUMN IF EXISTS entry_price,
  ADD COLUMN IF NOT EXISTS target_rr NUMERIC(8, 4) NOT NULL DEFAULT 2;
