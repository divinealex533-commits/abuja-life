-- ============================================================
-- Abuja Life — ADMIN CONTROL ROOM
--   1. Give every player money / clean up balances after cheating
--   2. Job pay overrides per career
--   3. Elections (players run for office, vote, winner earns daily)
--   4. Billboards in the city
--   5. Admin action log
-- Run AFTER 20261121_playable_life.sql. Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Bulk money controls (server/admin only)
-- ------------------------------------------------------------
create or replace function public.abuja_admin_credit_all(p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_amount = 0 or abs(p_amount) > 100000000 then
    raise exception 'INVALID_AMOUNT';
  end if;
  update public.player_game_states
     set cash = greatest(0, cash + p_amount);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.abuja_admin_cap_cash(p_cap bigint, p_reset_to bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_cap < 0 or p_reset_to < 0 then
    raise exception 'INVALID_AMOUNT';
  end if;
  update public.player_game_states
     set cash = p_reset_to
   where cash > p_cap;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.abuja_admin_credit_all(integer) from public, anon, authenticated;
revoke all on function public.abuja_admin_cap_cash(bigint, bigint) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 2. Job pay overrides
-- ------------------------------------------------------------
create table if not exists public.career_pay_settings (
  career_id      text primary key,
  pay_multiplier numeric(5,2) not null default 1 check (pay_multiplier between 0.1 and 10),
  updated_at     timestamptz not null default now()
);
alter table public.career_pay_settings enable row level security;
drop policy if exists "career pay: anyone reads" on public.career_pay_settings;
create policy "career pay: anyone reads" on public.career_pay_settings for select using (true);

-- ------------------------------------------------------------
-- 3. Elections
-- ------------------------------------------------------------
create table if not exists public.elections (
  id             uuid primary key default gen_random_uuid(),
  office         text not null,
  description    text not null default '',
  daily_salary   integer not null default 25000 check (daily_salary >= 0),
  status         text not null default 'open' check (status in ('open', 'closed')),
  ends_at        timestamptz not null,
  term_days      integer not null default 7 check (term_days between 1 and 60),
  winner_id      uuid,
  term_ends_at   timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists elections_status_idx on public.elections (status, ends_at desc);

create table if not exists public.election_candidates (
  election_id uuid not null references public.elections(id) on delete cascade,
  user_id     uuid not null,
  slogan      text not null default '',
  created_at  timestamptz not null default now(),
  primary key (election_id, user_id)
);

create table if not exists public.election_votes (
  election_id  uuid not null references public.elections(id) on delete cascade,
  voter_id     uuid not null,
  candidate_id uuid not null,
  created_at   timestamptz not null default now(),
  primary key (election_id, voter_id)
);

create table if not exists public.election_salary_claims (
  election_id uuid not null references public.elections(id) on delete cascade,
  user_id     uuid not null,
  day_key     text not null,
  amount      integer not null,
  created_at  timestamptz not null default now(),
  primary key (election_id, user_id, day_key)
);

alter table public.elections enable row level security;
alter table public.election_candidates enable row level security;
alter table public.election_votes enable row level security;
alter table public.election_salary_claims enable row level security;
-- No policies: the game server reads and writes these.

-- ------------------------------------------------------------
-- 4. Billboards
-- ------------------------------------------------------------
create table if not exists public.billboards (
  id          uuid primary key default gen_random_uuid(),
  advertiser  text not null,
  headline    text not null,
  subtext     text not null default '',
  link_url    text,
  color       text not null default '#f59e0b',
  slot        integer not null default 1 check (slot between 1 and 6),
  active      boolean not null default true,
  ends_at     timestamptz,
  price_paid  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.billboards enable row level security;
drop policy if exists "billboards: anyone reads active" on public.billboards;
create policy "billboards: anyone reads active" on public.billboards for select using (active);

-- ------------------------------------------------------------
-- 5. Admin action log
-- ------------------------------------------------------------
create table if not exists public.admin_control_log (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid,
  action     text not null,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_control_log enable row level security;
