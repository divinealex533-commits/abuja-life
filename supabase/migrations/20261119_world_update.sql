-- ============================================================
-- Abuja Life — WORLD UPDATE
--   1. Error log (Test Center)
--   2. Character appearance
--   3. Justice system: court cases, EFCC, jail
--   4. Nigeria map: "coming soon" state waitlist
-- Run AFTER 20261118_monetization.sql. Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Error log — errors players hit, grouped by fingerprint
-- ------------------------------------------------------------
create table if not exists public.error_logs (
  id            uuid primary key default gen_random_uuid(),
  fingerprint   text not null unique,
  source        text not null check (source in ('client', 'server')),
  message       text not null,
  stack         text,
  path          text,
  user_id       uuid,
  user_agent    text,
  occurrences   integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  resolved      boolean not null default false
);

create index if not exists error_logs_recent_idx on public.error_logs (resolved, last_seen_at desc);

alter table public.error_logs enable row level security;
-- No policies: written and read by the server only.

create or replace function public.abuja_log_error(
  p_fingerprint text, p_source text, p_message text, p_stack text,
  p_path text, p_user_id uuid, p_user_agent text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.error_logs (fingerprint, source, message, stack, path, user_id, user_agent)
  values (p_fingerprint, p_source, left(p_message, 1000), left(p_stack, 4000),
          left(p_path, 300), p_user_id, left(p_user_agent, 300))
  on conflict (fingerprint) do update
    set occurrences = public.error_logs.occurrences + 1,
        last_seen_at = now(),
        resolved = false,
        user_id = coalesce(excluded.user_id, public.error_logs.user_id),
        path = excluded.path;
$$;

revoke all on function public.abuja_log_error(text, text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.abuja_log_error(text, text, text, text, text, uuid, text) to service_role;

-- ------------------------------------------------------------
-- 2. Character appearance (skin, hair, outfit, accessories…)
-- ------------------------------------------------------------
alter table public.player_profiles
  add column if not exists appearance jsonb not null default '{}'::jsonb;

-- ------------------------------------------------------------
-- 3. Justice system
-- ------------------------------------------------------------
alter table public.player_game_states
  add column if not exists jailed_until timestamptz;

create table if not exists public.court_cases (
  id             uuid primary key default gen_random_uuid(),
  defendant_id   uuid not null references auth.users(id) on delete cascade,
  charge_key     text not null,
  charge         text not null,
  agency         text not null check (agency in ('police', 'efcc', 'nafdac', 'customs')),
  severity       text not null check (severity in ('minor', 'serious', 'financial')),
  details        text not null default '',
  career_id      text,
  fine_min       integer not null default 0,
  fine_max       integer not null default 0,
  status         text not null default 'awaiting_trial'
                 check (status in ('awaiting_trial', 'acquitted', 'fined', 'jailed',
                                   'dismissed', 'pardoned', 'convicted_absentia')),
  plea           text check (plea in ('guilty', 'not_guilty')),
  lawyer_tier    text check (lawyer_tier in ('legal_aid', 'private', 'san')),
  lawyer_fee     integer not null default 0,
  fine_paid      integer not null default 0,
  jail_hours     integer not null default 0,
  verdict        text,
  filed_at       timestamptz not null default now(),
  deadline_at    timestamptz not null default (now() + interval '48 hours'),
  resolved_at    timestamptz
);

create index if not exists court_cases_defendant_idx
  on public.court_cases (defendant_id, status, filed_at desc);
create index if not exists court_cases_open_idx
  on public.court_cases (status, agency, filed_at desc);

alter table public.court_cases enable row level security;

drop policy if exists "court cases: read own" on public.court_cases;
create policy "court cases: read own" on public.court_cases
  for select to authenticated using (auth.uid() = defendant_id);

-- Players can't edit their own jail time from the browser.
create or replace function public.abuja_guard_jail_column()
returns trigger language plpgsql as $$
begin
  if new.jailed_until is distinct from old.jailed_until
     and current_user in ('authenticated', 'anon') then
    new.jailed_until := old.jailed_until;
  end if;
  return new;
end;
$$;

drop trigger if exists player_game_states_guard_jail on public.player_game_states;
create trigger player_game_states_guard_jail
  before update on public.player_game_states
  for each row execute function public.abuja_guard_jail_column();

-- ------------------------------------------------------------
-- 4. "Coming soon" states — who wants which state next
-- ------------------------------------------------------------
create table if not exists public.state_waitlist (
  state_id    text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (state_id, user_id)
);

alter table public.state_waitlist enable row level security;

drop policy if exists "waitlist: read own" on public.state_waitlist;
create policy "waitlist: read own" on public.state_waitlist
  for select to authenticated using (auth.uid() = user_id);
