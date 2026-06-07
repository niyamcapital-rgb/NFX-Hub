-- =============================================================
-- NFX Hub — Storage Setup
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql
-- =============================================================

-- Create buckets as PUBLIC so getPublicUrl() works correctly.
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-charts', 'trade-charts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('outlook-charts', 'outlook-charts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ── trade-charts policies ──────────────────────────────────────
DROP POLICY IF EXISTS "trade-charts: auth upload"  ON storage.objects;
DROP POLICY IF EXISTS "trade-charts: auth update"  ON storage.objects;
DROP POLICY IF EXISTS "trade-charts: auth delete"  ON storage.objects;
DROP POLICY IF EXISTS "trade-charts: public read"  ON storage.objects;

CREATE POLICY "trade-charts: auth upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trade-charts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);npm

CREATE POLICY "trade-charts: auth update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'trade-charts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "trade-charts: auth delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'trade-charts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "trade-charts: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'trade-charts');

-- ── outlook-charts policies ────────────────────────────────────
DROP POLICY IF EXISTS "outlook-charts: auth upload" ON storage.objects;
DROP POLICY IF EXISTS "outlook-charts: auth update" ON storage.objects;
DROP POLICY IF EXISTS "outlook-charts: auth delete" ON storage.objects;
DROP POLICY IF EXISTS "outlook-charts: public read" ON storage.objects;

CREATE POLICY "outlook-charts: auth upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'outlook-charts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "outlook-charts: auth update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'outlook-charts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "outlook-charts: auth delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'outlook-charts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "outlook-charts: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'outlook-charts');
