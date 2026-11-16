"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AD_PLANS, categoryInfo, districtLabel, type AdPlanId } from "@/lib/business/catalog";
import { formatNaira } from "@/lib/vip/catalog";

type Listing = {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  district: string;
  emoji: string;
  description: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  offer_text: string | null;
  plan: AdPlanId;
  status: string;
  paid_until: string | null;
  reject_reason: string | null;
  views: number;
  visits: number;
  contacts: number;
  ad_views: number;
  created_at: string;
};

type Filter = "pending_review" | "active" | "pending_payment" | "paused" | "rejected" | "all";

export default function AdminBusinessesPage() {
  const [filter, setFilter] = useState<Filter>("pending_review");
  const [listings, setListings] = useState<Listing[]>([]);
  const [summary, setSummary] = useState({ pendingReview: 0, live: 0, adRevenue: 0, adPayments: 0 });
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/businesses?status=${filter}`, { cache: "no-store" });
    const d = await r.json().catch(() => null);
    if (!r.ok) {
      setNotice({ text: d?.error || "Could not load.", ok: false });
      return;
    }
    setListings(d.listings);
    setSummary(d.summary);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setNotice(null);
    const r = await fetch("/api/admin/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    const d = await r.json().catch(() => null);
    setNotice(r.ok ? { text: "Done.", ok: true } : { text: d?.error || "Failed.", ok: false });
    void load();
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Link href="/admin" className="text-xs font-bold text-orange-400 hover:text-orange-300">← Admin Dashboard</Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Business Adverts</h1>
      <p className="mt-2 text-sm text-slate-500">
        Real businesses that pay to appear in the game. Approve paid listings after checking them. Reject anything misleading.
      </p>

      {notice && (
        <div className={`mt-6 rounded-2xl border p-4 text-sm ${notice.ok ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>
          {notice.text}
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Ad revenue</p>
          <p className="mt-3 text-2xl font-black">{formatNaira(summary.adRevenue)}</p>
          <p className="text-xs text-slate-500">{summary.adPayments} payments</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live now</p>
          <p className="mt-3 text-2xl font-black">{summary.live}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Waiting for review</p>
          <p className="mt-3 text-2xl font-black">{summary.pendingReview}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sales page</p>
          <Link href="/advertise" className="mt-3 block text-sm font-black text-orange-300">/advertise →</Link>
          <p className="text-xs text-slate-500">Send this link to businesses</p>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["pending_review", "active", "pending_payment", "paused", "rejected", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-black ${filter === f ? "bg-orange-500 text-white" : "border border-white/10 text-slate-400"}`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {listings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">Nothing here.</div>
        )}

        {listings.map((l) => {
          const daysLeft = l.paid_until ? Math.ceil((new Date(l.paid_until).getTime() - Date.now()) / 86_400_000) : null;
          return (
            <article key={l.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="text-3xl">{l.emoji}</div>
                  <div>
                    <div className="text-lg font-black">{l.name}</div>
                    <div className="text-xs text-slate-500">
                      {categoryInfo(l.category).label} · {districtLabel(l.district)} · {AD_PLANS[l.plan].name} ·{" "}
                      <span className="font-bold text-slate-300">{l.status}</span>
                      {daysLeft !== null && ` · ${daysLeft > 0 ? `${daysLeft} days paid` : "expired"}`}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  👀 {l.views} · 🚶 {l.visits} · 💬 {l.contacts} · 🎬 {l.ad_views}
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-300">{l.description}</p>
              <div className="mt-2 grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                <div>🏠 {l.address || "—"}</div>
                <div>💬 {l.whatsapp || "—"} · 📞 {l.phone || "—"} · IG {l.instagram ? `@${l.instagram}` : "—"}</div>
                {l.offer_text && <div className="sm:col-span-2">🎁 {l.offer_text}</div>}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {l.status !== "active" && l.status !== "pending_payment" && (
                  <button type="button" onClick={() => act(l.id, "approve")} className="rounded-xl bg-green-500 px-4 py-2 text-xs font-black text-black">
                    Approve
                  </button>
                )}
                {l.status === "active" && (
                  <button type="button" onClick={() => act(l.id, "pause")} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-black">
                    Pause
                  </button>
                )}
                {l.status === "paused" && (
                  <button type="button" onClick={() => act(l.id, "resume")} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-black">
                    Resume
                  </button>
                )}
                <button type="button" onClick={() => act(l.id, "comp", { days: 7 })} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-black">
                  Gift 7 free days
                </button>
                <input
                  className="min-w-[200px] flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"
                  placeholder="Reason (if rejecting)"
                  value={reasons[l.id] ?? ""}
                  onChange={(e) => setReasons({ ...reasons, [l.id]: e.target.value })}
                />
                <button type="button" onClick={() => act(l.id, "reject", { reason: reasons[l.id] })} className="rounded-xl bg-red-500/80 px-4 py-2 text-xs font-black">
                  Reject
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
