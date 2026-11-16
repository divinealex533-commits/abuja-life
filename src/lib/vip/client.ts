"use client";

import { useCallback, useEffect, useState } from "react";

import { loadPlayerState, savePlayerState } from "@/lib/game/player";
import type { VipTier, VipTierInfo } from "@/lib/vip/catalog";

export interface ClientVipStatus {
  active: boolean;
  tier: VipTier | null;
  expiresAt: string | null;
  daysLeft: number;
  info: VipTierInfo | null;
}

export interface PlayerSnapshot {
  cash: number;
  energy: number;
  maxEnergy: number;
  reputation: number;
  jobExperience: number;
}

const EMPTY: ClientVipStatus = {
  active: false,
  tier: null,
  expiresAt: null,
  daysLeft: 0,
  info: null,
};

/**
 * After the server changes the player's stats, copy them into the
 * local game state and tell every open page (the game already
 * listens for "abujaLifePlayerUpdated"). This stops pages from
 * saving old numbers over the new ones.
 */
export function syncPlayerSnapshot(snapshot: PlayerSnapshot) {
  const current = loadPlayerState();

  savePlayerState({
    ...current,
    cash: snapshot.cash,
    energy: snapshot.energy,
    maxEnergy: snapshot.maxEnergy,
    reputation: snapshot.reputation,
    jobExperience: snapshot.jobExperience,
  });

  window.dispatchEvent(new Event("abujaLifePlayerUpdated"));
}

export function useVip() {
  const [vip, setVip] = useState<ClientVipStatus>(EMPTY);
  const [perkUsesToday, setPerkUsesToday] = useState<Record<string, number>>({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/vip/status", { cache: "no-store" });
      const data = await response.json();
      setVip(data?.vip ?? EMPTY);
      setPerkUsesToday(data?.perkUsesToday ?? {});
      setLoggedIn(Boolean(data?.loggedIn));
    } catch {
      setVip(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onChange = () => void refresh();
    window.addEventListener("abujaLifeVipUpdated", onChange);
    return () => window.removeEventListener("abujaLifeVipUpdated", onChange);
  }, [refresh]);

  return { vip, perkUsesToday, loggedIn, loading, refresh };
}

/**
 * Start a Paystack checkout for a store product.
 * Returns an error message, or redirects the browser to Paystack.
 */
export async function startCheckout(productId: string): Promise<string | null> {
  try {
    const response = await fetch("/api/payments/paystack/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      window.location.href = "/login";
      return null;
    }

    if (!response.ok || !data?.authorizationUrl) {
      return data?.error || "Could not start payment. Please try again.";
    }

    window.location.href = data.authorizationUrl;
    return null;
  } catch {
    return "Network error. Check your connection and try again.";
  }
}
