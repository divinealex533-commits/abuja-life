"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AGENCY_INFO, type Agency } from "@/lib/justice/catalog";
import { formatNaira } from "@/lib/vip/catalog";

type Wanted = { name: string; avatar: string; charge: string; agency: Agency; filedAt: string; overdue: boolean };
type Judgment = { name: string; avatar: string; charge: string; agency: Agency; status: string; fine: number; jailHours: number; at: string };

export default function EfccPage() {
  const [data, setData] = useState<{ wanted: Wanted[]; judgments: Judgment[] } | null>(null);

  useEffect(() => {
    fetch("/api/court/efcc", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ wanted: [], judgments: [] }));
  }, []);

  return (
    <main className="min-h-screen bg-[#0f0707] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0f0707]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/game" className="text-xs font-black text-white/60">← BACK TO GAME</Link>
          <div className="text-sm font-black">🕵🏾 EFCC</div>
          <Link href="/court" className="text-xs font-black text-amber-300">Court →</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <section className="rounded-[2rem] border border-red-500/30 bg-gradient-to-br from-red-900/40 via-[#170909] to-transparent p-8">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-red-300">Economic and Financial Crimes Commission</div>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Abuja&apos;s Most Wanted</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Players under investigation for corruption, fraud and smuggling. Big money, big risk. The EFCC is watching.
          </p>
        </section>

        <h2 className="mt-10 text-2xl font-black">🚨 Under investigation</h2>
        {data && data.wanted.length === 0 && (
          <div className="mt-4 rounded-3xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">
            No open EFCC cases. Abuja is clean… for now.
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(data?.wanted ?? []).map((w, i) => (
            <article key={i} className="flex items-center gap-4 rounded-3xl border border-red-500/30 bg-red-500/[0.06] p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black/40 text-4xl grayscale">{w.avatar}</div>
              <div className="min-w-0">
                <div className="truncate text-lg font-black">{w.name}</div>
                <div className="text-xs text-white/60">{w.charge}</div>
                <div className={`mt-1 text-[10px] font-black uppercase ${AGENCY_INFO[w.agency].color}`}>
                  {AGENCY_INFO[w.agency].emoji} {AGENCY_INFO[w.agency].name} {w.overdue && "· ESCAPED COURT"}
                </div>
              </div>
            </article>
          ))}
        </div>

        <h2 className="mt-10 text-2xl font-black">⚖️ Recent judgments</h2>
        <div className="mt-4 space-y-2">
          {(data?.judgments ?? []).map((j, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/[0.03] px-4 py-3 text-sm">
              <span>{j.avatar} <b>{j.name}</b> · {j.charge}</span>
              <span className={j.status === "acquitted" ? "font-black text-emerald-300" : "font-black text-red-300"}>
                {j.status === "acquitted" ? "Acquitted" : `Convicted${j.fine ? ` · ${formatNaira(j.fine)}` : ""}${j.jailHours ? ` · ${j.jailHours}h` : ""}`}
              </span>
            </div>
          ))}
          {data && data.judgments.length === 0 && <p className="text-sm text-white/45">No judgments yet.</p>}
        </div>
      </div>
    </main>
  );
}
