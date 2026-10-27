"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ParamedicPanel from "@/components/game/ParamedicPanel";
import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";
import { loadPlayerState } from "@/lib/game/playerStorage";

export default function ParamedicJobPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerGameState | null>(null);

  useEffect(() => {
    const currentPlayer = loadPlayerState();

    if (!currentPlayer) {
      router.push("/login");
      return;
    }

    setPlayer(currentPlayer);
  }, [router]);

  useEffect(() => {
    if (!player) return;

    savePersistentPlayerState(player);
  }, [player]);

  if (!player) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 text-5xl animate-pulse">🚑</div>
          <p className="font-bold text-white">
            Loading emergency services...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/jobs")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            ← Back to Jobs
          </button>

          <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
            🚑 Paramedic
          </div>
        </div>

        <ParamedicPanel
          player={player}
          setPlayer={setPlayer}
        />
      </div>
    </main>
  );
}
