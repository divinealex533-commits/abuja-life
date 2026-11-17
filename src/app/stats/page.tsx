"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  generatedAt: string;
  players: number | null;
  newToday: number | null;
  online: number | null;
  shiftsToday: number | null;
  visitorsToday: number | null;
  liveNow: number | null;
  openElections: number | null;
  businesses: number | null;
  daily: { day: string; players: number }[];
  officeholders: { office: string; name: string }[];
}

const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toLocaleString());

/** Public live stats for Abuja Life — anyone can open this page. */
export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/public-stats", { cache: "no-store" })
        .then((r) => r.json())
        .then(setStats)
        .catch(() => null);
    void load();
    const t = window.setInterval(load, 60_000);
    return () => window.clearInterval(t);
  }, []);

  const max = Math.max(1, ...(stats?.daily ?? []).map((d) => d.players));

  const tiles: { label: string; value: number | null | undefined; icon: string; accent: string }[] = [
    { label: "Players", value: stats?.players, icon: "👥", accent: "from-emerald-400/25" },
    { label: "Online now", value: stats?.online, icon: "🟢", accent: "from-lime-400/25" },
    { label: "Joined today", value: stats?.newToday, icon: "🆕", accent: "from-sky-400/25" },
    { label: "Visits today", value: stats?.visitorsToday, icon: "👀", accent: "from-indigo-400/25" },
    { label: "Shifts worked today", value: stats?.shiftsToday, icon: "💼", accent: "from-amber-400/25" },
    { label: "Live on TikTok", value: stats?.liveNow, icon: "🔴", accent: "from-pink-500/25" },
    { label: "Businesses advertising", value: stats?.businesses, icon: "🏢", accent: "from-orange-400/25" },
    { label: "Elections open", value: stats?.openElections, icon: "🗳️", accent: "from-teal-400/25" },
  ];

  return (
    <main className="min-h-screen bg-[#070b14] pb-24 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs font-black text-white/60">
            ← ABUJA LIFE
          </Link>
          <span className="flex items-center gap-2 text-xs font-black text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> LIVE
          </span>
        </div>

        <h1 className="mt-5 text-4xl font-black sm:text-5xl">
          Abuja Life <span className="text-emerald-300">in numbers</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">Public stats, updated every minute.</p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map((t) => (
            <div
              key={t.label}
              className={`rounded-2xl border border-white/10 bg-gradient-to-br ${t.accent} to-transparent p-4`}
            >
              <div className="text-2xl">{t.icon}</div>
              <div className="mt-2 text-3xl font-black tabular-nums">{fmt(t.value)}</div>
              <div className="text-xs font-bold text-white/55">{t.label}</div>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-black">New players per day</h2>
          <p className="text-xs text-white/45">Last 14 days</p>
          <div className="mt-5 flex h-48 items-end gap-1.5">
            {(stats?.daily ?? []).map((d) => (
              <div key={d.day} className="group flex h-full flex-1 flex-col items-center justify-end">
                <div className="mb-1 text-[10px] font-bold text-white/0 group-hover:text-white/70">{d.players}</div>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-300"
                  style={{ height: `${Math.max(2, (d.players / max) * 100)}%` }}
                  title={`${d.day}: ${d.players}`}
                />
                <div className="mt-1 text-[9px] text-white/40">{d.day.slice(8)}</div>
              </div>
            ))}
          </div>
        </section>

        {stats && stats.officeholders.length > 0 && (
          <section className="mt-6 rounded-3xl border border-amber-300/20 bg-amber-500/5 p-5">
            <h2 className="font-black">🏛️ Elected officials</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {stats.officeholders.map((o) => (
                <li key={o.office} className="flex justify-between">
                  <span className="text-white/60">{o.office}</span>
                  <span className="font-black">{o.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/register"
            className="inline-block rounded-2xl bg-emerald-400 px-8 py-4 font-black text-black shadow-xl shadow-emerald-500/20"
          >
            Join Abuja Life →
          </Link>
        </div>
      </div>
    </main>
  );
}
