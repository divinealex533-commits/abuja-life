"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { formatNaira } from "@/lib/vip/catalog";
import { syncPlayerSnapshot } from "@/lib/vip/client";

type WeekendState = {
  loggedIn: boolean;
  isWeekend?: boolean;
  enabled?: boolean;
  weekday?: number;
  claimedToday?: boolean;
  claimedSaturday?: boolean;
  base?: number;
  bonus?: number;
  multiplier?: number;
  amount?: number;
  vipTier?: string | null;
  daysUntilSaturday?: number;
  settings?: {
    saturday_amount: number;
    sunday_amount: number;
    both_days_bonus: number;
  };
  error?: string;
  competition?: Competition;
};

type Competition = {
  prizesEnabled: boolean;
  prizeAmounts: number[];
  weekendKey: string;
  isLive: boolean;
  leaderboard: Array<{ rank: number; name: string; username: string | null; points: number; isMe: boolean }>;
  myPoints: number;
  myRank: number | null;
  myWins: Array<{
    weekendKey: string;
    place: number;
    prizeNaira: number;
    status: "awaiting_details" | "ready_to_pay" | "paid";
    accountLast4: string | null;
  }>;
};

export default function WeekendRewardPanel() {
  const [state, setState] = useState<WeekendState | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/rewards/weekend", { cache: "no-store" });
      setState(await response.json());
    } catch {
      setState({ loggedIn: false, error: "Could not load weekend rewards." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function claim() {
    setClaiming(true);
    setMessage(null);

    try {
      const response = await fetch("/api/rewards/weekend", { method: "POST" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage({ text: data?.error || "Could not claim.", ok: false });
      } else {
        if (data?.player) syncPlayerSnapshot(data.player);
        setMessage({
          text: `You received ${formatNaira(data.amount)}${
            data.multiplier > 1 ? ` (VIP ×${data.multiplier})` : ""
          }!`,
          ok: true,
        });
      }
    } catch {
      setMessage({ text: "Network error. Try again.", ok: false });
    } finally {
      setClaiming(false);
      void load();
    }
  }

  const multiplier = state?.multiplier ?? 1;
  const isSunday = state?.weekday === 0;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.14] via-[#06120d] to-cyan-500/[0.08] p-6 shadow-2xl sm:p-8">
      <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
          🎉 Every Saturday & Sunday
        </div>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Weekend Rewards</h2>
        <p className="mt-1 text-sm text-white/50">
          Free game cash every weekend. Claim both days for a Sunday bonus.
          VIP members get up to 5× more.
        </p>

        {state?.settings && (
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-black/25 p-3">
              <div className="text-[9px] font-black uppercase tracking-wider text-white/35">Saturday</div>
              <div className="mt-1 text-sm font-black text-emerald-300">
                {formatNaira(state.settings.saturday_amount * multiplier)}
              </div>
            </div>
            <div className="rounded-2xl bg-black/25 p-3">
              <div className="text-[9px] font-black uppercase tracking-wider text-white/35">Sunday</div>
              <div className="mt-1 text-sm font-black text-emerald-300">
                {formatNaira(state.settings.sunday_amount * multiplier)}
              </div>
            </div>
            <div className="rounded-2xl bg-black/25 p-3">
              <div className="text-[9px] font-black uppercase tracking-wider text-white/35">Both-day bonus</div>
              <div className="mt-1 text-sm font-black text-amber-300">
                +{formatNaira(state.settings.both_days_bonus * multiplier)}
              </div>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
              message.ok
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                : "border-red-400/20 bg-red-400/10 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6">
          {!state ? (
            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
          ) : !state.loggedIn ? (
            <Link
              href="/login"
              className="block rounded-2xl bg-emerald-400 px-4 py-4 text-center text-sm font-black text-black"
            >
              LOG IN TO CLAIM
            </Link>
          ) : state.enabled === false ? (
            <div className="rounded-2xl bg-white/5 px-4 py-4 text-center text-sm font-bold text-white/50">
              Weekend rewards are paused right now.
            </div>
          ) : !state.isWeekend ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-center text-sm font-bold text-white/60">
              Opens in {state.daysUntilSaturday} day{state.daysUntilSaturday === 1 ? "" : "s"} (Saturday) ⏳
            </div>
          ) : state.claimedToday ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-center text-sm font-black text-emerald-200">
              ✓ Claimed today{isSunday ? "" : ". Come back Sunday for more + bonus!"}
            </div>
          ) : (
            <button
              type="button"
              disabled={claiming}
              onClick={claim}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-4 text-sm font-black text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {claiming
                ? "CLAIMING..."
                : `CLAIM ${formatNaira(state.amount ?? 0)}${
                    state.bonus ? " (incl. both-day bonus)" : ""
                  }`}
            </button>
          )}
        </div>

        {state?.loggedIn && multiplier === 1 && (
          <Link
            href="/vip"
            className="mt-3 block text-center text-xs font-black text-amber-300 hover:text-amber-200"
          >
            👑 VIP members get 2×–5× weekend rewards →
          </Link>
        )}

        {state?.competition && state.competition.prizesEnabled && (
          <WeekendCompetition competition={state.competition} onChanged={load} />
        )}
      </div>
    </section>
  );
}

const PLACE_EMOJI = ["🥇", "🥈", "🥉"];

function WeekendCompetition({
  competition,
  onChanged,
}: {
  competition: Competition;
  onChanged: () => void;
}) {
  const [form, setForm] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const pendingWin = competition.myWins.find((w) => w.status === "awaiting_details");

  async function submitDetails(weekendKey: string) {
    setSaving(true);
    setFormMessage(null);
    try {
      const response = await fetch("/api/rewards/weekend/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekendKey, ...form }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFormMessage({ text: data?.error || "Could not save.", ok: false });
      } else {
        setFormMessage({ text: "Details received! The admin will send your prize.", ok: true });
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50";

  return (
    <div className="mt-8 rounded-3xl border border-amber-400/25 bg-black/30 p-5">
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
        🏆 Weekend Championship · real cash prizes
      </div>
      <p className="mt-2 text-xs leading-5 text-white/50">
        Work career shifts on Saturday and Sunday. Every XP you earn is 1 point. The top
        players win real money, paid to their bank account.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {competition.prizeAmounts.map((amount, i) => (
          <div key={i} className="rounded-2xl bg-amber-400/10 px-3 py-2 text-center">
            <div className="text-[10px] font-black text-amber-200/70">
              {PLACE_EMOJI[i] ?? `#${i + 1}`}
            </div>
            <div className="text-sm font-black text-amber-300">{formatNaira(amount)}</div>
          </div>
        ))}
      </div>

      {/* WINNER: bank details */}
      {pendingWin && (
        <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
          <div className="font-black text-emerald-200">
            🎉 You placed #{pendingWin.place} on the weekend of {pendingWin.weekendKey}! You won{" "}
            {formatNaira(pendingWin.prizeNaira)}.
          </div>
          <p className="mt-1 text-xs text-white/60">Enter the bank account to receive your prize.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <input className={input} placeholder="Bank (e.g. Opay, GTBank)" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
            <input className={input} placeholder="10-digit account number" inputMode="numeric" maxLength={10} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
            <input className={input} placeholder="Account name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
          </div>
          {formMessage && (
            <div className={`mt-2 text-xs font-bold ${formMessage.ok ? "text-emerald-200" : "text-red-200"}`}>{formMessage.text}</div>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => submitDetails(pendingWin.weekendKey)}
            className="mt-3 rounded-2xl bg-emerald-400 px-5 py-3 text-xs font-black text-black hover:bg-emerald-300 disabled:opacity-50"
          >
            {saving ? "SAVING..." : "SEND MY DETAILS"}
          </button>
        </div>
      )}

      {competition.myWins
        .filter((w) => w.status !== "awaiting_details")
        .map((w) => (
          <div key={w.weekendKey} className="mt-3 rounded-2xl bg-white/5 px-4 py-3 text-xs font-bold text-white/70">
            #{w.place} · weekend of {w.weekendKey} · {formatNaira(w.prizeNaira)} —{" "}
            {w.status === "paid"
              ? "✅ Paid"
              : `⏳ Payment on the way to account ••••${w.accountLast4 ?? ""}`}
          </div>
        ))}

      {/* LEADERBOARD */}
      <div className="mt-5 flex items-center justify-between">
        <div className="text-sm font-black">
          {competition.isLive ? "🔴 Live leaderboard" : `Last weekend (${competition.weekendKey})`}
        </div>
        {competition.myRank && (
          <div className="text-xs font-black text-amber-200">
            You: #{competition.myRank} · {competition.myPoints} pts
          </div>
        )}
      </div>

      {competition.leaderboard.length === 0 ? (
        <p className="mt-3 text-xs text-white/40">
          {competition.isLive ? "No points yet — be the first!" : "Opens Saturday."}
        </p>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {competition.leaderboard.map((row) => (
            <li
              key={row.rank}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${row.isMe ? "bg-amber-400/15 font-black" : "bg-white/[0.03]"}`}
            >
              <span>
                <span className="mr-2 inline-block w-6">{PLACE_EMOJI[row.rank - 1] ?? `#${row.rank}`}</span>
                {row.name}
                {row.isMe && " (you)"}
              </span>
              <span className="font-black">{row.points}</span>
            </li>
          ))}
        </ol>
      )}

      {competition.isLive && (
        <Link href="/careers" className="mt-4 block rounded-2xl bg-amber-400 px-4 py-3 text-center text-xs font-black text-black hover:bg-amber-300">
          WORK A SHIFT TO SCORE POINTS →
        </Link>
      )}
    </div>
  );
}
