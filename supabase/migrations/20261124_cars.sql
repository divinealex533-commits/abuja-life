-- ============================================================
-- Abuja Life — CARS
--   Cars bought at the dealership are saved here, so they're paid
--   for with your real game cash and follow you to any device.
-- Run AFTER 20261123_parties.sql. Safe to re-run.
-- ============================================================

create table if not exists public.player_vehicles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  vehicle_id   text not null,
  paint        text not null default 'black',
  price_paid   bigint not null default 0,
  purchased_at timestamptz not null default now()
);
create index if not exists player_vehicles_user_idx on public.player_vehicles (user_id, purchased_at desc);

alter table public.player_vehicles enable row level security;
drop policy if exists "player vehicles: read own" on public.player_vehicles;
create policy "player vehicles: read own" on public.player_vehicles
  for select to authenticated using (auth.uid() = user_id);
