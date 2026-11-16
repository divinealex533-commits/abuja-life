"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { formatNaira } from "@/lib/vip/catalog";

type Settings = {
  rewarded_ads_enabled: boolean;
  marketplace_fee_percent: number;
  rewarded_ad_seconds: number;
  rewarded_ad_daily_limit: number;
  rewarded_ad_cash: number;
  rewarded_ad_energy: number;
  referral_reward_referrer: number;
  referral_reward_new_player: number;
};

type Stats = {
  revenue30d: number;
  revenueByType: Record<string, number>;
  marketplaceFees30d: number;
  adsWatched30d: number;
  referrals: number;
  referralsRewarded: number;
  cosmeticsSold: number;
};

const FIELDS: Array<{ key: keyof Settings; label: string; help: string; prefix?: string; suffix?: string }> = [
  { key: "marketplace_fee_percent", label: "Marketplace fee", help: "Taken from game cash on every player contract.", suffix: "%" },
  { key: "rewarded_ad_seconds", label: "Ad length", help: "Seconds a player must watch.", suffix: "sec" },
  { key: "rewarded_ad_daily_limit", label: "Ads per player per day", help: "Max rewarded ads each day." },
  { key: "rewarded_ad_cash", label: "Ad reward: cash", help: "Game cash per ad if they pick cash.", prefix: "₦" },
  { key: "rewarded_ad_energy", label: "Ad reward: energy", help: "Energy per ad if they pick energy." },
  { key: "referral_reward_referrer", label: "Referral reward (inviter)", help: "Game cash when their friend works a first shift.", prefix: "₦" },
  { key: "referral_reward_new_player", label: "Referral reward (new player)", help: "Welcome bonus for the invited friend.", prefix: "₦" },
];

export default function AdminEarningsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/earnings", { cache: "no-store" });
    const d = await r.json().catch(() => null);
    if (!r.ok) {
      setNotice({ text: d?.error || "Could not load.", ok: false });
      return;
    }
    setSettings(d.settings);
    setStats(d.stats);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!settings) return;
    const r = await fetch("/api/admin/earnings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const d = await r.json().catch(() => null);
    setNotice(r.ok ? { text: "Saved.", ok: true } : { text: d?.error || "Save failed.", ok: false });
    void load();
  }

  const input = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link href="/admin" className="text-xs font-bold text-orange-400 hover:text-orange-300">← Admin Dashboard</Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Earnings</h1>
      <p className="mt-2 text-sm text-slate-500">All the ways Abuja Life makes money, and the settings for each one.</p>

      {notice && (
        <div className={`mt-6 rounded-2xl border p-4 text-sm ${notice.ok ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>
          {notice.text}
        </div>
      )}

      {/* REVENUE */}
      <section className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Real money · last 30 days</p>
        <p className="mt-2 text-4xl font-black">{formatNaira(stats?.revenue30d ?? 0)}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(stats?.revenueByType ?? {}).map(([type, amount]) => (
            <div key={type} className="rounded-xl bg-black/30 p-3">
              <div className="text-xs text-slate-400">{type}</div>
              <div className="font-black">{formatNaira(amount)}</div>
            </div>
          ))}
          {Object.keys(stats?.revenueByType ?? {}).length === 0 && (
            <div className="text-sm text-slate-500">No payments yet. Share /advertise with businesses and promote /vip to players.</div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marketplace fees (30d)</p>
          <p className="mt-2 text-2xl font-black">{formatNaira(stats?.marketplaceFees30d ?? 0)}</p>
          <p className="text-xs text-slate-500">game cash removed from the economy</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rewarded ads watched (30d)</p>
          <p className="mt-2 text-2xl font-black">{stats?.adsWatched30d ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Referrals</p>
          <p className="mt-2 text-2xl font-black">{stats?.referrals ?? 0}</p>
          <p className="text-xs text-slate-500">{stats?.referralsRewarded ?? 0} became active players</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Style items owned</p>
          <p className="mt-2 text-2xl font-black">{stats?.cosmeticsSold ?? 0}</p>
        </div>
      </section>

      {/* SETTINGS */}
      {settings && (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-black">Settings</h2>
          <label className="mt-4 flex items-center gap-3 text-sm font-bold">
            <input
              type="checkbox"
              checked={settings.rewarded_ads_enabled}
              onChange={(e) => setSettings({ ...settings, rewarded_ads_enabled: e.target.checked })}
            />
            Rewarded ads on
          </label>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="text-xs font-bold text-slate-400">
                {f.label}
                <div className="mt-1 flex items-center gap-2">
                  {f.prefix && <span className="text-slate-500">{f.prefix}</span>}
                  <input
                    type="number"
                    className={input}
                    value={Number(settings[f.key])}
                    onChange={(e) => setSettings({ ...settings, [f.key]: Number(e.target.value) })}
                  />
                  {f.suffix && <span className="text-slate-500">{f.suffix}</span>}
                </div>
                <span className="mt-1 block font-normal text-slate-600">{f.help}</span>
              </label>
            ))}
          </div>
          <button type="button" onClick={save} className="mt-6 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-400">
            Save settings
          </button>
        </section>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["/admin/businesses", "📣 Business adverts"],
          ["/admin/prices", "🏷️ All prices"],
          ["/admin/vip", "👑 VIP & store"],
          ["/admin/weekend-prizes", "🏆 Weekend prizes"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-black hover:border-orange-500/30">
            {label} →
          </Link>
        ))}
      </section>
    </div>
  );
}
