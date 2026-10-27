"use client";

import React, { useEffect, useState } from "react";
import PilotPanel from "@/components/game/PilotPanel";
import {
  DEFAULT_PLAYER_STATE,
  PlayerGameState,
  loadPersistentPlayerState,
} from "@/lib/game/player";

export default function PilotPage() {
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
      <main className="flex min-h-screen items-center justify-center bg-[#050608] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-sky-400" />

          <p className="mt-4 text-sm font-bold text-white/40">
            Preparing aircraft for departure...
          </p>
        </div>
      </main>
    );
  }

  return (
    <PilotPanel
      player={player}
      setPlayer={setPlayer}
    />
  );
}
