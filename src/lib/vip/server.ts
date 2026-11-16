// Abuja Life — server-only VIP + economy helpers.
// Never import this file from a "use client" component.

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  VIP_TIERS,
  type VipTier,
  type VipTierInfo,
} from "@/lib/vip/catalog";

export interface VipStatus {
  active: boolean;
  tier: VipTier | null;
  expiresAt: string | null;
  daysLeft: number;
  info: VipTierInfo | null;
}

export const NO_VIP: VipStatus = {
  active: false,
  tier: null,
  expiresAt: null,
  daysLeft: 0,
  info: null,
};

export async function getVipStatus(
  admin: SupabaseClient,
  userId: string
): Promise<VipStatus> {
  const { data, error } = await admin
    .from("vip_memberships")
    .select("tier, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return NO_VIP;
  }

  const expires = new Date(data.expires_at).getTime();
  const now = Date.now();

  if (!Number.isFinite(expires) || expires <= now) {
    return { ...NO_VIP, expiresAt: data.expires_at };
  }

  const tier = data.tier as VipTier;

  if (!VIP_TIERS[tier]) {
    return NO_VIP;
  }

  return {
    active: true,
    tier,
    expiresAt: data.expires_at,
    daysLeft: Math.ceil((expires - now) / 86_400_000),
    info: VIP_TIERS[tier],
  };
}

export interface PlayerDelta {
  cash?: number;
  energy?: number;
  reputation?: number;
  experience?: number;
  /** Set energy straight to max_energy. */
  refillEnergy?: boolean;
}

export interface PlayerSnapshot {
  cash: number;
  energy: number;
  maxEnergy: number;
  reputation: number;
  jobExperience: number;
}

/**
 * Atomically change a player's stats on the server using the
 * abuja_apply_player_delta() database function (see the SQL
 * migration). Cash and energy can never go below zero, and the
 * function fails with NOT_ENOUGH_ENERGY / NOT_ENOUGH_CASH instead.
 */
export async function applyPlayerDelta(
  admin: SupabaseClient,
  userId: string,
  delta: PlayerDelta
): Promise<PlayerSnapshot> {
  const { data, error } = await admin.rpc("abuja_apply_player_delta", {
    p_user_id: userId,
    p_cash: Math.round(delta.cash ?? 0),
    p_energy: Math.round(delta.energy ?? 0),
    p_reputation: Math.round(delta.reputation ?? 0),
    p_experience: Math.round(delta.experience ?? 0),
    p_refill_energy: delta.refillEnergy === true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    cash: Number(row?.cash ?? 0),
    energy: Number(row?.energy ?? 0),
    maxEnergy: Number(row?.max_energy ?? 100),
    reputation: Number(row?.reputation ?? 0),
    jobExperience: Number(row?.job_experience ?? 0),
  };
}

/** Logged-in user from the request cookies, or null. */
export async function getRequestUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/** Today's date in Abuja (Africa/Lagos) as YYYY-MM-DD. */
export function lagosDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 0 = Sunday … 6 = Saturday, in Abuja time. */
export function lagosWeekday(date = new Date()): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "short",
  }).format(date);

  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

/** Map a database error message to a friendly player message. */
export function friendlyEconomyError(message: string): string {
  if (message.includes("NOT_ENOUGH_ENERGY")) {
    return "You don't have enough energy. Rest, eat, or use a VIP refill.";
  }
  if (message.includes("NOT_ENOUGH_CASH")) {
    return "You don't have enough cash for that.";
  }
  if (message.includes("ECONOMY_DISABLED")) {
    return "The economy is paused by Abuja Life administration right now.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * Reserve one of today's uses of a limited action (perks, VIP places).
 * Race-safe. Call releaseDailyUse() if the action then fails.
 */
export async function reserveDailyUse(
  admin: SupabaseClient,
  userId: string,
  key: string,
  limit: number
): Promise<{ ok: true; usedBefore: number } | { ok: false; reason: "LIMIT" | "BUSY" }> {
  const today = lagosDateKey();

  const { data: existing } = await admin
    .from("vip_perk_claims")
    .select("uses")
    .eq("user_id", userId)
    .eq("perk_id", key)
    .eq("claim_date", today)
    .maybeSingle();

  const usedBefore = Number(existing?.uses ?? 0);

  if (usedBefore >= limit) {
    return { ok: false, reason: "LIMIT" };
  }

  if (!existing) {
    const { error } = await admin.from("vip_perk_claims").insert({
      user_id: userId,
      perk_id: key,
      claim_date: today,
      uses: 1,
    });
    return error ? { ok: false, reason: "BUSY" } : { ok: true, usedBefore };
  }

  const { data } = await admin
    .from("vip_perk_claims")
    .update({ uses: usedBefore + 1, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("perk_id", key)
    .eq("claim_date", today)
    .eq("uses", usedBefore)
    .select("uses");

  return data && data.length > 0 ? { ok: true, usedBefore } : { ok: false, reason: "BUSY" };
}

export async function releaseDailyUse(
  admin: SupabaseClient,
  userId: string,
  key: string,
  usedBefore: number
): Promise<void> {
  if (usedBefore === 0) {
    await admin
      .from("vip_perk_claims")
      .delete()
      .eq("user_id", userId)
      .eq("perk_id", key)
      .eq("claim_date", lagosDateKey());
  } else {
    await admin
      .from("vip_perk_claims")
      .update({ uses: usedBefore })
      .eq("user_id", userId)
      .eq("perk_id", key)
      .eq("claim_date", lagosDateKey());
  }
}

const DAY_MS = 86_400_000;

/** The Saturday (YYYY-MM-DD) of the weekend `date` falls in, or null on weekdays. */
export function weekendKeyFor(date = new Date()): string | null {
  const weekday = lagosWeekday(date);
  if (weekday === 6) return lagosDateKey(date);
  if (weekday === 0) return lagosDateKey(new Date(date.getTime() - DAY_MS));
  return null;
}

/** The Saturday of the most recent weekend that has fully ended. */
export function lastFinishedWeekendKey(date = new Date()): string {
  const weekday = lagosWeekday(date);
  const daysBack = weekday === 6 ? 7 : weekday === 0 ? 8 : weekday + 1;
  return lagosDateKey(new Date(date.getTime() - daysBack * DAY_MS));
}

/** True once Monday 00:00 (Abuja time) after that weekend has passed. */
export function weekendHasEnded(weekendKey: string, date = new Date()): boolean {
  const saturdayStart = Date.parse(`${weekendKey}T00:00:00+01:00`);
  return Number.isFinite(saturdayStart) && date.getTime() >= saturdayStart + 2 * DAY_MS;
}

export function isWeekendKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T12:00:00+01:00`).getUTCDay() === 6;
}
