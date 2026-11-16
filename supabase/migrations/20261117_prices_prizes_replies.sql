-- ============================================================
-- Abuja Life — admin prices, job licences, weekend cash prizes,
-- and private replies to announcements.
-- Run AFTER 20261116_vip_careers_weekend.sql. Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Admin prices (Admin → Prices). Missing rows = default price.
-- ------------------------------------------------------------
create table if not exists public.price_settings (
  item_key    text primary key,               -- e.g. 'venue:hotel_vip_room'
  method      text not null check (method in ('cash', 'naira', 'free')),
  amount      numeric not null default 0 check (amount >= 0),
  active      boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

alter table public.price_settings enable row level security;
-- No policies: read and written only by the server.

-- ------------------------------------------------------------
-- 2. Career licences (paid once per career)
-- ------------------------------------------------------------
create table if not exists public.career_unlocks (
  user_id      uuid not null references auth.users(id) on delete cascade,
  career_id    text not null,
  method       text not null default 'cash',
  amount_paid  numeric not null default 0,
  unlocked_at  timestamptz not null default now(),
  primary key (user_id, career_id)
);

alter table public.career_unlocks enable row level security;

drop policy if exists "career unlocks: read own" on public.career_unlocks;
create policy "career unlocks: read own" on public.career_unlocks
  for select to authenticated using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. Weekend championship (real-money prizes)
-- ------------------------------------------------------------
alter table public.weekend_reward_settings
  add column if not exists prizes_enabled boolean not null default true;

alter table public.weekend_reward_settings
  add column if not exists prize_amounts integer[] not null default '{20000,10000,5000}';

create table if not exists public.weekend_scores (
  weekend_key  date not null,          -- the Saturday of that weekend
  user_id      uuid not null references auth.users(id) on delete cascade,
  points       integer not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (weekend_key, user_id)
);

create index if not exists weekend_scores_rank_idx
  on public.weekend_scores (weekend_key, points desc, updated_at);

alter table public.weekend_scores enable row level security;

drop policy if exists "weekend scores: read own" on public.weekend_scores;
create policy "weekend scores: read own" on public.weekend_scores
  for select to authenticated using (auth.uid() = user_id);

create table if not exists public.weekend_winners (
  weekend_key           date not null,
  user_id               uuid not null references auth.users(id) on delete cascade,
  place                 integer not null check (place >= 1),
  points                integer not null default 0,
  prize_naira           integer not null check (prize_naira > 0),
  status                text not null default 'awaiting_details'
                        check (status in ('awaiting_details', 'ready_to_pay', 'paid', 'cancelled')),
  bank_name             text,
  account_number        text,
  account_name          text,
  details_submitted_at  timestamptz,
  paid_at               timestamptz,
  paid_reference        text,
  notes                 text,
  created_at            timestamptz not null default now(),
  primary key (weekend_key, place),
  unique (weekend_key, user_id)
);

alter table public.weekend_winners enable row level security;

drop policy if exists "weekend winners: read own" on public.weekend_winners;
create policy "weekend winners: read own" on public.weekend_winners
  for select to authenticated using (auth.uid() = user_id);

-- Add points atomically (called by the server after each weekend shift).
create or replace function public.abuja_add_weekend_points(
  p_user_id      uuid,
  p_weekend_key  date,
  p_points       integer
)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.weekend_scores (weekend_key, user_id, points, updated_at)
  values (p_weekend_key, p_user_id, greatest(0, p_points), now())
  on conflict (weekend_key, user_id)
  do update set points = public.weekend_scores.points + greatest(0, excluded.points),
                updated_at = now()
  returning points;
$$;

revoke all on function public.abuja_add_weekend_points(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.abuja_add_weekend_points(uuid, date, integer) to service_role;

-- ------------------------------------------------------------
-- 4a. Announcements (used by Admin → Announcements).
--     Created here in case it was never set up.
-- ------------------------------------------------------------
create table if not exists public.admin_announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  message     text not null,
  type        text not null default 'info',
  priority    text not null default 'normal'
              check (priority in ('normal', 'important', 'urgent')),
  is_active   boolean not null default true,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz
);

create index if not exists admin_announcements_active_idx
  on public.admin_announcements (is_active, created_at desc);

alter table public.admin_announcements enable row level security;
-- No policies: the server reads and writes announcements.

-- ------------------------------------------------------------
-- 4b. Private replies to announcements
-- ------------------------------------------------------------
create table if not exists public.announcement_replies (
  id                uuid primary key default gen_random_uuid(),
  announcement_id   uuid not null references public.admin_announcements(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  message           text not null check (char_length(message) between 1 and 500),
  admin_reply       text,
  admin_replied_at  timestamptz,
  is_read           boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists announcement_replies_user_idx
  on public.announcement_replies (user_id, announcement_id, created_at);

create index if not exists announcement_replies_unread_idx
  on public.announcement_replies (is_read, created_at desc);

alter table public.announcement_replies enable row level security;

drop policy if exists "announcement replies: read own" on public.announcement_replies;
create policy "announcement replies: read own" on public.announcement_replies
  for select to authenticated using (auth.uid() = user_id);
