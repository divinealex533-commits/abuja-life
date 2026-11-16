-- ============================================================
-- Abuja Life — BASE GAME TABLES
--
-- Creates the tables the game already uses but which were never
-- set up in the database: profiles, payments, admin settings,
-- friends, chat, messages, voice notes, notifications, contracts,
-- tasks and visitor analytics.
--
-- Safe to run more than once. Existing tables are left alone.
-- Run this in Supabase → SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Admin game settings (the switches in Admin → Game Settings)
-- ------------------------------------------------------------
create table if not exists public.admin_game_settings (
  id                     integer primary key default 1 check (id = 1),
  game_name              text not null default 'Abuja Life',
  maintenance_mode       boolean not null default false,
  registrations_enabled  boolean not null default true,
  multiplayer_enabled    boolean not null default true,
  economy_enabled        boolean not null default true,
  announcements_enabled  boolean not null default true,
  tasks_enabled          boolean not null default true,
  payments_enabled       boolean not null default true,
  default_player_cash    integer not null default 10000,
  max_player_energy      integer not null default 100,
  updated_by             uuid,
  updated_at             timestamptz not null default now()
);

insert into public.admin_game_settings (id) values (1)
  on conflict (id) do nothing;

alter table public.admin_game_settings enable row level security;

drop policy if exists "settings: read" on public.admin_game_settings;
create policy "settings: read" on public.admin_game_settings
  for select using (true);

-- Keep updated_at fresh on every change.
create or replace function public.abuja_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists admin_game_settings_touch on public.admin_game_settings;
create trigger admin_game_settings_touch
  before update on public.admin_game_settings
  for each row execute function public.abuja_touch_updated_at();

-- ------------------------------------------------------------
-- 2. Player profiles (public identity: name, avatar, location)
-- ------------------------------------------------------------
create table if not exists public.player_profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  username             text not null unique
                       check (char_length(username) between 3 and 30),
  display_name         text not null check (char_length(display_name) between 1 and 60),
  avatar               text not null default '🧑🏽',
  current_location_id  text not null default 'garki',
  reputation           integer not null default 0,
  level                integer not null default 1,
  experience           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists player_profiles_location_idx
  on public.player_profiles (current_location_id, updated_at desc);

alter table public.player_profiles enable row level security;

drop policy if exists "profiles: read all" on public.player_profiles;
create policy "profiles: read all" on public.player_profiles
  for select to authenticated using (true);

drop policy if exists "profiles: insert own" on public.player_profiles;
create policy "profiles: insert own" on public.player_profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.player_profiles;
create policy "profiles: update own" on public.player_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 3. Payments (every Paystack payment)
-- ------------------------------------------------------------
create table if not exists public.payment_transactions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references auth.users(id) on delete set null,
  provider                 text not null default 'paystack',
  reference                text not null unique,
  amount                   numeric not null check (amount >= 0),
  currency                 text not null default 'NGN',
  purpose                  text not null default 'other',
  status                   text not null default 'pending'
                           check (status in ('pending', 'success', 'failed', 'refunded', 'abandoned')),
  provider_transaction_id  text,
  customer_email           text,
  paid_at                  timestamptz,
  metadata                 jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists payment_transactions_user_idx
  on public.payment_transactions (user_id, created_at desc);
create index if not exists payment_transactions_status_idx
  on public.payment_transactions (status, created_at desc);

drop trigger if exists payment_transactions_touch on public.payment_transactions;
create trigger payment_transactions_touch
  before update on public.payment_transactions
  for each row execute function public.abuja_touch_updated_at();

alter table public.payment_transactions enable row level security;

drop policy if exists "payments: read own" on public.payment_transactions;
create policy "payments: read own" on public.payment_transactions
  for select to authenticated using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. Friends
-- ------------------------------------------------------------
create table if not exists public.friend_requests (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references auth.users(id) on delete cascade,
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  check (sender_id <> recipient_id)
);

create index if not exists friend_requests_recipient_idx
  on public.friend_requests (recipient_id, status);
create index if not exists friend_requests_sender_idx
  on public.friend_requests (sender_id, status);

-- Only one pending request between the same two players.
create unique index if not exists friend_requests_one_pending_idx
  on public.friend_requests (least(sender_id, recipient_id), greatest(sender_id, recipient_id))
  where status = 'pending';

alter table public.friend_requests enable row level security;

drop policy if exists "friend requests: read mine" on public.friend_requests;
create policy "friend requests: read mine" on public.friend_requests
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "friend requests: send" on public.friend_requests;
create policy "friend requests: send" on public.friend_requests
  for insert to authenticated
  with check (auth.uid() = sender_id and status = 'pending');

drop policy if exists "friend requests: respond" on public.friend_requests;
create policy "friend requests: respond" on public.friend_requests
  for update to authenticated
  using (auth.uid() = recipient_id or auth.uid() = sender_id)
  with check (auth.uid() = recipient_id or auth.uid() = sender_id);

create table if not exists public.friendships (
  id             uuid primary key default gen_random_uuid(),
  player_one_id  uuid not null references auth.users(id) on delete cascade,
  player_two_id  uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  check (player_one_id <> player_two_id),
  unique (player_one_id, player_two_id)
);

alter table public.friendships enable row level security;

drop policy if exists "friendships: read mine" on public.friendships;
create policy "friendships: read mine" on public.friendships
  for select to authenticated
  using (auth.uid() = player_one_id or auth.uid() = player_two_id);

-- A friendship can only be created by someone who accepted a request.
drop policy if exists "friendships: create" on public.friendships;
create policy "friendships: create" on public.friendships
  for insert to authenticated
  with check (
    (auth.uid() = player_one_id or auth.uid() = player_two_id)
    and exists (
      select 1 from public.friend_requests fr
      where fr.recipient_id = auth.uid()
        and fr.status in ('pending', 'accepted')
        and (
          (fr.sender_id = player_one_id and fr.recipient_id = player_two_id)
          or (fr.sender_id = player_two_id and fr.recipient_id = player_one_id)
        )
    )
  );

drop policy if exists "friendships: remove" on public.friendships;
create policy "friendships: remove" on public.friendships
  for delete to authenticated
  using (auth.uid() = player_one_id or auth.uid() = player_two_id);

-- ------------------------------------------------------------
-- 5. Notifications (the bell)
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references auth.users(id) on delete cascade,
  type        text not null default 'system',
  title       text not null,
  message     text not null default '',
  action_url  text,
  actor_id    uuid references auth.users(id) on delete set null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_player_idx
  on public.notifications (player_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications: read own" on public.notifications;
create policy "notifications: read own" on public.notifications
  for select to authenticated using (auth.uid() = player_id);

-- Players can notify others (friend requests, messages) as themselves.
drop policy if exists "notifications: create" on public.notifications;
create policy "notifications: create" on public.notifications
  for insert to authenticated
  with check (auth.uid() = actor_id or auth.uid() = player_id);

drop policy if exists "notifications: mark read" on public.notifications;
create policy "notifications: mark read" on public.notifications
  for update to authenticated
  using (auth.uid() = player_id) with check (auth.uid() = player_id);

drop policy if exists "notifications: delete own" on public.notifications;
create policy "notifications: delete own" on public.notifications
  for delete to authenticated using (auth.uid() = player_id);

-- ------------------------------------------------------------
-- 6. Location chat
-- ------------------------------------------------------------
create table if not exists public.location_chat_messages (
  id           uuid primary key default gen_random_uuid(),
  location_id  text not null,
  player_id    uuid not null references auth.users(id) on delete cascade,
  message      text not null check (char_length(message) between 1 and 500),
  created_at   timestamptz not null default now()
);

create index if not exists location_chat_location_idx
  on public.location_chat_messages (location_id, created_at desc);

alter table public.location_chat_messages enable row level security;

drop policy if exists "location chat: read" on public.location_chat_messages;
create policy "location chat: read" on public.location_chat_messages
  for select to authenticated using (true);

drop policy if exists "location chat: post as self" on public.location_chat_messages;
create policy "location chat: post as self" on public.location_chat_messages
  for insert to authenticated with check (auth.uid() = player_id);

-- ------------------------------------------------------------
-- 7. Private messages and voice notes
-- ------------------------------------------------------------
create table if not exists public.private_messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references auth.users(id) on delete cascade,
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  message       text not null check (char_length(message) between 1 and 2000),
  created_at    timestamptz not null default now()
);

create index if not exists private_messages_pair_idx
  on public.private_messages (sender_id, recipient_id, created_at);
create index if not exists private_messages_recipient_idx
  on public.private_messages (recipient_id, created_at desc);

alter table public.private_messages enable row level security;

drop policy if exists "private messages: read mine" on public.private_messages;
create policy "private messages: read mine" on public.private_messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "private messages: send as self" on public.private_messages;
create policy "private messages: send as self" on public.private_messages
  for insert to authenticated with check (auth.uid() = sender_id);

create table if not exists public.private_voice_notes (
  id                uuid primary key default gen_random_uuid(),
  sender_id         uuid not null references auth.users(id) on delete cascade,
  recipient_id      uuid not null references auth.users(id) on delete cascade,
  storage_path      text not null unique,
  duration_seconds  integer not null default 0 check (duration_seconds between 0 and 600),
  created_at        timestamptz not null default now()
);

create index if not exists private_voice_notes_pair_idx
  on public.private_voice_notes (sender_id, recipient_id, created_at);

alter table public.private_voice_notes enable row level security;

drop policy if exists "voice notes: read mine" on public.private_voice_notes;
create policy "voice notes: read mine" on public.private_voice_notes
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "voice notes: send as self" on public.private_voice_notes;
create policy "voice notes: send as self" on public.private_voice_notes
  for insert to authenticated with check (auth.uid() = sender_id);

-- Private storage bucket for the audio files: <user id>/<file>.
insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;

drop policy if exists "voice-notes: upload own folder" on storage.objects;
create policy "voice-notes: upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "voice-notes: delete own" on storage.objects;
create policy "voice-notes: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "voice-notes: listen if sender or recipient" on storage.objects;
create policy "voice-notes: listen if sender or recipient" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'voice-notes'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.private_voice_notes v
        where v.storage_path = storage.objects.name
          and v.recipient_id = auth.uid()
      )
    )
  );

-- ------------------------------------------------------------
-- 8. Wallet (reads the player's game cash)
-- ------------------------------------------------------------
create or replace view public.player_wallets
with (security_invoker = true) as
  select user_id as player_id, cash as balance
  from public.player_game_states;

grant select on public.player_wallets to authenticated;

-- ------------------------------------------------------------
-- 9. Player business contracts (money held until the job is done)
-- ------------------------------------------------------------
create table if not exists public.player_business_contracts (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references auth.users(id) on delete cascade,
  business_owner_id  uuid references auth.users(id) on delete set null,
  business_id        text,
  mission_id         text,
  worker_id          uuid references auth.users(id) on delete set null,
  title              text not null check (char_length(title) between 3 and 120),
  description        text not null default '' check (char_length(description) <= 1000),
  location_id        text,
  reward             integer not null check (reward > 0),
  reputation_reward  integer not null default 0 check (reputation_reward >= 0),
  experience_reward  integer not null default 0 check (experience_reward >= 0),
  status             text not null default 'open'
                     check (status in ('open', 'accepted', 'in_progress', 'completed', 'cancelled')),
  created_at         timestamptz not null default now(),
  accepted_at        timestamptz,
  completed_at       timestamptz
);

create index if not exists contracts_status_idx
  on public.player_business_contracts (status, created_at desc);

alter table public.player_business_contracts enable row level security;

drop policy if exists "contracts: read open or mine" on public.player_business_contracts;
create policy "contracts: read open or mine" on public.player_business_contracts
  for select to authenticated
  using (
    status = 'open'
    or auth.uid() in (client_id, worker_id, business_owner_id)
  );

-- No direct inserts: contracts are created through
-- create_player_business_contract() so the reward is held safely.

-- Accept an open contract (become the worker).
drop policy if exists "contracts: accept" on public.player_business_contracts;
create policy "contracts: accept" on public.player_business_contracts
  for update to authenticated
  using (status = 'open' and worker_id is null and client_id <> auth.uid())
  with check (worker_id = auth.uid() and status = 'accepted');

-- Worker starts the job.
drop policy if exists "contracts: start" on public.player_business_contracts;
create policy "contracts: start" on public.player_business_contracts
  for update to authenticated
  using (worker_id = auth.uid() and status = 'accepted')
  with check (worker_id = auth.uid() and status = 'in_progress');

-- Client/owner cancels (reward is refunded by the trigger below).
drop policy if exists "contracts: cancel" on public.player_business_contracts;
create policy "contracts: cancel" on public.player_business_contracts
  for update to authenticated
  using (auth.uid() in (client_id, business_owner_id) and status in ('open', 'accepted'))
  with check (status = 'cancelled');

-- Players may only change the status/worker fields, never the reward.
create or replace function public.abuja_contract_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('abuja.contract_internal', true) = 'on' then
    return new;
  end if;

  if new.reward <> old.reward
     or new.reputation_reward <> old.reputation_reward
     or new.experience_reward <> old.experience_reward
     or new.client_id <> old.client_id
     or new.business_owner_id is distinct from old.business_owner_id then
    raise exception 'CONTRACT_FIELDS_LOCKED';
  end if;

  if new.status = 'completed' then
    raise exception 'USE_COMPLETE_FUNCTION';
  end if;

  -- Refund the held reward when a contract is cancelled.
  if new.status = 'cancelled' and old.status in ('open', 'accepted') then
    update public.player_game_states
       set cash = cash + old.reward
     where user_id = old.client_id;
  end if;

  return new;
end;
$$;

drop trigger if exists player_business_contracts_guard on public.player_business_contracts;
create trigger player_business_contracts_guard
  before update on public.player_business_contracts
  for each row execute function public.abuja_contract_guard();

-- Create a contract and hold the reward from the client's cash.
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

  perform public.abuja_ensure_player_row(v_user);

  select cash into v_cash from public.player_game_states
   where user_id = v_user for update;

  if v_cash < p_reward then
    return jsonb_build_object(
      'success', false,
      'message', 'You do not have enough money in your wallet.',
      'wallet_balance', v_cash
    );
  end if;

  update public.player_game_states set cash = cash - p_reward where user_id = v_user;

  insert into public.player_business_contracts
    (client_id, business_owner_id, business_id, title, description, location_id,
     reward, reputation_reward, experience_reward, status)
  values
    (v_user, v_user, p_business_id, trim(p_title), coalesce(trim(p_description), ''),
     p_location_id, p_reward, greatest(0, coalesce(p_reputation_reward, 0)),
     greatest(0, coalesce(p_experience_reward, 0)), 'open')
  returning id into v_id;

  return jsonb_build_object(
    'success', true,
    'message', 'Contract posted. The reward is held until the job is done.',
    'contract_id', v_id,
    'wallet_balance', v_cash - p_reward
  );
end;
$$;

-- Worker finishes the job and is paid from the held reward.
create or replace function public.complete_player_business_contract(p_contract_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_contract public.player_business_contracts%rowtype;
  v_balance numeric;
begin
  select * into v_contract from public.player_business_contracts
   where id = p_contract_id for update;

  if not found then
    raise exception 'Contract not found.';
  end if;

  if v_contract.worker_id is distinct from v_user then
    raise exception 'Only the worker can complete this contract.';
  end if;

  if v_contract.status not in ('accepted', 'in_progress') then
    raise exception 'This contract is not active.';
  end if;

  perform set_config('abuja.contract_internal', 'on', true);

  update public.player_business_contracts
     set status = 'completed', completed_at = now()
   where id = p_contract_id;

  perform public.abuja_ensure_player_row(v_user);

  update public.player_game_states
     set cash = cash + v_contract.reward,
         reputation = reputation + v_contract.reputation_reward,
         job_experience = job_experience + v_contract.experience_reward
   where user_id = v_user
  returning cash into v_balance;

  perform set_config('abuja.contract_internal', 'off', true);

  return jsonb_build_object(
    'success', true,
    'contract_id', v_contract.id,
    'worker_id', v_user,
    'reward', v_contract.reward,
    'worker_balance', v_balance
  );
end;
$$;

revoke all on function public.create_player_business_contract(text, text, text, text, integer, integer, integer) from public, anon;
revoke all on function public.complete_player_business_contract(uuid) from public, anon;
grant execute on function public.create_player_business_contract(text, text, text, text, integer, integer, integer) to authenticated;
grant execute on function public.complete_player_business_contract(uuid) to authenticated;

-- ------------------------------------------------------------
-- 10. Admin tasks
-- ------------------------------------------------------------
create table if not exists public.admin_tasks (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text not null default '',
  reward_amount     integer not null default 0 check (reward_amount >= 0),
  reward_type       text not null default 'cash'
                    check (reward_type in ('cash', 'reputation', 'experience', 'xp')),
  assigned_user_id  uuid references auth.users(id) on delete cascade,
  max_completions   integer,
  deadline          timestamptz,
  is_active         boolean not null default true,
  created_by        uuid,
  created_at        timestamptz not null default now()
);

alter table public.admin_tasks enable row level security;

create table if not exists public.admin_task_completions (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.admin_tasks(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  reward_paid   boolean not null default false,
  completed_at  timestamptz not null default now(),
  unique (task_id, user_id)
);

alter table public.admin_task_completions enable row level security;

-- ------------------------------------------------------------
-- 11. Admin audit log of player changes
-- ------------------------------------------------------------
create table if not exists public.admin_player_actions (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid references auth.users(id) on delete set null,
  admin_id      uuid,
  action        text not null,
  reason        text,
  amount        numeric,
  before_value  jsonb,
  after_value   jsonb,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists admin_player_actions_player_idx
  on public.admin_player_actions (player_id, created_at desc);

alter table public.admin_player_actions enable row level security;

-- ------------------------------------------------------------
-- 12. Visitor analytics (Admin → Visitors)
-- ------------------------------------------------------------
create table if not exists public.site_visitors (
  id             uuid primary key default gen_random_uuid(),
  visitor_id     text not null,
  user_id        uuid references auth.users(id) on delete set null,
  page_path      text,
  visit_date     date not null default current_date,
  visit_count    integer not null default 1,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  unique (visitor_id, visit_date)
);

create index if not exists site_visitors_last_seen_idx
  on public.site_visitors (last_seen_at desc);

alter table public.site_visitors enable row level security;

-- ------------------------------------------------------------
-- 13. Live updates (chat, messages, friends, notifications)
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'notifications', 'private_messages', 'location_chat_messages',
      'friend_requests', 'friendships', 'player_business_contracts'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 14. Keep each player's money private
--     (the game only reads/writes a player's own row from the
--      browser; admin pages and server code use the service key)
-- ------------------------------------------------------------
alter table public.player_game_states enable row level security;

drop policy if exists "game state: read own" on public.player_game_states;
create policy "game state: read own" on public.player_game_states
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "game state: create own" on public.player_game_states;
create policy "game state: create own" on public.player_game_states
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "game state: update own" on public.player_game_states;
create policy "game state: update own" on public.player_game_states
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
