"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getTheme } from "@/lib/party/catalog";

interface PartyItem {
  id: string;
  title: string;
  theme: string;
  locationName: string;
  guestsNow: number;
}

/** "Parties now" row on the game screen. */
export default function PartyStrip() {
  const [parties, setParties] = useState<PartyItem[] | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/parties", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setParties(d?.parties ?? []))
        .catch(() => setParties([]));
    void load();
    const t = window.setInterval(load, 60_000);
    return () => window.clearInterval(t);
  }, []);

  if (parties === null) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="rounded-3xl border border-fuchsia-400/25 bg-gradient-to-r from-fuchsia-900/50 via-[#170b24] to-[#0b1220] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.2em]">🎉 Parties now</h2>
          <Link href="/parties" className="text-xs font-bold text-fuchsia-200">
            {parties.length ? "See all →" : "Throw one →"}
          </Link>
        </div>
        {parties.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">No parties yet. Throw one, dance and get sprayed!</p>
        ) : (
          <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-1">
            {parties.map((p) => {
              const theme = getTheme(p.theme);
              return (
                <Link
                  key={p.id}
                  href={`/party/${p.id}`}
                  className="w-48 shrink-0 rounded-2xl border border-white/10 p-3"
                  style={{ background: `linear-gradient(135deg, ${theme.colors[0]}40, transparent)` }}
                >
                  <div className="text-2xl">{theme.icon}</div>
                  <div className="truncate text-sm font-black">{p.title}</div>
                  <div className="truncate text-[11px] text-white/60">
                    📍 {p.locationName} · 👥 {p.guestsNow}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
