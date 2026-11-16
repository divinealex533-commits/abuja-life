"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CourtCase = {
  id: string;
  defendant: string;
  charge: string;
  agency: string;
  severity: string;
  status: string;
  plea: string | null;
  lawyer_tier: string | null;
  fine_paid: number;
  jail_hours: number;
  verdict: string | null;
  filed_at: string;
  deadline_at: string;
};

const naira = (v: number) => `₦${Math.round(v || 0).toLocaleString("en-NG")}`;

export default function AdminCourtsPage() {
  const [cases, setCases] = useState<CourtCase[]>([]);
  const [jailed, setJailed] = useState<{ user_id: string; name: string; jailed_until: string }[]>([]);
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/courts", { cache: "no-store" });
    const d = await r.json().catch(() => null);
    if (!r.ok) return setError(d?.error || "Couldn't load cases.");
    setCases(d.cases);
    setJailed(d.jailed);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, string>) {
    const r = await fetch("/api/admin/courts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) setError((await r.json().catch(() => null))?.error || "Action failed.");
    void load();
  }

  const shown = cases.filter((c) => (tab === "open" ? c.status === "awaiting_trial" : c.status !== "awaiting_trial"));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 text-white">
      <Link href="/admin" className="text-xs font-black text-slate-400">← Admin</Link>
      <h1 className="mt-3 text-3xl font-black">⚖️ Courts &amp; EFCC</h1>
      <p className="mt-1 text-sm text-slate-400">Every charge from shady career choices lands here. You can pardon, dismiss or release.</p>
      {error && <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <section className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/[0.05] p-5">
        <div className="text-sm font-black">🔒 In jail now ({jailed.length})</div>
        <div className="mt-3 space-y-2">
          {jailed.length === 0 && <p className="text-sm text-slate-500">Nobody in Kuje right now.</p>}
          {jailed.map((j) => (
            <div key={j.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/30 px-4 py-2 text-sm">
              <span>{j.name} · until {new Date(j.jailed_until).toLocaleString("en-NG")}</span>
              <button type="button" onClick={() => act({ action: "release", userId: j.user_id })} className="rounded-lg bg-emerald-400 px-3 py-1 text-xs font-black text-black">Release</button>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex gap-2">
        {(["open", "closed"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-black ${tab === t ? "bg-orange-500 text-black" : "bg-white/5 text-slate-400"}`}>
            {t === "open" ? `Open (${cases.filter((c) => c.status === "awaiting_trial").length})` : "Closed"}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-3">Player</th>
              <th className="p-3">Charge</th>
              <th className="p-3">Agency</th>
              <th className="p-3">Status</th>
              <th className="p-3">Filed</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.id} className="border-t border-white/5 align-top">
                <td className="p-3">{c.defendant}</td>
                <td className="p-3">{c.charge}<div className="text-xs text-slate-500">{c.severity}</div></td>
                <td className="p-3 uppercase">{c.agency}</td>
                <td className="p-3">
                  {c.status.replace("_", " ")}
                  {c.status === "awaiting_trial" && new Date(c.deadline_at).getTime() < Date.now() && <div className="text-xs font-black text-red-400">OVERDUE</div>}
                  {c.fine_paid > 0 && <div className="text-xs text-slate-400">Fine {naira(c.fine_paid)}</div>}
                  {c.jail_hours > 0 && <div className="text-xs text-slate-400">{c.jail_hours}h jail</div>}
                  {c.lawyer_tier && <div className="text-xs text-slate-500">Lawyer: {c.lawyer_tier}</div>}
                </td>
                <td className="p-3 text-xs text-slate-400">{new Date(c.filed_at).toLocaleString("en-NG")}</td>
                <td className="p-3">
                  {c.status === "awaiting_trial" && (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => act({ action: "dismiss", caseId: c.id })} className="rounded-lg border border-white/15 px-2 py-1 text-xs font-black">Dismiss</button>
                      <button type="button" onClick={() => act({ action: "pardon", caseId: c.id })} className="rounded-lg bg-emerald-400 px-2 py-1 text-xs font-black text-black">Pardon</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">No cases.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
