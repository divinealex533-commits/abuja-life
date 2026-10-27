"use client";

import { useEffect, useState } from "react";
import GameStreamerPanel from "@/components/game/GameStreamerPanel";
import {
  loadPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function GameStreamerPage() {
  const [player, setPlayer] =
    useState<PlayerGameState | null>(null);

  useEffect(() => {
    setPlayer(loadPlayerState());
  }, []);

  if (!player) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080d] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-purple-500" />

          <p className="text-sm font-semibold text-white/60">
            Loading Streamer Studio...
          </p>
        </div>
      </main>
    );
  }

  return (
    <GameStreamerPanel
      player={player}
      setPlayer={setPlayer}
    />
  );
}
