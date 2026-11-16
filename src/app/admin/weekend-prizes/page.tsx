"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { formatNaira } from "@/lib/vip/catalog";

type Winner = {
  weekend_key: string;
  user_id: string;
  place: number;
  points: number;
  prize_naira: number;
  status: "awaiting_details" | "ready_to_pay" | "paid" | "cancelled";
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  paid_at: string | null;
  paid_reference: string | null;
};

type Data = {
  weekendKey: string;
  liveWeekendKey: string | null;
  hasEnded: boolean;
  settings: { prizesEnabled: boolean; prizeAmounts: number[] };
  leaderboard: Array<{ rank: number; userId: string; name: string; username: string | null; points: number }>;
  winners: Winner[];
  owed: number;
  paidTotal: number;
  recentWeekends: string[];
};

const STATUS_LABEL: Record<Winner["status"], string> = {
  awaiting_details: "Waiting for bank details",
  ready_to_pay: "Ready to pay",
  paid: "Paid",
  cancelled: "Cancelled",
};

export default function AdminWeekendPrizesPage() {
  const [data, setData] = useState<Data | null>(null);
  const [weekend, setWeekend] = useState("");
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [prizeText, setPrizeText] = useState("");
  const [prizesEnabled, setPrizesEnabled] = useState(true);
  const [refs, setRefs] = useState<Record<number, string>>({});

  const load = useCallback(async (key?: string) => {
    const response = await fetch(`/api/admin/weekend-prizes${key ? `?weekend=${key}` : ""}`, { cache: "no-store" });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setNotice({ text: json?.error || "Could not load.", ok: false });
      return;
    }
    setData(json);
    setWeekend(json.weekendKey);
    setPrizeText(json.settings.prizeAmounts.join(", "));
    setPrizesEnabled(json.settings.prizesEnabled);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function send(method: "POST" | "PATCH", payload: Record<string, unknown>, success: string) {
    setNotice(null);
    const response = await fetch("/api/admin/weekend-prizes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setNotice({ text: json?.error || "Something went wrong.", ok: false });
      return;
    }
    setNotice({ text: success, ok: true });
    void load(weekend);
  }

  const input =
    "rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Link href="/admin" className="text-xs font-bold text-orange-400 hover:text-orange-300">
        ← Admin Dashboard
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Weekend Prizes (real money)</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-500">
        Players earn points from career shifts every Saturday and Sunday. On Monday, finalize the
        weekend to pick the winners. Winners enter their bank details in the game. You send the
        money from your bank app, then mark it paid here with the transfer reference.
      </p>

      {notice && (
        <div className={`mt-6 rounded-2xl border p-4 text-sm ${notice.ok ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>
          {notice.text}
        </div>
      )}

      {/* SUMMARY */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">You still owe</p>
          <p className="mt-3 text-2xl font-black">{formatNaira(data?.owed ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Paid out (recent)</p>
          <p className="mt-3 text-2xl font-black">{formatNaira(data?.paidTotal ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live now</p>
          <p className="mt-3 text-lg font-black">
            {data?.liveWeekendKey ? `Weekend of ${data.liveWeekendKey}` : "No — opens Saturday"}
          </p>
        </div>
      </section>

      {/* SETTINGS */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-black">Prize amounts</h2>
        <p className="mt-1 text-xs text-slate-500">
          Real Naira for 1st, 2nd, 3rd… separated by commas. Example: 20000, 10000, 5000
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input className={`${input} sm:w-96`} value={prizeText} onChange={(e) => setPrizeText(e.target.value)} />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={prizesEnabled} onChange={(e) => setPrizesEnabled(e.target.checked)} />
            Show prizes to players
          </label>
          <button
            type="button"
            onClick={() =>
              send(
                "PATCH",
                {
                  action: "settings",
                  prizesEnabled,
                  prizeAmounts: prizeText.split(",").map((p) => Number(p.replace(/[^\d]/g, ""))),
                },
                "Prize settings saved."
              )
            }
            className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-400"
          >
            Save prizes
          </button>
        </div>
      </section>

      {/* WEEKEND PICKER */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black">Weekend of {data?.weekendKey}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {data?.hasEnded ? "This weekend is over." : "This weekend is still running."}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              className={input}
              value={weekend}
              onChange={(e) => setWeekend(e.target.value)}
            />
            <button type="button" onClick={() => load(weekend)} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black hover:bg-white/5">
              Load
            </button>
          </div>
        </div>
        {data && data.recentWeekends.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {data.recentWeekends.map((key) => (
              <button key={key} type="button" onClick={() => load(key)} className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/5">
                {key}
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-slate-600">Pick the Saturday of the weekend.</p>

        {/* WINNERS */}
        {data && data.winners.length > 0 ? (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Winners</h3>
            {data.winners.map((w) => {
              const name = data.leaderboard.find((r) => r.userId === w.user_id)?.name ?? w.user_id;
              return (
                <div key={w.place} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-black">
                      #{w.place} {name} · {w.points} pts
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-green-400">{formatNaira(w.prize_naira)}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase">{STATUS_LABEL[w.status]}</span>
                    </div>
                  </div>

                  {w.account_number && (
                    <div className="mt-2 text-sm text-slate-300">
                      🏦 {w.bank_name} · <span className="font-mono">{w.account_number}</span> · {w.account_name}
                    </div>
                  )}

                  {w.status === "paid" && (
                    <div className="mt-2 text-xs text-green-300">
                      Paid {w.paid_at ? new Date(w.paid_at).toLocaleString("en-NG") : ""} · Ref {w.paid_reference}
                    </div>
                  )}

                  {w.status === "ready_to_pay" && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        className={`${input} sm:w-72`}
                        placeholder="Bank transfer reference"
                        value={refs[w.place] ?? ""}
                        onChange={(e) => setRefs({ ...refs, [w.place]: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          send("PATCH", { action: "mark_paid", weekendKey: w.weekend_key, place: w.place, reference: refs[w.place] ?? "" }, "Marked as paid.")
                        }
                        className="rounded-xl bg-green-500 px-4 py-2 text-xs font-black text-black hover:bg-green-400"
                      >
                        I sent the money — mark paid
                      </button>
                    </div>
                  )}

                  {w.status !== "paid" && w.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => send("PATCH", { action: "cancel", weekendKey: w.weekend_key, place: w.place, reason: "Cancelled by admin" }, "Prize cancelled.")}
                      className="mt-2 text-[11px] font-bold text-red-300 hover:text-red-200"
                    >
                      Cancel this prize (e.g. cheating)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">
            No winners chosen for this weekend yet.
            {data?.hasEnded && (data?.leaderboard.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => send("POST", { action: "finalize", weekendKey: data!.weekendKey }, "Winners chosen. They'll see it in the game.")}
                className="ml-3 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-black hover:bg-amber-400"
              >
                Finalize & pick top {data?.settings.prizeAmounts.length}
              </button>
            )}
          </div>
        )}

        {/* LEADERBOARD */}
        <h3 className="mt-8 text-sm font-black uppercase tracking-widest text-slate-400">Leaderboard</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="py-2">#</th>
                <th>Player</th>
                <th>Points</th>
                <th>Player ID</th>
              </tr>
            </thead>
            <tbody>
              {(data?.leaderboard ?? []).map((row) => (
                <tr key={row.userId} className="border-t border-white/5">
                  <td className="py-2 font-black">{row.rank}</td>
                  <td>
                    {row.name} {row.username && <span className="text-slate-500">@{row.username}</span>}
                  </td>
                  <td className="font-black">{row.points}</td>
                  <td className="font-mono text-xs">
                    <Link href={`/admin/players/${row.userId}`} className="hover:text-orange-300">{row.userId}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.leaderboard.length ?? 0) === 0 && <p className="py-4 text-sm text-slate-500">No points scored.</p>}
        </div>
      </section>
    </div>
  );
}
