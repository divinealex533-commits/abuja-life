"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  AD_PLAN_ORDER,
  AD_PLANS,
  categoryInfo,
  districtLabel,
  type AdPlanId,
} from "@/lib/business/catalog";
import { usePrices } from "@/lib/pricing/client";
import { formatNaira } from "@/lib/vip/catalog";
import { startCheckout } from "@/lib/vip/client";

type MyListing = {
  id: string;
  name: string;
  category: string;
  district: string;
  emoji: string;
  plan: AdPlanId;
  status: "pending_payment" | "pending_review" | "active" | "paused" | "rejected";
  paid_until: string | null;
  reject_reason: string | null;
  views: number;
  visits: number;
  contacts: number;
  ad_views: number;
};

const STATUS: Record<MyListing["status"], { label: string; style: string }> = {
  pending_payment: { label: "Waiting for payment", style: "bg-white/10 text-white/70" },
  pending_review: { label: "Paid · in review", style: "bg-amber-400/15 text-amber-200" },
  active: { label: "Live", style: "bg-emerald-400/15 text-emerald-300" },
  paused: { label: "Paused by admin", style: "bg-orange-400/15 text-orange-200" },
  rejected: { label: "Not approved", style: "bg-red-400/15 text-red-200" },
};

export default function MyBusinessPage() {
  const { prices } = usePrices();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loggedIn, setLoggedIn] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/businesses/listings", { cache: "no-store" });
    const d = await r.json().catch(() => null);
    setLoggedIn(d?.loggedIn !== false);
    setListings(d?.listings ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function pay(listing: MyListing, plan: AdPlanId) {
    setBusy(listing.id + plan);
    setError("");
    const problem = await startCheckout(`ad:${plan}:${listing.id}`);
    if (problem) setError(problem);
    setBusy(null);
  }

  return (
    <main className="min-h-screen bg-[#06100c] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#06100c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/advertise" className="text-xs font-black text-white/60">← ADVERTISE</Link>
          <div className="text-sm font-black">My business</div>
          <Link href="/advertise" className="text-xs font-black text-emerald-300">+ Add</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {!loggedIn && (
          <div className="rounded-2xl border border-white/10 p-6 text-center">
            <Link href="/login" className="font-black text-emerald-300">Log in to see your businesses →</Link>
          </div>
        )}

        {error && <div className="mb-4 rounded-2xl bg-red-400/10 p-4 text-sm font-bold text-red-200">{error}</div>}

        {loggedIn && listings.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
            <div className="text-4xl">🏪</div>
            <p className="mt-3 text-sm text-white/60">You haven&apos;t added a business yet.</p>
            <Link href="/advertise" className="mt-5 inline-block rounded-2xl bg-emerald-400 px-6 py-3 text-xs font-black text-black">ADVERTISE YOUR BUSINESS</Link>
          </div>
        )}

        <div className="space-y-5">
          {listings.map((l) => {
            const live = l.status === "active" && l.paid_until && new Date(l.paid_until).getTime() > Date.now();
            const daysLeft = l.paid_until ? Math.max(0, Math.ceil((new Date(l.paid_until).getTime() - Date.now()) / 86_400_000)) : 0;
            return (
              <article key={l.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-3xl">{l.emoji}</div>
                    <div>
                      <h2 className="text-xl font-black">{l.name}</h2>
                      <div className="text-xs text-white/45">
                        {categoryInfo(l.category).label} · {districtLabel(l.district)} · {AD_PLANS[l.plan].name}
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${STATUS[l.status].style}`}>
                    {live ? `Live · ${daysLeft} days left` : STATUS[l.status].label}
                  </span>
                </div>

                {l.status === "rejected" && l.reject_reason && (
                  <p className="mt-3 rounded-xl bg-red-400/10 p-3 text-xs text-red-200">Reason: {l.reject_reason}</p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["👀 Views", l.views],
                    ["🚶 Visits", l.visits],
                    ["💬 Contacts", l.contacts],
                    ["🎬 Ad views", l.ad_views],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-2xl bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
                      <div className="mt-1 text-2xl font-black">{Number(value).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {AD_PLAN_ORDER.map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      disabled={busy !== null}
                      onClick={() => pay(l, plan)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-black disabled:opacity-50 ${
                        plan === l.plan ? "bg-emerald-400 text-black" : "border border-white/15 hover:bg-white/5"
                      }`}
                    >
                      {busy === l.id + plan
                        ? "Opening Paystack…"
                        : `${l.status === "pending_payment" ? "Pay" : "Add 30 days"} · ${AD_PLANS[plan].name} · ${formatNaira(prices[`ad:${plan}`]?.amount ?? AD_PLANS[plan].defaultPriceNaira)}`}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
