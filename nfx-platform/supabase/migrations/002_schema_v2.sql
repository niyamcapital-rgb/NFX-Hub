-- =============================================================
-- NFX Hub — Schema v2
-- Run AFTER 001_initial_schema.sql
-- =============================================================

-- =============================================================
-- ALTER EXISTING TABLES
-- =============================================================

-- Confluences: add color for the tagging UI
ALTER TABLE confluences
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#3b82f6';

-- Accounts: add prop-firm-specific fields
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS phase       TEXT CHECK (phase IN ('P1', 'P2', 'Funded')),
  ADD COLUMN IF NOT EXISTS grp         TEXT CHECK (grp IN ('A', 'B', 'C', 'D', 'E')),
  ADD COLUMN IF NOT EXISTS start_date  DATE;

-- Trades: add type, outlook links, and drop old single-value account_id (replaced by junction)
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS trade_type       TEXT CHECK (trade_type IN ('Swing', 'Intraswing', 'Intraday', 'Manipulation')),
  ADD COLUMN IF NOT EXISTS scale_in_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS daily_outlook_id  UUID REFERENCES outlooks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS weekly_outlook_id UUID REFERENCES outlooks(id) ON DELETE SET NULL;

-- =============================================================
-- NEW JUNCTION TABLES  (many-to-many)
-- =============================================================

-- Trades ↔ Accounts  (a trade can span multiple accounts / groups)
CREATE TABLE IF NOT EXISTS trade_accounts (
  trade_id   UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, account_id)
);

-- Trades ↔ Groups  (a trade can be assigned to groups A–E)
CREATE TABLE IF NOT EXISTS trade_groups (
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  grp      TEXT NOT NULL CHECK (grp IN ('A', 'B', 'C', 'D', 'E')),
  PRIMARY KEY (trade_id, grp)
);

-- Trades ↔ Confluences  (multi-select tags per trade)
CREATE TABLE IF NOT EXISTS trade_confluences (
  trade_id      UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  confluence_id UUID NOT NULL REFERENCES confluences(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, confluence_id)
);

-- =============================================================
-- SPLIT OUTLOOKS INTO DEDICATED TABLES
-- (the original outlooks table stays for backward compat;
--  new tables carry the richer weekly/daily structures)
-- =============================================================

CREATE TABLE IF NOT EXISTS weekly_outlooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start   DATE NOT NULL,
  trading_plan TEXT,
  notes        TEXT,
  chart_url    TEXT,
  news_urls    TEXT[],
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS daily_outlooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  outlook_date DATE NOT NULL,
  trading_plan TEXT,
  chart_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, outlook_date)
);

-- Update trades to also reference the new tables directly
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS new_daily_outlook_id  UUID REFERENCES daily_outlooks(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS new_weekly_outlook_id UUID REFERENCES weekly_outlooks(id) ON DELETE SET NULL;

-- =============================================================
-- ROW LEVEL SECURITY for new tables
-- =============================================================
ALTER TABLE trade_accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_groups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_confluences ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_outlooks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_outlooks   ENABLE ROW LEVEL SECURITY;

-- Junction tables: user owns a junction row if they own the trade
CREATE POLICY "own_trade_accounts"    ON trade_accounts    FOR ALL USING (
  EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_id AND trades.user_id = auth.uid())
);
CREATE POLICY "own_trade_groups"      ON trade_groups      FOR ALL USING (
  EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_id AND trades.user_id = auth.uid())
);
CREATE POLICY "own_trade_confluences" ON trade_confluences FOR ALL USING (
  EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_id AND trades.user_id = auth.uid())
);

CREATE POLICY "own_weekly_outlooks" ON weekly_outlooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_daily_outlooks"  ON daily_outlooks  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- SUPABASE STORAGE BUCKETS
-- Run these in the Supabase Storage section OR via CLI:
--   supabase storage create trade-charts
--   supabase storage create outlook-charts
-- OR paste these into SQL editor (requires storage extension):
-- =============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trade-charts', 'trade-charts', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('outlook-charts', 'outlook-charts', false) ON CONFLICT DO NOTHING;

-- Storage RLS (run after creating buckets):
-- CREATE POLICY "User owns trade chart" ON storage.objects FOR ALL USING (
--   bucket_id = 'trade-charts' AND auth.uid()::text = (storage.foldername(name))[1]
-- );
-- CREATE POLICY "User owns outlook chart" ON storage.objects FOR ALL USING (
--   bucket_id = 'outlook-charts' AND auth.uid()::text = (storage.foldername(name))[1]
-- );
