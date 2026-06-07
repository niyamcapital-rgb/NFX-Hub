-- =============================================================
-- NFX Hub — Trade Legs (Scale-In)
-- Run AFTER 004_symbols.sql
-- =============================================================
-- Each row represents one scale-in entry for a parent trade.
-- RR for a leg = (current_price - entry_price) / (stop_loss - entry_price)
-- Cumulative RR = Σ(RR_i × risk_i) / Σ(risk_i)  — risk-weighted average
-- stop_loss is inherited from the parent trade at calculation time.
-- =============================================================

CREATE TABLE IF NOT EXISTS trade_legs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id     UUID        NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  entry_price  NUMERIC(15, 5) NOT NULL,
  risk_percent NUMERIC(6, 4)  NOT NULL CHECK (risk_percent > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookups by parent trade
CREATE INDEX IF NOT EXISTS trade_legs_trade_id_idx ON trade_legs (trade_id);

-- =============================================================
-- ROW LEVEL SECURITY
-- A leg is owned by whoever owns its parent trade.
-- =============================================================
ALTER TABLE trade_legs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_trade_legs" ON trade_legs;
CREATE POLICY "own_trade_legs" ON trade_legs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_legs.trade_id
        AND trades.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_legs.trade_id
        AND trades.user_id = auth.uid()
    )
  );
