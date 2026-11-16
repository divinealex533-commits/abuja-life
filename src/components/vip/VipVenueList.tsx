"use client";

import Link from "next/link";
import { useState } from "react";

import { formatPrice } from "@/lib/pricing/items";
import { usePrices } from "@/lib/pricing/client";
import { tierAtLeast, VIP_TIERS } from "@/lib/vip/catalog";
import { startCheckout, syncPlayerSnapshot, type ClientVipStatus } from "@/lib/vip/client";
import { describeReward, type VipArea } from "@/lib/vip/perks";
import { getVenuesForArea } from "@/lib/vip/venues";

/** Bookable VIP places (hotel rooms, VIP rooms…) for one area. */
export default function VipVenueList({
  area,
  vip,
  perkUsesToday,
  onChanged,
}: {
  area: VipArea;
  vip: ClientVipStatus;
  perkUsesToday: Record<string, number>;
  onChanged: () => void;
}) {
  const { prices } = usePrices();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const venues = getVenuesForArea(area).filter(
    (venue) => prices[`venue:${venue.id}`]?.active !== false
  );

  if (venues.length === 0) return null;

  async function book(venueId: string) {
    setBusy(venueId);
    setMessage(null);

    try {
      const response = await fetch("/api/vip/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId }),
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data?.checkout) {
        const problem = await startCheckout(data.productId);
        if (problem) setMessage({ text: problem, ok: false });
        return;
      }

      if (!response.ok) {
        setMessage({ text: data?.error || "Booking failed.", ok: false });
        return;
      }

      if (data?.player) syncPlayerSnapshot(data.player);
      setMessage({
        text: `Booked! ${data.paid ? `Paid ₦${data.paid.toLocaleString("en-NG")}. ` : ""}You got: ${data.rewardText}`,
        ok: true,
      });
    } catch {
      setMessage({ text: "Network error. Try again.", ok: false });
    } finally {
      setBusy(null);
      onChanged();
    }
  }

  return (
    <div className="relative mt-8">
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
        Book a VIP place
      </div>

      {message && (
        <div
          className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
            message.ok
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/20 bg-red-400/10 text-red-200"
          }`}
        >
          {message.text}
          {!message.ok && message.text.includes("game cash") && (
            <Link href="/vip" className="ml-2 underline">Get game cash</Link>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {venues.map((venue) => {
          const price = prices[`venue:${venue.id}`] ?? {
            method: venue.defaultMethod,
            amount: venue.defaultPrice,
            active: true,
          };
          const unlocked = vip.active && tierAtLeast(vip.tier, venue.minTier);
          const required = VIP_TIERS[venue.minTier];
          const bookedOut =
            price.method !== "naira" &&
            (perkUsesToday[`venue:${venue.id}`] ?? 0) >= venue.usesPerDay;

          return (
            <article
              key={venue.id}
              className="overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.08] to-black/40"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className={`text-4xl ${unlocked ? "" : "grayscale"}`}>{venue.emoji}</div>
                  <span className={`rounded-full border ${required.border} px-3 py-1 text-[9px] font-black uppercase tracking-wider ${required.color}`}>
                    {required.emoji} {venue.minTier}+
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-black text-white">{venue.name}</h3>
                <div className="text-xs font-bold text-amber-200/70">📍 {venue.place}</div>
                <p className="mt-2 text-xs leading-5 text-white/50">{venue.description}</p>
                <div className="mt-3 text-xs font-black text-emerald-200">
                  You get: {describeReward(venue.reward)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/5 bg-black/30 px-5 py-4">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/35">Price</div>
                  <div className="text-sm font-black text-amber-300">{formatPrice(price)}</div>
                </div>

                {unlocked ? (
                  <button
                    type="button"
                    disabled={busy !== null || bookedOut}
                    onClick={() => book(venue.id)}
                    className="rounded-2xl bg-amber-400 px-5 py-3 text-xs font-black text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                  >
                    {busy === venue.id ? "BOOKING..." : bookedOut ? "BOOKED TODAY" : "BOOK NOW"}
                  </button>
                ) : (
                  <Link
                    href="/vip"
                    className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs font-black text-amber-200 hover:bg-amber-400/20"
                  >
                    🔒 {required.name.toUpperCase()}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
