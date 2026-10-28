"use client";

import React, { useEffect, useState } from "react";
import LawyerPanel from "@/components/game/LawyerPanel";
import {
  DEFAULT_PLAYER_STATE,
  PlayerGameState,
  loadPersistentPlayerState,
} from "@/lib/game/player";

export default function LawyerPage() {
  const [player, setPlayer] =
    useState<PlayerGameState | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPlayer() {
      const savedPlayer =
        await loadPersistentPlayerState();

      if (mounted) {
        setPlayer(
          savedPlayer ?? DEFAULT_PLAYER_STATE
        );

        setLoading(false);
      }
    }

    loadPlayer();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !player) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07080c] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-indigo-400" />

          <p className="mt-4 text-sm font-bold text-white/40">
            Preparing your legal chambers...
          </p>
        </div>
      </main>
    );
  }

  return (
    <LawyerPanel
      player={player}
      setPlayer={setPlayer}
    />
  );
}
