"use client";

import Link from "next/link";
import { useState } from "react";

import VipBadge from "@/components/vip/VipBadge";
import VipVenueList from "@/components/vip/VipVenueList";
import { tierAtLeast, VIP_TIERS } from "@/lib/vip/catalog";
import { syncPlayerSnapshot, useVip } from "@/lib/vip/client";
import { getVenuesForArea } from "@/lib/vip/venues";
import {
  describeReward,
  getPerksForArea,
  VIP_AREA_TITLES,
  type VipArea,
} from "@/lib/vip/perks";

/**
 * Drop-in VIP area for any page:
 *   <VipSection area="dealership" />
 * Non-VIP players see locked perks with an upgrade button
 * (this is what sells VIP). VIP players claim perks for real.
 */
export default function VipSection({
  area,
  className = "",
}: {
  area: VipArea;
  className?: string;
}) {
  const { vip, perkUsesToday, loggedIn, loading, refresh } = useVip();
  const [busyPerk, setBusyPerk] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const perks = getPerksForArea(area);
  const titles = VIP_AREA_TITLES[area];

  if (perks.length === 0 && getVenuesForArea(area).length === 0) return null;

  async function claim(perkId: string) {
    setBusyPerk(perkId);
    setMessage(null);

    try {
      const response = await fetch("/api/vip/perks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perkId }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage({ text: data?.error || "Could not claim perk.", ok: false });
      } else {
        if (data?.player) syncPlayerSnapshot(data.player);
        setMessage({ text: `Claimed: ${data.rewardText}`, ok: true });
      }
    } catch {
      setMessage({ text: "Network error. Try again.", ok: false });
    } finally {
      setBusyPerk(null);
      void refresh();
    }
  }

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.12] via-[#120d05] to-violet-500/[0.10] p-6 shadow-2xl sm:p-8 ${className}`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
            👑 VIP Only
          </div>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {titles.title}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-white/50">{titles.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {vip.active ? (
            <>
              <VipBadge tier={vip.tier} size="md" />
              <span className="text-xs font-bold text-white/40">
                {vip.daysLeft} day{vip.daysLeft === 1 ? "" : "s"} left
              </span>
            </>
          ) : (
            <Link
              href="/vip"
              className="rounded-2xl bg-amber-400 px-5 py-3 text-xs font-black text-black transition hover:bg-amber-300"
            >
              BECOME VIP →
            </Link>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`relative mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
            message.ok
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/20 bg-red-400/10 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="relative mt-6 grid gap-4 md:grid-cols-2">
        {perks.map((perk) => {
          const unlocked = vip.active && tierAtLeast(vip.tier, perk.minTier);
          const previewTier = unlocked && vip.tier ? vip.tier : perk.minTier;
          const limit = perk.usesPerDay(previewTier);
          const used = perkUsesToday[perk.id] ?? 0;
          const remaining = Math.max(0, limit - used);
          const required = VIP_TIERS[perk.minTier];

          return (
            <article
              key={perk.id}
              className={`rounded-3xl border p-5 transition ${
                unlocked
                  ? "border-amber-400/25 bg-black/30"
                  : "border-white/10 bg-black/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                    unlocked ? "bg-amber-400/15" : "bg-white/5 grayscale"
                  }`}
                >
                  {unlocked ? perk.emoji : "🔒"}
                </div>
                <span
                  className={`rounded-full border ${required.border} px-3 py-1 text-[9px] font-black uppercase tracking-wider ${required.color}`}
                >
                  {required.emoji} {perk.minTier}+
                </span>
              </div>

              <h3 className="mt-4 text-lg font-black text-white">{perk.name}</h3>
              <p className="mt-1 text-xs leading-5 text-white/45">{perk.description}</p>

              <div className="mt-3 text-xs font-black text-amber-200">
                {describeReward(perk.reward(previewTier))}
              </div>

              {unlocked ? (
                <button
                  type="button"
                  disabled={busyPerk !== null || remaining === 0}
                  onClick={() => claim(perk.id)}
                  className="mt-4 w-full rounded-2xl bg-amber-400 px-4 py-3 text-xs font-black text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                >
                  {busyPerk === perk.id
                    ? "CLAIMING..."
                    : remaining === 0
                      ? "USED TODAY — BACK TOMORROW"
                      : `CLAIM (${remaining}/${limit} left today)`}
                </button>
              ) : (
                <Link
                  href={loggedIn || loading ? "/vip" : "/login"}
                  className="mt-4 block w-full rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-xs font-black text-amber-200 transition hover:bg-amber-400/20"
                >
                  {vip.active
                    ? `UPGRADE TO ${required.name.toUpperCase()}`
                    : `UNLOCK WITH ${required.name.toUpperCase()}`}
                </Link>
              )}
            </article>
          );
        })}
      </div>

      <VipVenueList
        area={area}
        vip={vip}
        perkUsesToday={perkUsesToday}
        onChanged={() => void refresh()}
      />
    </section>
  );
}
