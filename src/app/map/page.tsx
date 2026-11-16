"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { STATES, type GameState } from "@/lib/world/states";

const COLS = 7;
const ROWS = 8;

export default function MapPage() {
  const [selected, setSelected] = useState<GameState>(STATES.find((s) => s.id === "fct")!);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await fetch("/api/states/waitlist", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (d) {
      setCounts(d.counts ?? {});
      setMine(d.mine ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grid = useMemo(() => {
    const cells: (GameState | null)[] = Array(COLS * ROWS).fill(null);
    for (const s of STATES) cells[s.row * COLS + s.col] = s;
    return cells;
  }, []);

  async function toggleNotify(stateId: string) {
    setBusy(true);
    setMessage(null);
    const r = await fetch("/api/states/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stateId }),
    });
    const d = await r.json().catch(() => null);
    setBusy(false);
    if (!r.ok) setMessage(d?.error || "Something went wrong.");
    else setMessage(d.joined ? "🔔 You'll be notified when it opens!" : "Removed from the list.");
    void load();
  }

  const joined = mine.includes(selected.id);

  return (
    <main className="min-h-screen bg-[#06090f] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#06090f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/game" className="text-xs font-black text-white/60">← BACK TO GAME</Link>
          <div className="text-sm font-black">🗺️ Nigeria</div>
          <span className="text-xs font-black text-emerald-300">1 of 37 open</span>
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h1 className="text-3xl font-black sm:text-4xl">The Naija Life map</h1>
          <p className="mt-2 text-sm text-white/55">Abuja is live. Lagos is coming next. Tap any state and get notified when it opens.</p>

          <div className="mt-6 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
            {grid.map((s, i) =>
              s ? (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border p-1 text-center transition ${
                    s.status === "live"
                      ? "animate-pulse border-emerald-300 bg-emerald-400 text-black"
                      : s.status === "next"
                        ? "border-amber-300/70 bg-amber-400/25 text-amber-100"
                        : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08]"
                  } ${selected.id === s.id ? "ring-2 ring-white" : ""}`}
                >
                  <span className="text-[9px] font-black leading-tight sm:text-[11px]">{s.name.replace(" Abuja", "")}</span>
                  {s.status === "live" && <span className="mt-0.5 text-[8px] font-black">LIVE</span>}
                  {s.status === "next" && <span className="mt-0.5 text-[8px] font-black">NEXT</span>}
                  {mine.includes(s.id) && <span className="absolute right-0.5 top-0.5 text-[9px]">🔔</span>}
                </button>
              ) : (
                <div key={`empty-${i}`} />
              )
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/50">
            <span><span className="mr-1 inline-block h-3 w-3 rounded bg-emerald-400" />Live</span>
            <span><span className="mr-1 inline-block h-3 w-3 rounded bg-amber-400/50" />Coming next</span>
            <span><span className="mr-1 inline-block h-3 w-3 rounded bg-white/10" />Coming soon</span>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className={`rounded-[2rem] border p-6 ${selected.status === "live" ? "border-emerald-400/40 bg-emerald-400/10" : selected.status === "next" ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-white/[0.03]"}`}>
            <div className="text-xs font-black uppercase tracking-[0.25em] text-white/50">
              {selected.status === "live" ? "🟢 Live now" : selected.status === "next" ? "🟡 Coming next" : "⏳ Coming soon"}
            </div>
            <h2 className="mt-2 text-3xl font-black">{selected.name}</h2>
            <div className="text-sm text-white/50">Capital: {selected.capital}</div>
            <p className="mt-4 text-sm leading-6 text-white/70">
              {selected.teaser ?? `${selected.name} is on the way, with new careers, places and businesses to own.`}
            </p>

            {selected.status === "live" ? (
              <Link href="/game" className="mt-6 block rounded-2xl bg-emerald-400 py-4 text-center text-sm font-black text-black">PLAY IN ABUJA →</Link>
            ) : (
              <>
                <div className="mt-6 text-sm text-white/60">
                  <b className="text-white">{counts[selected.id] ?? 0}</b> player{(counts[selected.id] ?? 0) === 1 ? "" : "s"} waiting
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggleNotify(selected.id)}
                  className={`mt-3 w-full rounded-2xl py-4 text-sm font-black disabled:opacity-50 ${joined ? "border border-white/20 text-white/70" : "bg-amber-400 text-black"}`}
                >
                  {joined ? "✓ YOU'LL BE NOTIFIED (tap to cancel)" : "🔔 NOTIFY ME WHEN IT OPENS"}
                </button>
              </>
            )}
            {message && <p className="mt-3 text-sm font-bold text-white/70">{message}</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
