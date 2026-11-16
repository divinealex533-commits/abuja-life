"use client";

import { useEffect } from "react";

const STORAGE_KEY = "abujaLifeReferralCode";

/**
 * Remembers an invite code from links like /register?ref=divine and,
 * once the visitor is logged in, records who invited them.
 * Mounted once in the root layout. Renders nothing.
 */
export default function ReferralCapture() {
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("ref");
      if (fromUrl && /^[a-zA-Z0-9_]{3,30}$/.test(fromUrl)) {
        window.localStorage.setItem(STORAGE_KEY, fromUrl.toLowerCase());
      }

      const code = window.localStorage.getItem(STORAGE_KEY);
      if (!code) return;

      void fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }).then((response) => {
        // Not logged in yet → keep the code and try again on a later page.
        if (response.status === 401) return;
        window.localStorage.removeItem(STORAGE_KEY);
      });
    } catch {
      // Storage blocked (private mode): skip silently.
    }
  }, []);

  return null;
}
