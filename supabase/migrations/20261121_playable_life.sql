-- ============================================================
-- Abuja Life — PLAYABLE LIFE
--   Needs that drop over time (hunger, hygiene, fun, social).
--   Values are stored with the time they were last saved; the
--   game works out how much they've dropped since then.
-- Run AFTER 20261120_socials_live.sql. Safe to re-run.
-- ============================================================

alter table public.player_game_states
  add column if not exists needs jsonb not null default '{}'::jsonb,
  add column if not exists needs_updated_at timestamptz not null default now();
