"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Check = { id: string; name: string; category: string; status: "pass" | "warn" | "fail"; message: string; durationMs: number };
type Diagnostics = { checkedAt: string; summary: { total: number; pass: number; warn: number; fail: number }; checks: Check[] };
type ErrorLog = {
  id: string;
  source: string;
  message: string;
  stack: string | null;
  path: string | null;
  user_id: string | null;
  user_agent: string | null;
  occurrences: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved: boolean;
};
type Me = {
  userId: string;
  email: string;
  hasProfile: boolean;
  profile: { display_name: string; username: string } | null;
  state: { cash?: number; energy?: number; reputation?: number; jailed_until?: string | null } | null;
  legal: { jailed: boolean; openCases: number; overdueCases: number } | null;
};

const STATUS_STYLE = {
  pass: "border-green-500/20 bg-green-500/10 text-green-300",
  warn: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  fail: "border-red-500/30 bg-red-500/10 text-red-200",
};

const TOOLS = [
  { action: "give_cash", label: "💵 +₦1M game cash" },
  { action: "refill_energy", label: "⚡ Refill energy" },
  { action: "sample_case", label: "🚓 Charge me with a crime" },
  { action: "jail_me", label: "🔒 Jail me for 2h" },
  { action: "clear_legal", label: "🧹 Clear my cases & jail" },
  { action: "reset_character", label: "🧍🏾 Reset my character" },
  { action: "test_error", label: "🐞 Log a test error" },
];

const PLAYTEST: { label: string; href: string; tip: string }[] = [
  { label: "Create a character", href: "/character?new=1", tip: "Change every option, press Surprise me, save." },
  { label: "Game hub", href: "/game", tip: "Your animated character card should show at the top of the hub." },
  { label: "Work a career shift", href: "/careers", tip: "Pick a shady choice: you may get charged." },
  { label: "Go to court", href: "/court", tip: "Try pleading guilty, then not guilty with each lawyer." },
  { label: "EFCC Most Wanted", href: "/efcc", tip: "Open EFCC cases appear here." },
  { label: "Nigeria map", href: "/map", tip: "Tap Lagos, press Notify me." },
  { label: "VIP store", href: "/vip", tip: "Opens Paystack. Use test mode keys to test safely." },
  { label: "Style shop", href: "/style", tip: "Cosmetics show in chat." },
  { label: "Advertise a business", href: "/advertise", tip: "Then approve it in Admin → Businesses." },
  { label: "Invite page", href: "/invite", tip: "Your referral link." },
  { label: "Announcements", href: "/announcements", tip: "Reply to one, check Admin → Replies." },
];

function ago(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminTestingPage() {
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [toolMsg, setToolMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [problem, setProblem] = useState<string | null>(null);

  const runDiagnostics = useCallback(async () => {
    setDiagLoading(true);
    setProblem(null);
    try {
      const r = await fetch("/api/admin/testing", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Diagnostics failed.");
      setDiag(d);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Diagnostics failed.");
    } finally {
      setDiagLoading(false);
    }
  }, []);

  const loadErrors = useCallback(async () => {
    const r = await fetch(`/api/admin/errors?show=${showAll ? "all" : "open"}`, { cache: "no-store" });
    const d = await r.json().catch(() => null);
    setErrors(d?.errors ?? []);
  }, [showAll]);

  const loadMe = useCallback(async () => {
    const r = await fetch("/api/admin/testing/tools", { cache: "no-store" });
    if (r.ok) setMe(await r.json());
  }, []);

  useEffect(() => {
    void runDiagnostics();
    void loadMe();
    try {
      setDone(JSON.parse(localStorage.getItem("abujaPlaytestChecklist") || "{}"));
    } catch {
      /* ignore */
    }
  }, [runDiagnostics, loadMe]);

  useEffect(() => {
    void loadErrors();
    const t = setInterval(loadErrors, 20_000);
    return () => clearInterval(t);
  }, [loadErrors]);

  async function runTool(action: string) {
    setBusy(action);
    setToolMsg(null);
    const r = await fetch("/api/admin/testing/tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const d = await r.json().catch(() => null);
    setToolMsg({ text: d?.message || d?.error || "Done.", ok: r.ok });
    setBusy(null);
    void loadMe();
    if (action === "test_error") setTimeout(loadErrors, 600);
  }

  async function resolve(body: Record<string, unknown>) {
    await fetch("/api/admin/errors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    void loadErrors();
  }

  function toggleDone(href: string) {
    const next = { ...done, [href]: !done[href] };
    setDone(next);
    try {
      localStorage.setItem("abujaPlaytestChecklist", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const failing = diag?.checks.filter((c) => c.status !== "pass") ?? [];
  const passing = diag?.checks.filter((c) => c.status === "pass") ?? [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 text-white">
      <Link href="/admin" className="text-xs font-black text-slate-400">← Admin</Link>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl">🧪 Test Center</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-400">
        Check every system, watch errors players hit in real time, and play-test the game with your own account.
      </p>
      {problem && <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{problem}</div>}

      {/* 1. HEALTH */}
      <section className="mt-8 rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">1 · System health</h2>
          <button type="button" onClick={runDiagnostics} disabled={diagLoading} className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-black disabled:opacity-50">
            {diagLoading ? "Checking…" : "↻ Run all checks"}
          </button>
        </div>
        {diag && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-green-500/10 p-4 text-center"><div className="text-3xl font-black text-green-300">{diag.summary.pass}</div><div className="text-xs text-slate-400">passing</div></div>
              <div className="rounded-2xl bg-amber-500/10 p-4 text-center"><div className="text-3xl font-black text-amber-200">{diag.summary.warn}</div><div className="text-xs text-slate-400">warnings</div></div>
              <div className="rounded-2xl bg-red-500/10 p-4 text-center"><div className="text-3xl font-black text-red-300">{diag.summary.fail}</div><div className="text-xs text-slate-400">failing</div></div>
            </div>
            {failing.length > 0 && (
              <div className="mt-4 space-y-2">
                {failing.map((c) => (
                  <div key={c.id} className={`rounded-2xl border px-4 py-3 text-sm ${STATUS_STYLE[c.status]}`}>
                    <b>{c.status === "fail" ? "❌" : "⚠️"} {c.name}</b> <span className="text-xs opacity-70">· {c.category}</span>
                    <div className="mt-0.5 text-xs opacity-90">{c.message}</div>
                  </div>
                ))}
              </div>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-black text-slate-400">Show {passing.length} passing checks</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {passing.map((c) => (
                  <div key={c.id} className={`rounded-xl border px-3 py-2 text-xs ${STATUS_STYLE.pass}`}>
                    ✅ <b>{c.name}</b> · {c.message} <span className="opacity-50">({c.durationMs}ms)</span>
                  </div>
                ))}
              </div>
            </details>
          </>
        )}
      </section>

      {/* 2. ERROR LOG */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">2 · Error log</h2>
            <p className="text-xs text-slate-500">Crashes from players&apos; browsers and the server, grouped. Refreshes every 20s.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAll(!showAll)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black">
              {showAll ? "Show open only" : "Show fixed too"}
            </button>
            {errors.some((e) => !e.resolved) && (
              <button type="button" onClick={() => resolve({ all: true })} className="rounded-xl bg-green-500 px-3 py-2 text-xs font-black text-black">Mark all fixed</button>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {errors.length === 0 && <div className="rounded-2xl bg-green-500/10 p-6 text-center text-sm text-green-300">🎉 No errors. Everything is running smoothly.</div>}
          {errors.map((e) => (
            <div key={e.id} className={`rounded-2xl border p-4 ${e.resolved ? "border-white/5 opacity-50" : "border-red-500/20 bg-red-500/[0.04]"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <button type="button" onClick={() => setOpenId(openId === e.id ? null : e.id)} className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-black uppercase text-slate-500">
                    {e.source === "client" ? "📱 Player browser" : "🖥️ Server"} · {e.path ?? "unknown page"} · ×{e.occurrences} · {ago(e.last_seen_at)}
                  </div>
                  <div className="mt-1 break-words text-sm font-bold text-red-200">{e.message}</div>
                </button>
                {!e.resolved && (
                  <button type="button" onClick={() => resolve({ id: e.id })} className="rounded-lg border border-green-500/30 px-3 py-1 text-xs font-black text-green-300">✓ Fixed</button>
                )}
              </div>
              {openId === e.id && (
                <div className="mt-3 space-y-2 text-xs text-slate-400">
                  <div>First seen {new Date(e.first_seen_at).toLocaleString("en-NG")} · last {new Date(e.last_seen_at).toLocaleString("en-NG")}</div>
                  {e.user_id && <div>Player: <Link className="text-orange-300" href={`/admin/players/${e.user_id}`}>{e.user_id}</Link></div>}
                  {e.user_agent && <div>Device: {e.user_agent}</div>}
                  {e.stack && <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-black/50 p-3 text-[11px]">{e.stack}</pre>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. PLAY-TEST */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          <h2 className="text-xl font-black">3 · Your test player</h2>
          <p className="text-xs text-slate-500">These buttons only change <b>your own</b> account, never real players.</p>
          {me && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-black/30 p-3"><div className="text-[10px] text-slate-500">Cash</div><b>₦{Number(me.state?.cash ?? 0).toLocaleString("en-NG")}</b></div>
              <div className="rounded-xl bg-black/30 p-3"><div className="text-[10px] text-slate-500">Energy</div><b>{me.state?.energy ?? "—"}</b></div>
              <div className="rounded-xl bg-black/30 p-3"><div className="text-[10px] text-slate-500">Court cases</div><b>{me.legal?.openCases ?? 0}</b></div>
              <div className="rounded-xl bg-black/30 p-3"><div className="text-[10px] text-slate-500">Jail</div><b>{me.legal?.jailed ? "🔒 Yes" : "No"}</b></div>
            </div>
          )}
          {me && !me.hasProfile && (
            <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-200">Your admin account has no player profile yet. Register a player profile to test chat and the hub fully.</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {TOOLS.map((t) => (
              <button key={t.action} type="button" disabled={busy !== null} onClick={() => runTool(t.action)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left text-xs font-black hover:bg-white/[0.08] disabled:opacity-50">
                {busy === t.action ? "…" : t.label}
              </button>
            ))}
          </div>
          {toolMsg && <div className={`mt-3 rounded-xl p-3 text-sm ${toolMsg.ok ? "bg-green-500/10 text-green-200" : "bg-red-500/10 text-red-200"}`}>{toolMsg.text}</div>}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Play-test checklist</h2>
            <span className="text-xs text-slate-500">{Object.values(done).filter(Boolean).length}/{PLAYTEST.length}</span>
          </div>
          <p className="text-xs text-slate-500">Open each page, try it, tick it. Any crash shows up in the error log.</p>
          <div className="mt-4 space-y-2">
            {PLAYTEST.map((p) => (
              <div key={p.href} className={`flex items-start gap-3 rounded-xl px-3 py-2 ${done[p.href] ? "bg-green-500/10" : "bg-white/[0.03]"}`}>
                <input type="checkbox" checked={Boolean(done[p.href])} onChange={() => toggleDone(p.href)} className="mt-1 h-4 w-4 accent-green-500" />
                <div className="min-w-0 flex-1">
                  <a href={p.href} target="_blank" rel="noreferrer" className="text-sm font-black text-orange-300">{p.label} ↗</a>
                  <div className="text-xs text-slate-500">{p.tip}</div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => { setDone({}); localStorage.removeItem("abujaPlaytestChecklist"); }} className="mt-3 text-xs font-black text-slate-500">Reset checklist</button>
        </div>
      </section>
    </div>
  );
}
