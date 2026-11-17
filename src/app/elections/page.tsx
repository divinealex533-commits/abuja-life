"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import CharacterAvatar from "@/components/character/CharacterAvatar";
import { syncPlayerSnapshot } from "@/lib/vip/client";

interface Candidate {
  userId: string;
  name: string;
  username: string;
  appearance: unknown;
  slogan: string;
  votes: number;
}

interface OpenElection {
  id: string;
  office: string;
  description: string;
  dailySalary: number;
  termDays: number;
  endsAt: string;
  myVote: string | null;
  imRunning: boolean;
  totalVotes: number;
  candidates: Candidate[];
}

interface Officeholder {
  electionId: string;
  office: string;
  userId: string;
  name: string;
  appearance: unknown;
  dailySalary: number;
  termEndsAt: string;
  canClaim: boolean;
}

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Voting closed";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h left` : `${h}h ${m}m left`;
}

export default function ElectionsPage() {
  const [open, setOpen] = useState<OpenElection[]>([]);
  const [officeholders, setOfficeholders] = useState<Officeholder[]>([]);
  const [setupMissing, setSetupMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [slogan, setSlogan] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    const d = await fetch("/api/elections", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    setOpen(d?.open ?? []);
    setOfficeholders(d?.officeholders ?? []);
    setSetupMissing(Boolean(d?.setupMissing));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => tick((n) => n + 1), 30_000);
    const p = window.setInterval(() => void load(), 45_000);
    return () => {
      window.clearInterval(t);
      window.clearInterval(p);
    };
  }, [load]);

  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    const r = await fetch("/api/elections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (!r.ok) setMessage({ tone: "err", text: d.error || "Something went wrong." });
    else {
      setMessage({ tone: "ok", text: d.message || "Done." });
      if (d.player) syncPlayerSnapshot(d.player);
    }
    void load();
  }

  return (
    <main className="min-h-screen bg-[#08101c] pb-28 text-white">
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-emerald-700/40 via-[#0b1424] to-[#0b1424]">
        <div className="absolute inset-x-0 top-0 flex h-2">
          <div className="flex-1 bg-emerald-500" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-emerald-500" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Link href="/game" className="text-xs font-black text-white/60">
            ← BACK TO CITY
          </Link>
          <h1 className="mt-3 text-4xl font-black">🗳️ Abuja Elections</h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Run for office or vote for your favourite player. Winners hold office and collect a daily salary for their
            whole term. One vote per player.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {message && (
          <div
            className={`rounded-xl border p-3 text-sm font-bold ${
              message.tone === "ok"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-400/30 bg-red-500/10 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {setupMissing && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            Elections aren&apos;t switched on yet. Admin: run 20261122_control_room.sql in Supabase.
          </div>
        )}

        {/* officeholders */}
        {officeholders.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-amber-200">In office now</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {officeholders.map((o) => (
                <div
                  key={o.electionId}
                  className="flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-gradient-to-r from-amber-500/15 to-transparent p-3"
                >
                  <CharacterAvatar appearance={o.appearance as never} size={90} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black uppercase text-amber-200">{o.office}</div>
                    <div className="truncate text-lg font-black">{o.name}</div>
                    <div className="text-xs text-white/50">
                      ₦{o.dailySalary.toLocaleString()}/day · until {new Date(o.termEndsAt).toLocaleDateString()}
                    </div>
                    {o.canClaim && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act({ action: "claim", electionId: o.electionId })}
                        className="mt-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-black disabled:opacity-50"
                      >
                        💰 Collect today&apos;s salary
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="text-white/50">Loading ballots...</div>
        ) : open.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="text-5xl">📭</div>
            <p className="mt-3 font-black">No election is running right now.</p>
            <p className="mt-1 text-sm text-white/50">Check back soon. The next one will be announced.</p>
          </div>
        ) : (
          open.map((e) => {
            const top = e.candidates[0]?.votes ?? 0;
            return (
              <section key={e.id} className="overflow-hidden rounded-3xl border border-emerald-400/25 bg-white/[0.03]">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 bg-emerald-500/10 p-5">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">Now voting</div>
                    <h2 className="text-2xl font-black">{e.office}</h2>
                    {e.description && <p className="mt-1 text-sm text-white/60">{e.description}</p>}
                    <p className="mt-1 text-xs text-white/50">
                      Winner earns ₦{e.dailySalary.toLocaleString()}/day for {e.termDays} days
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="rounded-full bg-black/40 px-3 py-1 text-sm font-black">⏱ {timeLeft(e.endsAt)}</div>
                    <div className="mt-1 text-xs text-white/50">{e.totalVotes} vote(s) cast</div>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  {e.candidates.length === 0 && (
                    <p className="text-sm text-white/50">No candidates yet. Be the first to run!</p>
                  )}
                  {e.candidates.map((c, i) => {
                    const pct = e.totalVotes ? Math.round((c.votes / e.totalVotes) * 100) : 0;
                    const mine = e.myVote === c.userId;
                    return (
                      <div
                        key={c.userId}
                        className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 ${
                          mine ? "border-emerald-300 bg-emerald-500/10" : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-emerald-400/10 transition-[width] duration-700"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative shrink-0">
                          <CharacterAvatar appearance={c.appearance as never} size={76} />
                          {i === 0 && top > 0 && (
                            <span className="absolute -left-1 -top-1 rounded-full bg-amber-400 px-1.5 text-xs font-black text-black">
                              👑
                            </span>
                          )}
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <div className="truncate font-black">{c.name}</div>
                          {c.slogan && <div className="truncate text-xs italic text-white/60">&ldquo;{c.slogan}&rdquo;</div>}
                          <div className="mt-1 text-xs font-bold text-emerald-200">
                            {c.votes} vote{c.votes === 1 ? "" : "s"} · {pct}%
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={busy || Boolean(e.myVote)}
                          onClick={() => act({ action: "vote", electionId: e.id, candidateId: c.userId })}
                          className={`relative shrink-0 rounded-xl px-4 py-2.5 text-sm font-black ${
                            mine ? "bg-emerald-400 text-black" : "bg-white/10 disabled:opacity-40"
                          }`}
                        >
                          {mine ? "✓ Your vote" : "Vote"}
                        </button>
                      </div>
                    );
                  })}

                  {!e.imRunning && (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-4">
                      <div className="font-black">🎤 Run for {e.office}</div>
                      <input
                        value={slogan}
                        onChange={(ev) => setSlogan(ev.target.value)}
                        maxLength={80}
                        placeholder="Your campaign slogan, e.g. Light for every street!"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-emerald-400/60"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act({ action: "run", electionId: e.id, slogan })}
                        className="mt-2 w-full rounded-xl bg-emerald-400 py-3 font-black text-black disabled:opacity-50"
                      >
                        Put me on the ballot
                      </button>
                    </div>
                  )}
                  {e.imRunning && (
                    <p className="text-center text-xs font-bold text-emerald-200">
                      You&apos;re on the ballot. Share your profile and ask friends to vote for you!
                    </p>
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
