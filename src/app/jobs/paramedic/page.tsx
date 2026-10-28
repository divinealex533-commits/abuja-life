"use client";

import { useEffect, useState } from "react";
import ParamedicPanel from "@/components/game/ParamedicPanel";
import {
  DEFAULT_PLAYER_STATE,
  PlayerGameState,
  loadPersistentPlayerState,
} from "@/lib/game/player";

export default function ParamedicJobPage() {
  const [player, setPlayer] =
    useState<PlayerGameState>(DEFAULT_PLAYER_STATE);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPlayer() {
      const savedPlayer =
        await loadPersistentPlayerState();

      if (mounted) {
        setPlayer(savedPlayer);
        setLoading(false);
      }
    }

    loadPlayer();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-red-500" />

            <p className="text-sm font-semibold text-white/60">
              Loading Paramedic Emergency Services...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <ParamedicPanel
          player={player}
          setPlayer={setPlayer}
        />
      </div>
    </main>
  );
}
