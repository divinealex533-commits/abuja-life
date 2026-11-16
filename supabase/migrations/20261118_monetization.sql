-- ============================================================
-- Abuja Life — MONETIZATION PACK
--   1. Real business advertising (sponsored places)
--   2. Style shop (name colours, avatar frames, titles)
--   3. Marketplace commission on player contracts
--   4. Referral rewards
--   5. Rewarded ads
-- Run AFTER 20261116a_base_game_tables.sql. Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- Settings for the new features (Admin → Game Settings)
-- ------------------------------------------------------------
alter table public.admin_game_settings
  add column if not exists marketplace_fee_percent integer not null default 5
    check (marketplace_fee_percent between 0 and 30);
alter table public.admin_game_settings
  add column if not exists rewarded_ads_enabled boolean not null default true;
alter table public.admin_game_settings
  add column if not exists rewarded_ad_seconds integer not null default 15
    check (rewarded_ad_seconds between 5 and 120);
alter table public.admin_game_settings
  add column if not exists rewarded_ad_daily_limit integer not null default 5
    check (rewarded_ad_daily_limit between 0 and 50);
alter table public.admin_game_settings
  add column if not exists rewarded_ad_cash integer not null default 1000
    check (rewarded_ad_cash between 0 and 1000000);
alter table public.admin_game_settings
  add column if not exists rewarded_ad_energy integer not null default 15
    check (rewarded_ad_energy between 0 and 200);
alter table public.admin_game_settings
  add column if not exists referral_reward_referrer integer not null default 5000
    check (referral_reward_referrer between 0 and 10000000);
alter table public.admin_game_settings
  add column if not exists referral_reward_new_player integer not null default 2000
    check (referral_reward_new_player between 0 and 10000000);

-- ------------------------------------------------------------
-- 1. Business listings (real Abuja businesses that pay to appear)
-- ------------------------------------------------------------
create table if not exists public.business_listings (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  name           text not null check (char_length(name) between 2 and 60),
  category       text not null
                 check (category in ('restaurant', 'salon', 'boutique', 'lounge', 'pharmacy',
                                     'supermarket', 'gym', 'hotel', 'services', 'other')),
  district       text not null,
  emoji          text not null default '🏪' check (char_length(emoji) <= 8),
  description    text not null default '' check (char_length(description) <= 300),
  address        text not null default '' check (char_length(address) <= 160),
  phone          text check (phone is null or phone ~ '^[0-9+ ]{7,20}$'),
  whatsapp       text check (whatsapp is null or whatsapp ~ '^[0-9+ ]{7,20}$'),
  instagram      text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  offer_text     text check (offer_text is null or char_length(offer_text) <= 120),
  plan           text not null default 'basic' check (plan in ('basic', 'featured', 'premium')),
  status         text not null default 'pending_payment'
                 check (status in ('pending_payment', 'pending_review', 'active', 'paused', 'rejected')),
  paid_until     timestamptz,
  reject_reason  text,
  views          integer not null default 0,
  visits         integer not null default 0,
  contacts       integer not null default 0,
  ad_views       integer not null default 0,
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz
);

create index if not exists business_listings_live_idx
  on public.business_listings (status, district, paid_until desc);
create index if not exists business_listings_owner_idx
  on public.business_listings (owner_id, created_at desc);

alter table public.business_listings enable row level security;

-- Anyone logged in can see live listings; owners see their own.
drop policy if exists "listings: read live or own" on public.business_listings;
create policy "listings: read live or own" on public.business_listings
  for select to authenticated
  using ((status = 'active' and paid_until > now()) or owner_id = auth.uid());

-- Writes go through the server (validation + payment + admin review).

create table if not exists public.business_listing_visits (
  listing_id  uuid not null references public.business_listings(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  visit_date  date not null,
  created_at  timestamptz not null default now(),
  primary key (listing_id, user_id, visit_date)
);

alter table public.business_listing_visits enable row level security;

-- Count views/visits/contacts/ad views safely.
create or replace function public.abuja_bump_listing_stat(p_ids uuid[], p_stat text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_stat = 'views' then
    update public.business_listings set views = views + 1 where id = any(p_ids);
  elsif p_stat = 'visits' then
    update public.business_listings set visits = visits + 1 where id = any(p_ids);
  elsif p_stat = 'contacts' then
    update public.business_listings set contacts = contacts + 1 where id = any(p_ids);
  elsif p_stat = 'ad_views' then
    update public.business_listings set ad_views = ad_views + 1 where id = any(p_ids);
  else
    raise exception 'UNKNOWN_STAT';
  end if;
end;
$$;

-- Add 30 days after payment (called by the payment delivery code).
create or replace function public.abuja_extend_listing(p_listing_id uuid, p_owner uuid, p_plan text, p_days integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.business_listings
     set paid_until = greatest(coalesce(paid_until, now()), now()) + make_interval(days => p_days),
         plan = p_plan,
         status = case
                    when status in ('pending_payment', 'rejected') then 'pending_review'
                    else status
                  end
   where id = p_listing_id and owner_id = p_owner;

  if not found then
    raise exception 'LISTING_NOT_FOUND';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 2. Style shop
-- ------------------------------------------------------------
create table if not exists public.player_cosmetics (
  user_id      uuid not null references auth.users(id) on delete cascade,
  cosmetic_id  text not null,
  acquired_at  timestamptz not null default now(),
  primary key (user_id, cosmetic_id)
);

alter table public.player_cosmetics enable row level security;

drop policy if exists "cosmetics: read own" on public.player_cosmetics;
create policy "cosmetics: read own" on public.player_cosmetics
  for select to authenticated using (auth.uid() = user_id);

alter table public.player_profiles add column if not exists name_style text;
alter table public.player_profiles add column if not exists avatar_frame text;
alter table public.player_profiles add column if not exists title text;

-- Players can only wear styles they own (blocks editing the profile directly).
create or replace function public.abuja_profile_cosmetics_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.name_style is not null and new.name_style is distinct from old.name_style
     and not exists (select 1 from public.player_cosmetics
                     where user_id = new.id and cosmetic_id = new.name_style) then
    raise exception 'COSMETIC_NOT_OWNED';
  end if;

  if new.avatar_frame is not null and new.avatar_frame is distinct from old.avatar_frame
     and not exists (select 1 from public.player_cosmetics
                     where user_id = new.id and cosmetic_id = new.avatar_frame) then
    raise exception 'COSMETIC_NOT_OWNED';
  end if;

  if new.title is not null and new.title is distinct from old.title
     and not exists (select 1 from public.player_cosmetics
                     where user_id = new.id and cosmetic_id = new.title) then
    raise exception 'COSMETIC_NOT_OWNED';
  end if;

  return new;
end;
$$;

drop trigger if exists player_profiles_cosmetics_guard on public.player_profiles;
create trigger player_profiles_cosmetics_guard
  before update on public.player_profiles
  for each row execute function public.abuja_profile_cosmetics_guard();

-- ------------------------------------------------------------
-- 3. Marketplace commission on player contracts
-- ------------------------------------------------------------
create table if not exists public.marketplace_fees (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid references public.player_business_contracts(id) on delete set null,
  client_id    uuid references auth.users(id) on delete set null,
  reward       integer not null,
  fee_percent  integer not null,
  fee          integer not null,
  created_at   timestamptz not null default now()
);

alter table public.marketplace_fees enable row level security;

-- Replace contract creation: client pays reward (held) + marketplace fee.
create or replace function public.create_player_business_contract(
  p_business_id        text,
  p_title              text,
  p_description        text,
  p_location_id        text,
  p_reward             integer,
  p_reputation_reward  integer default 0,
  p_experience_reward  integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_cash numeric;
  v_id uuid;
  v_pct integer;
  v_fee integer;
begin
  if v_user is null then
    return jsonb_build_object('success', false, 'message', 'Please log in first.');
  end if;

  if p_reward is null or p_reward < 100 then
    return jsonb_build_object('success', false, 'message', 'Reward must be at least ₦100.');
  end if;

  if char_length(coalesce(trim(p_title), '')) < 3 then
    return jsonb_build_object('success', false, 'message', 'Give the contract a title.');
  end if;

  select coalesce(marketplace_fee_percent, 0) into v_pct
    from public.admin_game_settings where id = 1;
  v_pct := coalesce(v_pct, 0);
  v_fee := ceil(p_reward * v_pct / 100.0)::integer;

  perform public.abuja_ensure_player_row(v_user);

  select cash into v_cash from public.player_game_states
   where user_id = v_user for update;

  if v_cash < p_reward + v_fee then
    return jsonb_build_object(
      'success', false,
      'message', format('You need ₦%s (reward + %s%% marketplace fee).', p_reward + v_fee, v_pct),
      'wallet_balance', v_cash
    );
  end if;

  update public.player_game_states
     set cash = cash - p_reward - v_fee
   where user_id = v_user;

  insert into public.player_business_contracts
    (client_id, business_owner_id, business_id, title, description, location_id,
     reward, reputation_reward, experience_reward, status)
  values
    (v_user, v_user, p_business_id, trim(p_title), coalesce(trim(p_description), ''),
     p_location_id, p_reward, greatest(0, coalesce(p_reputation_reward, 0)),
     greatest(0, coalesce(p_experience_reward, 0)), 'open')
  returning id into v_id;

  if v_fee > 0 then
    insert into public.marketplace_fees (contract_id, client_id, reward, fee_percent, fee)
    values (v_id, v_user, p_reward, v_pct, v_fee);
  end if;

  return jsonb_build_object(
    'success', true,
    'message', case when v_fee > 0
                    then format('Contract posted. ₦%s marketplace fee paid; the reward is held until the job is done.', v_fee)
                    else 'Contract posted. The reward is held until the job is done.' end,
    'contract_id', v_id,
    'fee', v_fee,
    'fee_percent', v_pct,
    'wallet_balance', v_cash - p_reward - v_fee
  );
end;
$$;

revoke all on function public.create_player_business_contract(text, text, text, text, integer, integer, integer) from public, anon;
grant execute on function public.create_player_business_contract(text, text, text, text, integer, integer, integer) to authenticated;

-- ------------------------------------------------------------
-- 4. Referrals
-- ------------------------------------------------------------
create table if not exists public.referrals (
  referred_id      uuid primary key references auth.users(id) on delete cascade,
  referrer_id      uuid not null references auth.users(id) on delete cascade,
  status           text not null default 'pending' check (status in ('pending', 'rewarded', 'blocked')),
  referrer_reward  integer,
  referred_reward  integer,
  created_at       timestamptz not null default now(),
  rewarded_at      timestamptz,
  check (referrer_id <> referred_id)
);

create index if not exists referrals_referrer_idx
  on public.referrals (referrer_id, status, created_at desc);

alter table public.referrals enable row level security;

drop policy if exists "referrals: read mine" on public.referrals;
create policy "referrals: read mine" on public.referrals
  for select to authenticated
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- ------------------------------------------------------------
-- 5. Rewarded ads
-- ------------------------------------------------------------
create table if not exists public.ad_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  listing_id   uuid references public.business_listings(id) on delete set null,
  kind         text not null check (kind in ('business', 'house', 'network')),
  started_at   timestamptz not null default now(),
  claimed_at   timestamptz,
  reward_type  text check (reward_type in ('cash', 'energy')),
  reward       integer
);

create index if not exists ad_sessions_user_idx
  on public.ad_sessions (user_id, started_at desc);

alter table public.ad_sessions enable row level security;

-- ------------------------------------------------------------
-- Permissions for the server-only functions
-- ------------------------------------------------------------
revoke all on function public.abuja_bump_listing_stat(uuid[], text) from public, anon, authenticated;
revoke all on function public.abuja_extend_listing(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.abuja_bump_listing_stat(uuid[], text) to service_role;
grant execute on function public.abuja_extend_listing(uuid, uuid, text, integer) to service_role;
