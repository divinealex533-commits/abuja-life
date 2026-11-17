"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

interface CareerPay {
  id: string;
  name: string;
  emoji: string;
  basePay: number;
  multiplier: number;
}

interface Board {
  id: string;
  advertiser: string;
  headline: string;
  subtext: string;
  color: string;
  slot: number;
  active: boolean;
  ends_at: string | null;
  price_paid: number;
}

interface Election {
  id: string;
  office: string;
  status: "open" | "closed";
  ends_at: string;
  daily_salary: number;
  term_ends_at: string | null;
  winnerName: string | null;
  candidates: { userId: string; name: string | null; votes: number; slogan: string }[];
}

interface LogRow {
  id: string;
  action: string;
  detail: Record<string, unknown>;
  created_at: string;
}

const input =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-400/60";

function Panel({ icon, title, hint, children }: { icon: string; title: string; hint: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-cyan-400/15 bg-gradient-to-b from-[#0d1b2a] to-[#081019] p-5 shadow-[0_0_0_1px_rgba(34,211,238,0.04),0_20px_50px_-20px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl">{icon}</span>
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          <p className="text-xs text-white/45">{hint}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function WorldControlsPage() {
  const [data, setData] = useState<{
    setupMissing: boolean;
    careers: CareerPay[];
    billboards: Board[];
    elections: Election[];
    log: LogRow[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // forms
  const [gift, setGift] = useState({ amount: "100000", reason: "", announce: true });
  const [cap, setCap] = useState({ cap: "50000000", resetTo: "10000" });
  const [pay, setPay] = useState<Record<string, string>>({});
  const [board, setBoard] = useState({ advertiser: "", headline: "", subtext: "", linkUrl: "", color: "#f59e0b", slot: "1", days: "7", pricePaid: "" });
  const [election, setElection] = useState({ office: "FCT Governor", description: "", dailySalary: "25000", hours: "72", termDays: "7" });

  const load = useCallback(async () => {
    const d = await fetch("/api/admin/control", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (d && !d.error) {
      setData(d);
      setPay(Object.fromEntries((d.careers as CareerPay[]).map((c) => [c.id, String(c.multiplier)])));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function run(payload: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    const r = await fetch("/api/admin/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setToast(r.ok ? { tone: "ok", text: d.message || "Done." } : { tone: "err", text: d.error || "Failed." });
    void load();
  }

  const amount = Number(gift.amount) || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Control room</div>
          <h1 className="mt-1 text-4xl font-black">World Controls</h1>
          <p className="mt-1 text-sm text-white/50">Money, job pay, elections and billboards for the whole game.</p>
        </div>
        <a href="/stats" target="_blank" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black">
          🌍 Public stats page ↗
        </a>
      </div>

      {data?.setupMissing && (
        <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          These controls need <b>20261122_control_room.sql</b> run in Supabase first.
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* MONEY */}
        <Panel icon="🎁" title="Give every player money" hint="Use a negative number to take money back (e.g. after an outage refund mistake).">
          <div className="grid grid-cols-2 gap-2">
            <input className={input} inputMode="numeric" value={gift.amount} onChange={(e) => setGift({ ...gift, amount: e.target.value })} placeholder="Amount ₦" />
            <input className={input} value={gift.reason} onChange={(e) => setGift({ ...gift, reason: e.target.value })} placeholder="Reason (shown to players)" />
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-white/60">
            <input type="checkbox" checked={gift.announce} onChange={(e) => setGift({ ...gift, announce: e.target.checked })} />
            Post an announcement about it
          </label>
          <button
            type="button"
            disabled={busy || !amount}
            onClick={() =>
              run(
                { action: "credit-all", amount, reason: gift.reason, announce: gift.announce },
                `${amount > 0 ? "Give" : "Take"} ₦${Math.abs(amount).toLocaleString()} ${amount > 0 ? "to" : "from"} EVERY player?`
              )
            }
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 font-black text-black disabled:opacity-40"
          >
            {amount >= 0 ? `Send ₦${amount.toLocaleString()} to everyone` : `Remove ₦${Math.abs(amount).toLocaleString()} from everyone`}
          </button>
        </Panel>

        <Panel icon="🧹" title="Clean up cheated balances" hint="Anyone with more cash than the limit is reset. For single players use Players → Control.">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-white/50">
              If cash is above ₦
              <input className={`${input} mt-1`} inputMode="numeric" value={cap.cap} onChange={(e) => setCap({ ...cap, cap: e.target.value })} />
            </label>
            <label className="text-xs text-white/50">
              Reset them to ₦
              <input className={`${input} mt-1`} inputMode="numeric" value={cap.resetTo} onChange={(e) => setCap({ ...cap, resetTo: e.target.value })} />
            </label>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                { action: "cap-cash", cap: Number(cap.cap), resetTo: Number(cap.resetTo) },
                `Reset every player above ₦${Number(cap.cap).toLocaleString()} to ₦${Number(cap.resetTo).toLocaleString()}? This can't be undone.`
              )
            }
            className="mt-3 w-full rounded-xl bg-red-500 py-3 font-black disabled:opacity-40"
          >
            Reset balances
          </button>
        </Panel>

        {/* ELECTIONS */}
        <Panel icon="🗳️" title="Elections" hint="Players run, vote at /elections, and the winner collects a daily salary.">
          <div className="grid grid-cols-2 gap-2">
            <input className={`${input} col-span-2`} value={election.office} onChange={(e) => setElection({ ...election, office: e.target.value })} placeholder="Office, e.g. FCT Governor" />
            <input className={`${input} col-span-2`} value={election.description} onChange={(e) => setElection({ ...election, description: e.target.value })} placeholder="Short description (optional)" />
            <label className="text-xs text-white/50">
              Voting lasts (hours)
              <input className={`${input} mt-1`} inputMode="numeric" value={election.hours} onChange={(e) => setElection({ ...election, hours: e.target.value })} />
            </label>
            <label className="text-xs text-white/50">
              Daily salary ₦
              <input className={`${input} mt-1`} inputMode="numeric" value={election.dailySalary} onChange={(e) => setElection({ ...election, dailySalary: e.target.value })} />
            </label>
            <label className="text-xs text-white/50">
              Term (days)
              <input className={`${input} mt-1`} inputMode="numeric" value={election.termDays} onChange={(e) => setElection({ ...election, termDays: e.target.value })} />
            </label>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => run({ action: "election-create", ...election, hours: Number(election.hours), dailySalary: Number(election.dailySalary), termDays: Number(election.termDays) })}
            className="mt-3 w-full rounded-xl bg-emerald-400 py-3 font-black text-black disabled:opacity-40"
          >
            Open election
          </button>

          <div className="mt-4 space-y-2">
            {(data?.elections ?? []).map((e) => (
              <div key={e.id} className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-black">{e.office}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${e.status === "open" ? "bg-emerald-400 text-black" : "bg-white/10"}`}>
                    {e.status === "open" ? `Voting · ends ${new Date(e.ends_at).toLocaleString()}` : "Closed"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-white/50">
                  {e.candidates.length
                    ? e.candidates.map((c) => `${c.name} (${c.votes})`).join(" · ")
                    : "No candidates yet"}
                </div>
                {e.status === "closed" && (
                  <div className="mt-1 text-xs">
                    Winner: <b>{e.winnerName ?? "nobody"}</b>
                    {e.term_ends_at && new Date(e.term_ends_at) > new Date() && (
                      <button
                        type="button"
                        onClick={() => run({ action: "election-remove-winner", id: e.id }, "End this winner's term now?")}
                        className="ml-2 font-black text-red-300"
                      >
                        End term
                      </button>
                    )}
                  </div>
                )}
                {e.status === "open" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run({ action: "election-close", id: e.id }, "Close voting now and announce the winner?")}
                    className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-black"
                  >
                    Close voting now
                  </button>
                )}
              </div>
            ))}
          </div>
        </Panel>

        {/* BILLBOARDS */}
        <Panel icon="🪧" title="Billboards" hint="Rent out billboards. They stand in the walkable city and on the game screen.">
          <div className="grid grid-cols-2 gap-2">
            <input className={input} value={board.advertiser} onChange={(e) => setBoard({ ...board, advertiser: e.target.value })} placeholder="Advertiser" />
            <input className={input} value={board.headline} onChange={(e) => setBoard({ ...board, headline: e.target.value })} placeholder="Headline" />
            <input className={`${input} col-span-2`} value={board.subtext} onChange={(e) => setBoard({ ...board, subtext: e.target.value })} placeholder="Small text (optional)" />
            <input className={`${input} col-span-2`} value={board.linkUrl} onChange={(e) => setBoard({ ...board, linkUrl: e.target.value })} placeholder="Link https://... (optional)" />
            <label className="text-xs text-white/50">
              Colour
              <input type="color" className="mt-1 h-10 w-full rounded-xl bg-black/40" value={board.color} onChange={(e) => setBoard({ ...board, color: e.target.value })} />
            </label>
            <label className="text-xs text-white/50">
              Spot in city (1–6)
              <input className={`${input} mt-1`} inputMode="numeric" value={board.slot} onChange={(e) => setBoard({ ...board, slot: e.target.value })} />
            </label>
            <label className="text-xs text-white/50">
              Days (0 = forever)
              <input className={`${input} mt-1`} inputMode="numeric" value={board.days} onChange={(e) => setBoard({ ...board, days: e.target.value })} />
            </label>
            <label className="text-xs text-white/50">
              They paid ₦ (for records)
              <input className={`${input} mt-1`} inputMode="numeric" value={board.pricePaid} onChange={(e) => setBoard({ ...board, pricePaid: e.target.value })} />
            </label>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => run({ action: "billboard-create", ...board, slot: Number(board.slot), days: Number(board.days), pricePaid: Number(board.pricePaid) })}
            className="mt-3 w-full rounded-xl bg-amber-400 py-3 font-black text-black disabled:opacity-40"
          >
            Put billboard up
          </button>

          <div className="mt-4 space-y-2">
            {(data?.billboards ?? []).map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm">
                <span className="h-10 w-3 rounded" style={{ background: b.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-black">{b.headline}</div>
                  <div className="truncate text-xs text-white/50">
                    {b.advertiser} · spot {b.slot}
                    {b.ends_at ? ` · until ${new Date(b.ends_at).toLocaleDateString()}` : ""}
                    {b.price_paid ? ` · ₦${b.price_paid.toLocaleString()}` : ""}
                  </div>
                </div>
                <button type="button" onClick={() => run({ action: "billboard-toggle", id: b.id, active: !b.active })} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-black">
                  {b.active ? "Hide" : "Show"}
                </button>
                <button type="button" onClick={() => run({ action: "billboard-delete", id: b.id }, "Delete this billboard?")} className="rounded-lg bg-red-500/20 px-2 py-1 text-xs font-black text-red-200">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </Panel>

        {/* JOB PAY */}
        <Panel icon="💼" title="Job pay" hint="1 = normal pay, 1.5 = 50% more, 0.8 = 20% less. Applies to every shift from now on.">
          <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
            {(data?.careers ?? []).map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 text-sm">
                <span className="text-xl">{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{c.name}</div>
                  <div className="text-[11px] text-white/45">
                    Base ₦{c.basePay.toLocaleString()} → ₦{Math.round(c.basePay * (Number(pay[c.id]) || 1)).toLocaleString()}
                  </div>
                </div>
                <input
                  className="w-16 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-center text-sm font-black outline-none focus:border-cyan-400/60"
                  inputMode="decimal"
                  value={pay[c.id] ?? "1"}
                  onChange={(e) => setPay({ ...pay, [c.id]: e.target.value })}
                />
                <button
                  type="button"
                  disabled={busy || Number(pay[c.id]) === c.multiplier}
                  onClick={() => run({ action: "set-pay", careerId: c.id, multiplier: Number(pay[c.id]) })}
                  className="rounded-lg bg-cyan-400 px-2.5 py-1.5 text-xs font-black text-black disabled:opacity-30"
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </Panel>

        {/* LOG */}
        <Panel icon="📜" title="Control log" hint="Every world control an admin has used.">
          <div className="max-h-[420px] space-y-1.5 overflow-y-auto text-xs">
            {(data?.log ?? []).length === 0 && <p className="text-white/40">Nothing yet.</p>}
            {(data?.log ?? []).map((l) => (
              <div key={l.id} className="flex justify-between gap-3 rounded-lg bg-black/30 px-3 py-2">
                <span className="font-black">{l.action}</span>
                <span className="truncate text-white/50">{JSON.stringify(l.detail)}</span>
                <span className="shrink-0 text-white/40">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-black shadow-2xl ${
            toast.tone === "ok" ? "bg-emerald-400 text-black" : "bg-red-500"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
