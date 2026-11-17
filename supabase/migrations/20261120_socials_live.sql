-- ============================================================
-- Abuja Life — SOCIALS & GO LIVE
--   Players add their TikTok, Snapchat, Instagram, X and YouTube
--   to their profile, and can mark themselves "live" so other
--   players see a LIVE badge that opens their stream.
-- Run AFTER 20261119_world_update.sql. Safe to re-run.
-- ============================================================

alter table public.player_profiles
  add column if not exists socials jsonb not null default '{}'::jsonb,
  add column if not exists live_platform text,
  add column if not exists live_title text,
  add column if not exists live_started_at timestamptz;

-- Only known platforms can be marked live.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'player_profiles_live_platform_check'
  ) then
    alter table public.player_profiles
      add constraint player_profiles_live_platform_check
      check (live_platform is null or live_platform in ('tiktok', 'instagram', 'youtube'));
  end if;
end $$;

-- Fast lookup of who is live right now.
create index if not exists player_profiles_live_idx
  on public.player_profiles (live_started_at desc)
  where live_started_at is not null;
