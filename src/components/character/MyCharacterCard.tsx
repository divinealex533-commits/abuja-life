"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CharacterAvatar from "@/components/character/CharacterAvatar";
import type { Appearance } from "@/lib/character/appearance";

type Legal = { jailed: boolean; jailedUntil: string | null; openCases: number; overdueCases: number };

/** Game hub card: your animated character + court status + quick links. */
export default function MyCharacterCard() {
  const [look, setLook] = useState<Appearance | null>(null);
  const [name, setName] = useState("");
  const [designed, setDesigned] = useState(true);
  const [legal, setLegal] = useState<Legal | null>(null);

  useEffect(() => {
    fetch("/api/character", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.loggedIn) return;
        setLook(d.appearance);
        setName(d.name);
        setDesigned(d.designed);
      })
      .catch(() => undefined);
    fetch("/api/court", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.status && setLegal(d.status))
      .catch(() => undefined);
  }, []);

  if (!look) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent">
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row">
        <div className="shrink-0 rounded-3xl bg-black/30 px-4 pt-2">
          <CharacterAvatar appearance={look} size={170} />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300/70">You in Abuja</div>
          <div className="mt-1 truncate text-2xl font-black">{name}</div>

          {legal?.jailed ? (
            <div className="mt-2 inline-block rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-200">🔒 In Kuje Prison</div>
          ) : legal && legal.openCases > 0 ? (
            <div className="mt-2 inline-block rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-200">
              ⚖️ {legal.openCases} open court case{legal.openCases > 1 ? "s" : ""}{legal.overdueCases ? " · warrant!" : ""}
            </div>
          ) : (
            <div className="mt-2 inline-block rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">✅ Clean record</div>
          )}

          {!designed && <p className="mt-2 text-sm text-white/55">You haven&apos;t designed your look yet.</p>}

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link href="/character" className="rounded-2xl bg-emerald-400 px-4 py-2 text-xs font-black text-black">
              {designed ? "CHANGE LOOK" : "DESIGN MY CHARACTER"}
            </Link>
            <Link href="/court" className="rounded-2xl border border-white/15 px-4 py-2 text-xs font-black">⚖️ Court</Link>
            <Link href="/efcc" className="rounded-2xl border border-red-400/30 px-4 py-2 text-xs font-black text-red-300">🕵🏾 EFCC</Link>
            <Link href="/map" className="rounded-2xl border border-sky-400/30 px-4 py-2 text-xs font-black text-sky-300">🗺️ Nigeria map</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
