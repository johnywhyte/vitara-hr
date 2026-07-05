-- ============================================================
-- Migration — new application fields (2026-07)
-- Run this in your Supabase SQL editor against an existing DB.
-- Safe to run more than once (uses IF NOT EXISTS).
-- ============================================================

-- ── applications: track draft reminder emails ─────────────
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS draft_reminder_sent_at TIMESTAMPTZ;

-- ── applicant_details: license, motorbike, compensation, start date ──
ALTER TABLE public.applicant_details
  ADD COLUMN IF NOT EXISTS drivers_license_number   TEXT,
  ADD COLUMN IF NOT EXISTS has_motorbike            TEXT,
  ADD COLUMN IF NOT EXISTS compensation_expectation TEXT,
  ADD COLUMN IF NOT EXISTS possible_start_date      DATE,
  ADD COLUMN IF NOT EXISTS drivers_license_url      TEXT;

-- Constrain has_motorbike to yes/no (drop first so re-runs don't error).
ALTER TABLE public.applicant_details
  DROP CONSTRAINT IF EXISTS applicant_details_has_motorbike_check;
ALTER TABLE public.applicant_details
  ADD CONSTRAINT applicant_details_has_motorbike_check
  CHECK (has_motorbike IS NULL OR has_motorbike IN ('yes','no'));

-- ── guarantor_details: place of work ──────────────────────
ALTER TABLE public.guarantor_details
  ADD COLUMN IF NOT EXISTS place_of_work TEXT;
