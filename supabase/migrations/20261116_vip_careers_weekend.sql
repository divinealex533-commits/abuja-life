-- ============================================================
-- Abuja Life — VIP, store delivery, careers & weekend rewards
-- Run this once in Supabase → SQL Editor (or `supabase db push`).
-- Safe to re-run: everything uses IF NOT EXISTS / OR REPLACE.
-- ============================================================

-- ------------------------------------------------------------
-- 1. VIP memberships (one row per player)
-- ------------------------------------------------------------
create table if not exists public.vip_memberships (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  tier        text not null check (tier in ('silver', 'gold', 'diamond')),
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  updated_at  timestamptz not null default now()
);

alter table public.vip_memberships enable row level security;

drop policy if exists "vip: read own" on public.vip_memberships;
create policy "vip: read own" on public.vip_memberships
  for select to authenticated using (auth.uid() = user_id);

-- Public VIP badges (so chat can show 🥈🥇💎 next to names).
-- Exposes only user_id + tier for currently active members.
create or replace view public.vip_public_badges
with (security_invoker = false) as
  select user_id, tier
  from public.vip_memberships
  where expires_at > now();

grant select on public.vip_public_badges to authenticated;

-- ------------------------------------------------------------
-- 2. Payment fulfillment log (exactly-once delivery)
-- ------------------------------------------------------------
create table if not exists public.payment_fulfillments (
  reference     text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  product_id    text not null,
  status        text not null check (status in ('processing', 'completed', 'failed')),
  error         text,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists payment_fulfillments_user_product_idx
  on public.payment_fulfillments (user_id, product_id, status);

alter table public.payment_fulfillments enable row level security;

drop policy if exists "fulfillments: read own" on public.payment_fulfillments;
create policy "fulfillments: read own" on public.payment_fulfillments
  for select to authenticated using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. VIP perk claims (daily stipend, energy refills, lounges…)
-- ------------------------------------------------------------
create table if not exists public.vip_perk_claims (
  user_id     uuid not null references auth.users(id) on delete cascade,
  perk_id     text not null,
  claim_date  date not null,
  uses        integer not null default 1,
  updated_at  timestamptz not null default now(),
  primary key (user_id, perk_id, claim_date)
);

alter table public.vip_perk_claims enable row level security;

drop policy if exists "perks: read own" on public.vip_perk_claims;
create policy "perks: read own" on public.vip_perk_claims
  for select to authenticated using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. Career progress (new advanced careers)
-- ------------------------------------------------------------
create table if not exists public.career_progress (
  user_id        uuid not null references auth.users(id) on delete cascade,
  career_id      text not null,
  xp             integer not null default 0,
  shifts         integer not null default 0,
  total_earned   numeric not null default 0,
  last_shift_at  timestamptz,
  primary key (user_id, career_id)
);

alter table public.career_progress enable row level security;

drop policy if exists "careers: read own" on public.career_progress;
create policy "careers: read own" on public.career_progress
  for select to authenticated using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. Weekend rewards
-- ------------------------------------------------------------
create table if not exists public.weekend_reward_settings (
  id                integer primary key default 1 check (id = 1),
  enabled           boolean not null default true,
  saturday_amount   integer not null default 5000,
  sunday_amount     integer not null default 7500,
  both_days_bonus   integer not null default 5000,
  updated_at        timestamptz not null default now()
);

insert into public.weekend_reward_settings (id) values (1)
  on conflict (id) do nothing;

alter table public.weekend_reward_settings enable row level security;

drop policy if exists "weekend settings: read" on public.weekend_reward_settings;
create policy "weekend settings: read" on public.weekend_reward_settings
  for select to authenticated using (true);

create table if not exists public.weekend_reward_claims (
  user_id     uuid not null references auth.users(id) on delete cascade,
  claim_date  date not null,
  amount      integer not null,
  multiplier  numeric not null default 1,
  vip_tier    text,
  created_at  timestamptz not null default now(),
  primary key (user_id, claim_date)
);

alter table public.weekend_reward_claims enable row level security;

drop policy if exists "weekend claims: read own" on public.weekend_reward_claims;
create policy "weekend claims: read own" on public.weekend_reward_claims
  for select to authenticated using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6. Admin payment pages (optional tables used by /admin/payments)
-- ------------------------------------------------------------
create table if not exists public.payment_settings (
  id                        integer primary key default 1 check (id = 1),
  provider                  text not null default 'paystack',
  is_enabled                boolean not null default true,
  currency                  text not null default 'NGN',
  business_name             text default 'Abuja Life',
  settlement_bank_name      text,
  settlement_account_name   text,
  settlement_account_last4  text,
  updated_at                timestamptz not null default now()
);

insert into public.payment_settings (id) values (1)
  on conflict (id) do nothing;

create table if not exists public.payment_settlements (
  id               uuid primary key default gen_random_uuid(),
  provider         text not null default 'paystack',
  reference        text,
  amount           numeric not null default 0,
  currency         text not null default 'NGN',
  status           text not null default 'pending',
  settlement_date  date,
  notes            text,
  created_at       timestamptz not null default now()
);

alter table public.payment_settings enable row level security;
alter table public.payment_settlements enable row level security;
-- No policies: only the service role (server) can read these.

-- ------------------------------------------------------------
-- 7. Server-side economy functions
--    Only the service role (your Next.js server) may call these.
-- ------------------------------------------------------------

-- Make sure a player row exists (new players start like the game does).
create or replace function public.abuja_ensure_player_row(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.player_game_states
    (user_id, cash, energy, max_energy, reputation,
     current_job_id, job_experience, current_location_id)
  values
    (p_user_id, 10000, 100, 100, 0, null, 0, 'garki')
  on conflict (user_id) do nothing;
$$;

-- Atomically change cash / energy / reputation / XP.
-- Raises NOT_ENOUGH_ENERGY or NOT_ENOUGH_CASH instead of going negative.
create or replace function public.abuja_apply_player_delta(
  p_user_id        uuid,
  p_cash           numeric default 0,
  p_energy         integer default 0,
  p_reputation     integer default 0,
  p_experience     integer default 0,
  p_refill_energy  boolean default false
)
returns table (
  cash            numeric,
  energy          integer,
  max_energy      integer,
  reputation      integer,
  job_experience  integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.player_game_states%rowtype;
  v_new_energy integer;
begin
  perform public.abuja_ensure_player_row(p_user_id);

  select * into v_row
  from public.player_game_states
  where user_id = p_user_id
  for update;

  if p_refill_energy then
    v_new_energy := v_row.max_energy;
  else
    v_new_energy := least(v_row.max_energy, v_row.energy + p_energy);
  end if;

  if v_new_energy < 0 then
    raise exception 'NOT_ENOUGH_ENERGY';
  end if;

  if v_row.cash + p_cash < 0 then
    raise exception 'NOT_ENOUGH_CASH';
  end if;

  update public.player_game_states as s
  set cash           = s.cash + p_cash,
      energy         = v_new_energy,
      reputation     = s.reputation + p_reputation,
      job_experience = greatest(0, s.job_experience + p_experience)
  where s.user_id = p_user_id;

  return query
    select s.cash::numeric, s.energy::integer, s.max_energy::integer,
           s.reputation::integer, s.job_experience::integer
    from public.player_game_states s
    where s.user_id = p_user_id;
end;
$$;

-- Deliver a paid purchase: VIP time and/or game cash, in one transaction.
-- Buying while VIP is active ADDS days and keeps the higher tier.
create or replace function public.abuja_grant_purchase(
  p_user_id  uuid,
  p_tier     text,
  p_days     integer,
  p_cash     numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.vip_memberships%rowtype;
  v_rank_new integer;
  v_rank_old integer;
  v_tier text;
  v_base timestamptz;
begin
  if p_tier is not null and p_days > 0 then
    if p_tier not in ('silver', 'gold', 'diamond') then
      raise exception 'INVALID_TIER';
    end if;

    select * into v_current
    from public.vip_memberships
    where user_id = p_user_id
    for update;

    if not found then
      insert into public.vip_memberships (user_id, tier, expires_at)
      values (p_user_id, p_tier, now() + make_interval(days => p_days));
    else
      v_rank_new := case p_tier when 'silver' then 1 when 'gold' then 2 else 3 end;
      v_rank_old := case v_current.tier when 'silver' then 1 when 'gold' then 2 else 3 end;

      if v_current.expires_at > now() then
        v_base := v_current.expires_at;
        v_tier := case when v_rank_new >= v_rank_old then p_tier else v_current.tier end;
      else
        v_base := now();
        v_tier := p_tier;
      end if;

      update public.vip_memberships
      set tier       = v_tier,
          expires_at = v_base + make_interval(days => p_days),
          started_at = case when v_current.expires_at > now()
                            then started_at else now() end,
          updated_at = now()
      where user_id = p_user_id;
    end if;
  end if;

  if coalesce(p_cash, 0) > 0 then
    perform public.abuja_ensure_player_row(p_user_id);

    update public.player_game_states
    set cash = cash + p_cash
    where user_id = p_user_id;
  end if;
end;
$$;

revoke all on function public.abuja_ensure_player_row(uuid) from public, anon, authenticated;
revoke all on function public.abuja_apply_player_delta(uuid, numeric, integer, integer, integer, boolean) from public, anon, authenticated;
revoke all on function public.abuja_grant_purchase(uuid, text, integer, numeric) from public, anon, authenticated;

grant execute on function public.abuja_ensure_player_row(uuid) to service_role;
grant execute on function public.abuja_apply_player_delta(uuid, numeric, integer, integer, integer, boolean) to service_role;
grant execute on function public.abuja_grant_purchase(uuid, text, integer, numeric) to service_role;
