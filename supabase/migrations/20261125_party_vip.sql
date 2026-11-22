-- ============================================================
-- Abuja Life — PARTY VIP SECTION
--   Players can pay to stand in a party's VIP balcony.
-- Run AFTER 20261124_cars.sql. Safe to re-run.
-- ============================================================

alter table public.party_guests
  add column if not exists vip boolean not null default false;
