-- =============================================================
-- NFX Hub — Trading Symbols
-- Run in Supabase SQL Editor after 003_storage_setup.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS symbols (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, name)
);

ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_symbols" ON symbols FOR ALL USING (auth.uid() = user_id);

-- Seed default symbols for any existing user running this migration manually:
-- INSERT INTO symbols (user_id, name) VALUES (auth.uid(), 'EURUSD'), (auth.uid(), 'GBPUSD');
