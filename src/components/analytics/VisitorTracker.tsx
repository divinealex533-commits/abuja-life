"use client";

import { useEffect } from "react";

const VISITOR_STORAGE_KEY = "abujaLifeVisitorId";

function createVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `visitor_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const id = createVisitorId();

    window.localStorage.setItem(VISITOR_STORAGE_KEY, id);

    return id;
  } catch {
    return createVisitorId();
  }
}

export default function VisitorTracker() {
  useEffect(() => {
    let cancelled = false;

    async function trackVisit() {
      try {
        const visitorId = getVisitorId();

        if (cancelled) return;

        await fetch("/api/analytics/visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId,
            pagePath: window.location.pathname,
          }),
          cache: "no-store",
          keepalive: true,
        });
      } catch {
        // Analytics must never break the game.
      }
    }

    trackVisit();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
