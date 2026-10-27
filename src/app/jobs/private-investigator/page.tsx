"use client";

import React, { useState } from "react";
import Link from "next/link";

import PrivateInvestigatorPanel from "@/components/game/PrivateInvestigatorPanel";

import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";

import {
  loadPlayerState,
} from "@/lib/game/playerStorage";

export default function PrivateInvestigatorJobPage() {
  const [player, setPlayer] =
    useState<PlayerGameState>(() =>
      loadPlayerState()
    );

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07110f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-xl font-black">
              ABUJA{" "}
              <span className="text-emerald-400">
                LIFE
              </span>
            </div>

            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Private Investigator
            </div>
          </div>

          <Link
            href="/jobs"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold transition hover:border-amber-400/30 hover:bg-amber-400/10"
          >
            ← Jobs
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-white/[0.02] to-cyan-400/10 p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">
                🕵️ Career
              </div>

              <h1 className="mt-2 text-4xl font-black md:text-5xl">
                Private Investigator
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 md:text-base">
                Follow clues, interrogate suspects, expose
                lies and solve mysteries across Abuja.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-center">
              <div className="text-5xl">🔎</div>

              <div className="mt-2 text-xs font-black uppercase tracking-widest text-white/40">
                Investigation Bureau
              </div>
            </div>
          </div>
        </div>

        <PrivateInvestigatorPanel
          player={player}
          setPlayer={setPlayer}
        />
      </section>
    </main>
  );
}
