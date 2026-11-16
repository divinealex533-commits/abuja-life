"use client";

import { useEffect, useState } from "react";

import type { EffectivePrice } from "@/lib/pricing/items";

let cache: Record<string, EffectivePrice> | null = null;
let pending: Promise<Record<string, EffectivePrice>> | null = null;

function fetchPrices() {
  if (!pending) {
    pending = fetch("/api/prices", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        cache = data?.prices ?? {};
        return cache!;
      })
      .catch(() => ({}))
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

/** Current prices set by the admin (shared across components). */
export function usePrices() {
  const [prices, setPrices] = useState<Record<string, EffectivePrice>>(cache ?? {});
  const [loaded, setLoaded] = useState(cache !== null);

  useEffect(() => {
    let mounted = true;
    void fetchPrices().then((result) => {
      if (!mounted) return;
      setPrices(result);
      setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { prices, loaded };
}
