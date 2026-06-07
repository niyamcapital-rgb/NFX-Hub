-- =============================================================
-- NFX Hub — Initial Schema
-- Run this in: Supabase SQL Editor → New Query → Run
-- =============================================================

-- =============================================================
-- PROFILES
-- Auto-created for every auth.users row via trigger below.
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ACCOUNTS  (prop / funded accounts)
-- =============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  firm_name            TEXT NOT NULL,
  account_name         TEXT NOT NULL,
  starting_balance     NUMERIC(15, 2) NOT NULL,
  current_balance      NUMERIC(15, 2),
  profit_target_pct    NUMERIC(5, 2) NOT NULL,
  max_drawdown_pct     NUMERIC(5, 2) NOT NULL,
  daily_loss_limit_pct NUMERIC(5, 2),
  status               TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'passed', 'blown', 'paused')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CONFLUENCES  (user-defined trade setup tags)
-- =============================================================
CREATE TABLE IF NOT EXISTS confluences (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  category  TEXT,
  UNIQUE(user_id, name)
);

-- =============================================================
-- TRADES
-- parent_trade_id supports the scale-in system:
--   NULL  → original entry (root trade)
--   SET   → scale-in child entry linked to its root
-- =============================================================
CREATE TABLE IF NOT EXISTS trades (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id       UUID REFERENCES accounts(id) ON DELETE SET NULL,
  parent_trade_id  UUID REFERENCES trades(id) ON DELETE SET NULL,
  open_date        DATE NOT NULL,
  close_date       DATE,
  symbol           TEXT NOT NULL,
  direction        TEXT CHECK (direction IN ('long', 'short')),
  model            TEXT,
  entry_type       TEXT CHECK (entry_type IN ('market', 'limit')),
  entry_price      NUMERIC(15, 5),
  stop_loss        NUMERIC(15, 5),
  take_profit      NUMERIC(15, 5),
  risk_reward      NUMERIC(6, 2),
  result           TEXT CHECK (result IN ('win', 'loss', 'breakeven', 'pending')),
  pnl              NUMERIC(15, 2),
  confluences      TEXT[],
  summary          TEXT,
  dxy_chart_url    TEXT,
  entry_chart_url  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- OUTLOOKS  (daily + weekly market narratives)
-- =============================================================
CREATE TABLE IF NOT EXISTS outlooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_type  TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly')),
  period_start DATE NOT NULL,
  bias         TEXT CHECK (bias IN ('bullish', 'bearish', 'neutral')),
  narrative    TEXT,
  key_levels   TEXT[],
  targets      TEXT[],
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- =============================================================
-- ROW LEVEL SECURITY  — multi-tenant isolation
-- Every user sees and touches only their own rows.
-- =============================================================
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE confluences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlooks    ENABLE ROW LEVEL SECURITY;

-- profiles (split by operation — insert requires WITH CHECK)
CREATE POLICY "own_profile_select" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- remaining tables: single policy covers SELECT / INSERT / UPDATE / DELETE
CREATE POLICY "own_accounts"    ON accounts    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_confluences" ON confluences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_trades"      ON trades      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_outlooks"    ON outlooks    FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- TRIGGER — auto-create profile row on new Supabase Auth signup
-- =============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
