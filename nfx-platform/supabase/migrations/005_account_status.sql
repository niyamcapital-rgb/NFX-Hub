-- =============================================================
-- NFX Hub — Migration 005: Simplify account status
-- Replaces active/passed/blown/paused with active/inactive
-- Run this in: Supabase SQL Editor → New Query → Run
-- =============================================================

-- Backfill: treat passed/blown/paused as inactive
UPDATE accounts
SET status = 'inactive'
WHERE status IN ('passed', 'blown', 'paused');

-- Drop the old check constraint (auto-named by Postgres)
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_status_check;

-- Add the new two-value constraint
ALTER TABLE accounts
  ADD CONSTRAINT accounts_status_check
  CHECK (status IN ('active', 'inactive'));
