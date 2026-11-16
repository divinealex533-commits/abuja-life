"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { categoryInfo, districtLabel, whatsappLink, type PublicListing } from "@/lib/business/catalog";
import { formatNaira } from "@/lib/vip/catalog";
import { syncPlayerSnapshot } from "@/lib/vip/client";

type Status = {
  loggedIn: boolean;
  enabled: boolean;
  seconds: number;
  cash: number;
  energy: number;
  remaining: number;
  limit: number;
};

type Session = {
  sessionId: string;
  seconds: number;
  kind: "business" | "house" | "network";
  listing: PublicListing | null;
  cash: number;
  energy: number;
};

/** Watch-an-ad-for-a-reward card. Server checks the watch time and daily limit. */
export default function RewardedAdPanel({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/ads/rewarded", { cache: "no-store" });
      setStatus(await r.json());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [load]);

  async function start() {
    setBusy(true);
    setMessage(null);
    try {
      const r = await fetch("/api/ads/rewarded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        setMessage({ text: d?.error || "No ad available right now.", ok: false });
        return;
      }
      setSession(d);
      setLeft(d.seconds);
      timer.current = window.setInterval(() => {
        setLeft((s) => {
          if (s <= 1 && timer.current) window.clearInterval(timer.current);
          return Math.max(0, s - 1);
        });
      }, 1000);
    } finally {
      setBusy(false);
    }
  }

  async function claim(rewardType: "cash" | "energy") {
    if (!session) return;
    setBusy(true);
    try {
      const r = await fetch("/api/ads/rewarded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", sessionId: session.sessionId, rewardType }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        setMessage({ text: d?.error || "Could not collect.", ok: false });
      } else {
        if (d?.player) syncPlayerSnapshot(d.player);
        setMessage({
          text: rewardType === "cash" ? `+${formatNaira(d.reward)} added!` : `+${d.reward} energy!`,
          ok: true,
        });
      }
    } finally {
      setSession(null);
      setBusy(false);
      void load();
    }
  }

  function close() {
    if (timer.current) window.clearInterval(timer.current);
    setSession(null);
    setMessage({ text: "Ad closed early. No reward this time.", ok: false });
  }

  if (!status || !status.enabled) return null;

  const listing = session?.listing;

  return (
    <section className={`rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.12] via-[#071216] to-transparent p-6 sm:p-8 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">🎬 Free rewards</div>
          <h2 className="mt-1 text-2xl font-black">Watch an ad, get paid</h2>
          <p className="mt-1 text-sm text-white/50">
            {status.seconds}-second ad → {formatNaira(status.cash)} or +{status.energy} energy.{" "}
            {status.loggedIn && <span className="font-bold text-white/70">{status.remaining}/{status.limit} left today.</span>}
          </p>
        </div>
        {status.loggedIn ? (
          <button
            type="button"
            disabled={busy || status.remaining === 0 || session !== null}
            onClick={start}
            className="rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-black text-black hover:bg-cyan-300 disabled:bg-white/10 disabled:text-white/40"
          >
            {status.remaining === 0 ? "COME BACK TOMORROW" : busy ? "LOADING…" : "▶ WATCH AD"}
          </button>
        ) : (
          <Link href="/login" className="rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-black text-black">LOG IN TO EARN</Link>
        )}
      </div>

      {message && (
        <div className={`mt-4 text-sm font-bold ${message.ok ? "text-emerald-300" : "text-red-300"}`}>{message.text}</div>
      )}

      {session && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b1114] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">Ad</span>
              {left > 0 ? (
                <span className="text-white/60">Reward in {left}s</span>
              ) : (
                <span className="text-emerald-300">Reward ready!</span>
              )}
            </div>

            {listing ? (
              <div className="mt-6 text-center">
                <div className="text-6xl">{listing.emoji}</div>
                <h3 className="mt-3 text-2xl font-black">{listing.name}</h3>
                <div className="text-xs font-bold text-white/45">
                  {categoryInfo(listing.category).label} · 📍 {districtLabel(listing.district)}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/70">{listing.description}</p>
                {listing.offerText && (
                  <div className="mt-3 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">🎁 {listing.offerText}</div>
                )}
                {listing.whatsapp && (
                  <a
                    href={whatsappLink(listing.whatsapp, listing.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-xl bg-[#25D366] px-4 py-2 text-xs font-black text-black"
                  >
                    WhatsApp {listing.name}
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-6 text-center">
                <div className="text-6xl">👑</div>
                <h3 className="mt-3 text-2xl font-black">Live the VIP life</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Double pay on every shift, elite careers like Surgeon and Diplomat, private lounges and up to 5× weekend rewards.
                </p>
                <Link href="/vip" className="mt-4 inline-block rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-black">
                  See VIP from ₦300
                </Link>
                <p className="mt-4 text-[11px] text-white/35">
                  Own a business? <Link href="/advertise" className="underline">Put your ad here</Link>.
                </p>
              </div>
            )}

            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-cyan-400 transition-all duration-1000"
                style={{ width: `${((session.seconds - left) / session.seconds) * 100}%` }}
              />
            </div>

            {left > 0 ? (
              <button type="button" onClick={close} className="mt-4 w-full text-xs font-bold text-white/40 hover:text-white/70">
                Close (no reward)
              </button>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" disabled={busy} onClick={() => claim("cash")} className="rounded-2xl bg-emerald-400 py-3 text-sm font-black text-black disabled:opacity-50">
                  {formatNaira(session.cash)}
                </button>
                <button type="button" disabled={busy} onClick={() => claim("energy")} className="rounded-2xl bg-cyan-400 py-3 text-sm font-black text-black disabled:opacity-50">
                  +{session.energy} energy
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
