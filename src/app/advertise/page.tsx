"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AD_PLAN_ORDER,
  AD_PLANS,
  BUSINESS_CATEGORIES,
  BUSINESS_DISTRICTS,
  type AdPlanId,
} from "@/lib/business/catalog";
import { usePrices } from "@/lib/pricing/client";
import { formatNaira } from "@/lib/vip/catalog";
import { startCheckout } from "@/lib/vip/client";

const EMOJIS = ["🍲", "🍗", "🍕", "☕", "💇🏾‍♀️", "💈", "💅🏾", "👗", "👟", "🍸", "💊", "🛒", "🏋🏾", "🏨", "🛠️", "🏪"];

export default function AdvertisePage() {
  const { prices } = usePrices();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [plan, setPlan] = useState<AdPlanId>("featured");
  const [form, setForm] = useState({
    name: "",
    category: "restaurant",
    district: "wuse",
    emoji: "🍲",
    description: "",
    address: "",
    whatsapp: "",
    phone: "",
    instagram: "",
    offerText: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/businesses/listings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d?.loggedIn)))
      .catch(() => setLoggedIn(false));
  }, []);

  const priceOf = (id: AdPlanId) => prices[`ad:${id}`]?.amount ?? AD_PLANS[id].defaultPriceNaira;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/businesses/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "Could not save your business.");
        return;
      }
      const problem = await startCheckout(`ad:${plan}:${data.listingId}`);
      if (problem) setError(`Your business was saved, but payment couldn't start: ${problem} You can pay from "My business".`);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50";

  return (
    <main className="min-h-screen bg-[#06100c] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#06100c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-black">ABUJA <span className="text-emerald-400">LIFE</span></Link>
          <Link href="/advertise/my" className="text-xs font-black text-emerald-300">My business →</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* HERO */}
        <section className="rounded-[2.5rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-[#0a1712] to-amber-500/10 p-8 text-center sm:p-14">
          <div className="text-5xl">📣</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            Put your business <span className="text-emerald-300">inside the game</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
            Abuja Life players walk through Wuse, Maitama, Garki and Jabi every day. Your restaurant,
            salon or boutique appears as a real place they can visit, with your WhatsApp, address and
            special offer one tap away.
          </p>
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ["📍", "Appear in your real district"],
              ["💬", "Customers WhatsApp you directly"],
              ["📊", "See views, visits and contacts"],
            ].map(([icon, text]) => (
              <div key={text} className="rounded-2xl bg-black/30 p-4 text-sm font-bold">
                <div className="text-2xl">{icon}</div>
                <div className="mt-2 text-white/75">{text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PLANS */}
        <section className="mt-12">
          <h2 className="text-2xl font-black">1. Choose a plan</h2>
          <p className="mt-1 text-sm text-white/45">Every plan runs for 30 days. Renew any time to add 30 more.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {AD_PLAN_ORDER.map((id) => {
              const p = AD_PLANS[id];
              const selected = plan === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className={`flex flex-col rounded-3xl border p-6 text-left transition ${
                    selected ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-black">{p.name}</div>
                    {id === "featured" && (
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black text-black">POPULAR</span>
                    )}
                  </div>
                  <div className="mt-2 text-3xl font-black text-emerald-300">
                    {formatNaira(priceOf(id))}
                    <span className="text-sm font-bold text-white/40"> / 30 days</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex gap-2 text-sm text-white/70">
                        <span className="text-emerald-400">✓</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <div className={`mt-5 rounded-2xl py-3 text-center text-xs font-black ${selected ? "bg-emerald-400 text-black" : "bg-white/10"}`}>
                    {selected ? "SELECTED" : "CHOOSE"}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* FORM */}
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-2xl font-black">2. Tell players about your business</h2>

          {loggedIn === false ? (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm">
              Create a free Abuja Life account to manage your advert and see your stats.
              <div className="mt-4 flex gap-3">
                <Link href="/register" className="rounded-xl bg-emerald-400 px-5 py-3 text-xs font-black text-black">CREATE ACCOUNT</Link>
                <Link href="/login" className="rounded-xl border border-white/15 px-5 py-3 text-xs font-black">LOG IN</Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-white/50 sm:col-span-2">
                Business name
                <input className={`${input} mt-1`} maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mama Put Kitchen" />
              </label>

              <label className="text-xs font-bold text-white/50">
                Category
                <select className={`${input} mt-1`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-bold text-white/50">
                District
                <select className={`${input} mt-1`} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                  {BUSINESS_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </label>

              <div className="text-xs font-bold text-white/50 sm:col-span-2">
                Icon
                <div className="mt-2 flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm({ ...form, emoji: e })}
                      className={`h-11 w-11 rounded-xl text-xl ${form.emoji === e ? "bg-emerald-400/25 ring-2 ring-emerald-400" : "bg-black/30"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <label className="text-xs font-bold text-white/50 sm:col-span-2">
                Description
                <textarea className={`${input} mt-1 min-h-[90px]`} maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What you sell, opening hours, what makes you special…" />
              </label>

              <label className="text-xs font-bold text-white/50 sm:col-span-2">
                Address
                <input className={`${input} mt-1`} maxLength={160} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Plot 12, Aminu Kano Crescent, Wuse 2" />
              </label>

              <label className="text-xs font-bold text-white/50">
                WhatsApp number
                <input className={`${input} mt-1`} inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="0803 000 0000" />
              </label>

              <label className="text-xs font-bold text-white/50">
                Phone (optional)
                <input className={`${input} mt-1`} inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>

              <label className="text-xs font-bold text-white/50">
                Instagram (optional)
                <input className={`${input} mt-1`} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@yourbusiness" />
              </label>

              <label className="text-xs font-bold text-white/50">
                Special offer for players (optional)
                <input className={`${input} mt-1`} maxLength={120} value={form.offerText} onChange={(e) => setForm({ ...form, offerText: e.target.value })} placeholder="Show this screen for 10% off" />
              </label>

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-bold text-red-200 sm:col-span-2">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={busy || loggedIn === null}
                onClick={submit}
                className="rounded-2xl bg-emerald-400 py-4 text-sm font-black text-black hover:bg-emerald-300 disabled:opacity-50 sm:col-span-2"
              >
                {busy ? "SAVING…" : `CONTINUE TO PAYMENT · ${formatNaira(priceOf(plan))}`}
              </button>

              <p className="text-xs text-white/40 sm:col-span-2">
                After payment, our team reviews your listing (usually within 24 hours), then it goes live.
                Listings that are misleading or illegal are not approved.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
