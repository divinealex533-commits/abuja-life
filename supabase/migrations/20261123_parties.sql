-- ============================================================
-- Abuja Life — PARTIES
--   Players throw parties, others join, dance and spray money.
--   Sprays move real in-game cash from one player to another.
-- Run AFTER 20261122_control_room.sql. Safe to re-run.
-- ============================================================

create table if not exists public.parties (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null,
  title       text not null,
  theme       text not null default 'owambe',
  location_id text not null default 'wuse-2',
  created_at  timestamptz not null default now(),
  ends_at     timestamptz not null
);
create index if not exists parties_live_idx on public.parties (ends_at desc);

create table if not exists public.party_guests (
  party_id       uuid not null references public.parties(id) on delete cascade,
  user_id        uuid not null,
  joined_at      timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  last_vibe_at   timestamptz,
  sprayed_total  bigint not null default 0,
  received_total bigint not null default 0,
  primary key (party_id, user_id)
);

create table if not exists public.party_sprays (
  id         uuid primary key default gen_random_uuid(),
  party_id   uuid not null references public.parties(id) on delete cascade,
  from_id    uuid not null,
  to_id      uuid not null,
  amount     integer not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists party_sprays_party_idx on public.party_sprays (party_id, created_at desc);
create index if not exists party_sprays_from_idx on public.party_sprays (from_id, created_at desc);

alter table public.parties enable row level security;
alter table public.party_guests enable row level security;
alter table public.party_sprays enable row level security;
-- No policies: the game server reads and writes these.

-- Move spray money from one player to another in one safe step.
create or replace function public.abuja_party_spray(
  p_party_id uuid, p_from uuid, p_to uuid, p_amount integer
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cash bigint;
begin
  if p_amount <= 0 or p_from = p_to then
    raise exception 'INVALID_SPRAY';
  end if;

  update public.player_game_states
     set cash = cash - p_amount
   where user_id = p_from and cash >= p_amount
  returning cash into v_cash;
  if not found then
    raise exception 'NOT_ENOUGH_CASH';
  end if;

  update public.player_game_states
     set cash = cash + p_amount
   where user_id = p_to;
  if not found then
    raise exception 'RECIPIENT_MISSING';
  end if;

  insert into public.party_sprays (party_id, from_id, to_id, amount)
  values (p_party_id, p_from, p_to, p_amount);

  update public.party_guests set sprayed_total = sprayed_total + p_amount
   where party_id = p_party_id and user_id = p_from;
  update public.party_guests set received_total = received_total + p_amount
   where party_id = p_party_id and user_id = p_to;

  return v_cash;
end;
$$;

revoke all on function public.abuja_party_spray(uuid, uuid, uuid, integer) from public, anon, authenticated;
