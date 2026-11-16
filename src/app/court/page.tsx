"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  AGENCY_INFO,
  getCharge,
  LAWYERS,
  lawyerFee,
  type Agency,
  type LawyerTier,
} from "@/lib/justice/catalog";
import { formatNaira } from "@/lib/vip/catalog";

type CourtCase = {
  id: string;
  charge_key: string;
  charge: string;
  agency: Agency;
  severity: string;
  details: string;
  fine_min: number;
  fine_max: number;
  status: string;
  verdict: string | null;
  fine_paid: number;
  jail_hours: number;
  lawyer_fee: number;
  filed_at: string;
  deadline_at: string;
};

type CourtData = {
  loggedIn: boolean;
  status?: { jailed: boolean; jailedUntil: string | null; openCases: number; overdueCases: number };
  bail?: number;
  cash?: number;
  cases: CourtCase[];
};

const TIERS: LawyerTier[] = ["legal_aid", "private", "san"];

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "overdue";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CourtPage() {
  const [data, setData] = useState<CourtData | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [lawyer, setLawyer] = useState<LawyerTier>("legal_aid");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [verdict, setVerdict] = useState<{ status: string; verdict: string; fine: number; jailHours: number } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/court", { cache: "no-store" });
    setData(await r.json().catch(() => ({ loggedIn: false, cases: [] })));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function trial(caseId: string, plea: "guilty" | "not_guilty") {
    setBusy(true);
    setMessage(null);
    setVerdict(null);
    try {
      const r = await fetch("/api/court", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trial", caseId, plea, lawyer }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) setMessage({ text: d?.error || "The court couldn't hear your case.", ok: false });
      else {
        setVerdict(d.outcome);
        setActive(null);
        window.dispatchEvent(new Event("abujaLifePlayerUpdated"));
      }
    } finally {
      setBusy(false);
      void load();
    }
  }

  async function bail() {
    setBusy(true);
    setMessage(null);
    const r = await fetch("/api/court", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bail" }),
    });
    const d = await r.json().catch(() => null);
    setMessage(r.ok ? { text: `Bail of ${formatNaira(d.bail)} paid. You're free to go.`, ok: true } : { text: d?.error || "Bail failed.", ok: false });
    setBusy(false);
    void load();
  }

  const open = (data?.cases ?? []).filter((c) => c.status === "awaiting_trial");
  const closed = (data?.cases ?? []).filter((c) => c.status !== "awaiting_trial");

  return (
    <main className="min-h-screen bg-[#0d0b08] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0b08]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/game" className="text-xs font-black text-white/60">← BACK TO GAME</Link>
          <div className="text-sm font-black">⚖️ FCT High Court</div>
          <Link href="/efcc" className="text-xs font-black text-red-300">EFCC →</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <section className="rounded-[2rem] border border-amber-700/30 bg-gradient-to-br from-amber-900/30 via-[#15100a] to-transparent p-8">
          <div className="text-5xl">🏛️</div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">FCT High Court, Maitama</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Shady choices at work can get you charged by the Police, EFCC, NAFDAC or Customs. Answer your case
            within 48 hours. Plead guilty for a lighter fine, or fight it with a lawyer. A Senior Advocate of
            Nigeria gives you the best chance.
          </p>
        </section>

        {data && !data.loggedIn && (
          <div className="mt-6 rounded-2xl border border-white/10 p-6 text-center">
            <Link href="/login" className="font-black text-amber-300">Log in to see your cases →</Link>
          </div>
        )}

        {/* JAIL */}
        {data?.status?.jailed && data.status.jailedUntil && (
          <section className="mt-6 rounded-3xl border border-red-500/40 bg-red-500/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-3xl">🔒</div>
                <h2 className="mt-1 text-xl font-black text-red-200">You&apos;re in Kuje Prison</h2>
                <p className="text-sm text-white/60">
                  Released in {timeLeft(data.status.jailedUntil)}. You can&apos;t work until then.
                </p>
              </div>
              <button type="button" disabled={busy} onClick={bail} className="rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-black disabled:opacity-50">
                PAY BAIL · {formatNaira(data.bail ?? 0)}
              </button>
            </div>
          </section>
        )}

        {message && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm font-bold ${message.ok ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>
            {message.text}
          </div>
        )}

        {verdict && (
          <section className={`mt-6 rounded-3xl border p-6 text-center ${verdict.status === "acquitted" ? "border-emerald-400/40 bg-emerald-400/10" : "border-red-500/40 bg-red-500/10"}`}>
            <div className="text-5xl">{verdict.status === "acquitted" ? "🎉" : "🔨"}</div>
            <h2 className="mt-2 text-2xl font-black">{verdict.status === "acquitted" ? "NOT GUILTY" : "GUILTY"}</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/70">{verdict.verdict}</p>
            {(verdict.fine > 0 || verdict.jailHours > 0) && (
              <p className="mt-2 text-sm font-black">
                {verdict.fine > 0 && `Fine: ${formatNaira(verdict.fine)}`} {verdict.jailHours > 0 && `· Jail: ${verdict.jailHours}h`}
              </p>
            )}
          </section>
        )}

        {/* OPEN CASES */}
        <h2 className="mt-10 text-2xl font-black">Your open cases</h2>
        {data?.loggedIn && open.length === 0 && (
          <div className="mt-4 rounded-3xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">
            ✅ No cases. Keep it clean!
          </div>
        )}

        <div className="mt-4 space-y-4">
          {open.map((c) => {
            const agency = AGENCY_INFO[c.agency];
            const charge = getCharge(c.charge_key);
            const overdue = new Date(c.deadline_at).getTime() < Date.now();
            return (
              <article key={c.id} className={`rounded-3xl border p-6 ${overdue ? "border-red-500/50 bg-red-500/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className={`text-xs font-black uppercase tracking-wider ${agency.color}`}>{agency.emoji} {agency.name}</div>
                    <h3 className="mt-1 text-xl font-black">{c.charge}</h3>
                    <p className="mt-1 text-sm text-white/55">{c.details}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${overdue ? "bg-red-500 text-white" : "bg-amber-400/15 text-amber-200"}`}>
                    {overdue ? "Bench warrant" : `Hearing in ${timeLeft(c.deadline_at)}`}
                  </span>
                </div>
                <div className="mt-3 text-xs text-white/45">
                  Possible fine {formatNaira(c.fine_min)}–{formatNaira(c.fine_max)}
                  {charge && ` · up to ${charge.jailHours}h jail if convicted`}
                </div>

                {active === c.id ? (
                  <div className="mt-5 space-y-3">
                    <div className="text-sm font-black">Choose your lawyer</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {TIERS.map((t) => {
                        const option = LAWYERS[t];
                        const fee = charge ? lawyerFee(charge, t) : 0;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setLawyer(t)}
                            className={`rounded-2xl border p-4 text-left ${lawyer === t ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-black/25"}`}
                          >
                            <div className="text-sm font-black">{option.name}</div>
                            <div className="mt-1 text-xs text-white/50">{option.description}</div>
                            <div className="mt-2 text-sm font-black text-amber-300">{fee === 0 ? "Free" : formatNaira(fee)}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button type="button" disabled={busy} onClick={() => trial(c.id, "not_guilty")} className="flex-1 rounded-2xl bg-amber-400 py-4 text-sm font-black text-black disabled:opacity-50">
                        {busy ? "IN COURT…" : "PLEAD NOT GUILTY & FIGHT IT"}
                      </button>
                      <button type="button" disabled={busy} onClick={() => trial(c.id, "guilty")} className="rounded-2xl border border-white/15 px-5 py-4 text-sm font-black disabled:opacity-50">
                        Plead guilty · fine {formatNaira(c.fine_min)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setActive(c.id)} className="mt-5 rounded-2xl bg-amber-400 px-6 py-3 text-xs font-black text-black">
                    GO TO COURT →
                  </button>
                )}
              </article>
            );
          })}
        </div>

        {closed.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-black">Past cases</h2>
            <div className="mt-3 space-y-2">
              {closed.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/[0.03] px-4 py-3 text-sm">
                  <span>{c.charge}</span>
                  <span className={c.status === "acquitted" || c.status === "pardoned" || c.status === "dismissed" ? "font-black text-emerald-300" : "font-black text-red-300"}>
                    {c.status.replace("_", " ")}
                    {c.fine_paid > 0 && ` · ${formatNaira(c.fine_paid)}`}
                    {c.jail_hours > 0 && ` · ${c.jail_hours}h jail`}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
