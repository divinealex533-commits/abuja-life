"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { loadPlayerState, savePlayerState } from "@/lib/game/player";
import { decayNeeds, moodInfo, moodScore, normalizeNeeds, type Needs } from "@/lib/life/needs";

export interface LifeState {
  loaded: boolean;
  loggedIn: boolean;
  /** False until 20261121_playable_life.sql has been run. */
  ready: boolean;
  needs: Needs;
  cash: number;
  energy: number;
  maxEnergy: number;
  /** When `needs` were measured (ms), used to keep them dropping live. */
  measuredAt: number;
}

let state: LifeState = {
  loaded: false,
  loggedIn: false,
  ready: false,
  needs: normalizeNeeds(null),
  cash: 0,
  energy: 0,
  maxEnergy: 100,
  measuredAt: Date.now(),
};

const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function emit(next: Partial<LifeState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function syncPlayer(cash: number, energy: number, maxEnergy: number) {
  const current = loadPlayerState();
  if (current.cash === cash && current.energy === energy && current.maxEnergy === maxEnergy) return;
  savePlayerState({ ...current, cash, energy, maxEnergy });
  window.dispatchEvent(new Event("abujaLifePlayerUpdated"));
}

function absorb(data: Record<string, unknown>) {
  const cash = Number(data.cash ?? state.cash);
  const energy = Number(data.energy ?? state.energy);
  const maxEnergy = Number(data.maxEnergy ?? state.maxEnergy);
  emit({
    loaded: true,
    loggedIn: data.loggedIn !== false,
    ready: Boolean(data.ready),
    needs: normalizeNeeds(data.needs),
    cash,
    energy,
    maxEnergy,
    measuredAt: Date.now(),
  });
  if (data.loggedIn !== false) syncPlayer(cash, energy, maxEnergy);
}

/** Reload needs, cash and energy from the server. */
export function refreshLife(): Promise<void> {
  if (inflight) return inflight;
  inflight = fetch("/api/life", { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => absorb(data))
    .catch(() => emit({ loaded: true }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Finish an activity on the server. Returns an error message or null. */
export async function finishActivity(activityId: string, locationId: string): Promise<string | null> {
  try {
    const res = await fetch("/api/life", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId, locationId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || "That didn't work. Try again.";
    absorb({ loggedIn: true, ...data });
    return null;
  } catch {
    return "Network problem. Try again.";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Live needs for the current player. Needs keep dropping every second
 * on screen, and are re-checked with the server every 2 minutes.
 */
export function useLife() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => state);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!state.loaded) void refreshLife();
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(() => void refreshLife(), 120_000);
    const onPlayer = () => {
      const p = loadPlayerState();
      if (p.cash !== state.cash || p.energy !== state.energy) {
        emit({ cash: p.cash, energy: p.energy, maxEnergy: p.maxEnergy });
      }
    };
    window.addEventListener("abujaLifePlayerUpdated", onPlayer);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
      window.removeEventListener("abujaLifePlayerUpdated", onPlayer);
    };
  }, []);

  const needs = decayNeeds(snapshot.needs, snapshot.measuredAt, Math.max(now, snapshot.measuredAt));
  const mood = moodScore(needs, snapshot.energy, snapshot.maxEnergy);
  return { ...snapshot, needs, mood, moodInfo: moodInfo(mood) };
}

/** The player's current location id, kept in step with travel. */
export function useCurrentLocation(): string {
  const [locationId, setLocationId] = useState("garki");
  useEffect(() => {
    const read = () => setLocationId(loadPlayerState().currentLocationId);
    read();
    window.addEventListener("abujaLifePlayerUpdated", read);
    return () => window.removeEventListener("abujaLifePlayerUpdated", read);
  }, []);
  return locationId;
}
