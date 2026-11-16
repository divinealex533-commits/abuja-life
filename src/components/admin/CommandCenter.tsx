"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Overview = {
  generatedAt: string;
  players: { total: number | null; newToday: number | null; online: number | null; workedToday: number | null; chatToday: number | null };
  revenue: { today: number; week: number; month: number };
  daily: { day: string; amount: number }[];
  world: { activeVips: number | null; liveBusinesses: number | null; pendingReviews: number | null; openCases: number | null; jailed: number | null; errors24h: number | null };
  economy: { cashInCirculation: number; averageCash: number; richest: { name: string; cash: number }[] };
  waitlist: { id: string; name: string; count: number }[];
  alerts: { level: "red" | "amber"; text: string; href: string }[];
  feed: { at: string; icon: string; text: string; tone: string }[];
};

const naira = (v: number) => `₦${Math.round(v || 0).toLocaleString("en-NG")}`;
const num = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v.toLocaleString("en-NG"));

function ago(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TONE: Record<string, string> = {
  money: "text-emerald-300",
  player: "text-sky-300",
  law: "text-red-300",
  work: "text-amber-200",
  chat: "text-white/70",
  biz: "text-fuchsia-300",
  error: "text-red-400",
};

function Stat({ label, value, sub, accent = "text-white" }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-black ${accent}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

/** Live Command Center: refreshes every 30 seconds. */
export default function CommandCenter() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/overview", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Couldn't load");
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load");
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  if (error && !data) {
    return <section className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">Command Center: {error}</section>;
  }
  if (!data) {
    return <section className="mt-6 h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />;
  }

  const max = Math.max(1, ...data.daily.map((d) => d.amount));
  const feed = filter === "all" ? data.feed : data.feed.filter((f) => f.tone === filter);

  return (
    <section className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-400" />
          </span>
          Live Command Center
        </h2>
        <span className="text-xs text-slate-500">Updated {ago(data.generatedAt)} · auto-refresh 30s</span>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="grid gap-2">
          {data.alerts.map((a) => (
            <Link
              key={a.text}
              href={a.href}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold ${a.level === "red" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-amber-400/30 bg-amber-400/10 text-amber-100"}`}
            >
              <span>{a.level === "red" ? "🚨" : "⚠️"} {a.text}</span>
              <span className="text-xs">Fix →</span>
            </Link>
          ))}
        </div>
      )}

      {/* Players + money */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Players" value={num(data.players.total)} sub={`+${num(data.players.newToday)} today`} />
        <Stat label="Online now" value={num(data.players.online)} sub="last 5 min" accent="text-green-400" />
        <Stat label="Worked today" value={num(data.players.workedToday)} sub="did a shift" />
        <Stat label="Chat today" value={num(data.players.chatToday)} sub="messages" />
        <Stat label="Revenue today" value={naira(data.revenue.today)} accent="text-emerald-300" />
        <Stat label="7 days" value={naira(data.revenue.week)} accent="text-emerald-300" />
        <Stat label="30 days" value={naira(data.revenue.month)} accent="text-emerald-300" />
        <Stat label="Active VIPs" value={num(data.world.activeVips)} accent="text-amber-300" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* Revenue chart */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-black">Real-money revenue · last 14 days</div>
            <Link href="/admin/earnings" className="text-xs font-black text-orange-300">Details →</Link>
          </div>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {data.daily.map((d) => (
              <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end">
                <div className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded bg-black px-2 py-1 text-[10px] font-bold group-hover:block">
                  {d.day.slice(5)} · {naira(d.amount)}
                </div>
                <div className="w-full rounded-t bg-emerald-400/80" style={{ height: `${Math.max(2, (d.amount / max) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-500">
            <span>{data.daily[0]?.day.slice(5)}</span>
            <span>today</span>
          </div>
        </div>

        {/* World status */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Live business ads" value={num(data.world.liveBusinesses)} sub={`${num(data.world.pendingReviews)} to review`} accent="text-fuchsia-300" />
          <Stat label="Open court cases" value={num(data.world.openCases)} sub={`${num(data.world.jailed)} in jail now`} accent="text-red-300" />
          <Stat label="Errors (24h)" value={num(data.world.errors24h)} sub="unresolved" accent={(data.world.errors24h ?? 0) > 0 ? "text-red-400" : "text-green-400"} />
          <Stat label="Cash in game" value={naira(data.economy.cashInCirculation)} sub={`avg ${naira(data.economy.averageCash)}`} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        {/* Activity feed */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-black">What&apos;s happening in Abuja</div>
            <div className="flex flex-wrap gap-1">
              {[
                ["all", "All"],
                ["money", "💰"],
                ["player", "🆕"],
                ["work", "💼"],
                ["law", "⚖️"],
                ["biz", "🏪"],
                ["chat", "💬"],
                ["error", "🐞"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${filter === id ? "bg-orange-500 text-black" : "bg-white/5 text-slate-400"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
            {feed.length === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
            {feed.map((f, i) => (
              <div key={`${f.at}-${i}`} className="flex items-start gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                <span>{f.icon}</span>
                <span className={`flex-1 ${TONE[f.tone] ?? ""}`}>{f.text}</span>
                <span className="shrink-0 text-[10px] text-slate-500">{ago(f.at)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {/* Richest */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <div className="text-sm font-black">💎 Richest players</div>
            <div className="mt-3 space-y-1.5">
              {data.economy.richest.map((r, i) => (
                <div key={i} className="flex justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                  <span>{i + 1}. {r.name}</span>
                  <span className="font-black text-amber-300">{naira(r.cash)}</span>
                </div>
              ))}
              {data.economy.richest.length === 0 && <p className="text-sm text-slate-500">No players yet.</p>}
            </div>
          </div>

          {/* Waitlist */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <div className="text-sm font-black">🗺️ Most-wanted next states</div>
            <p className="text-xs text-slate-500">Players waiting for each state to open.</p>
            <div className="mt-3 space-y-1.5">
              {data.waitlist.map((w) => (
                <div key={w.id} className="flex justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                  <span>{w.name}</span>
                  <span className="font-black text-sky-300">{w.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
