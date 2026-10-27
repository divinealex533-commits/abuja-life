"use client";

import React, { useEffect, useState } from "react";
import MovieDirectorPanel from "@/components/game/MovieDirectorPanel";
import {
  DEFAULT_PLAYER_STATE,
  PlayerGameState,
  loadPersistentPlayerState,
} from "@/lib/game/player";

export default function MovieDirectorPage() {
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
      <main className="flex min-h-screen items-center justify-center bg-[#070709] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-purple-500" />

          <p className="mt-4 text-sm font-bold text-white/40">
            Loading Movie Studio...
          </p>
        </div>
      </main>
    );
  }

  return (
    <MovieDirectorPanel
      player={player}
      setPlayer={setPlayer}
    />
  );
}
