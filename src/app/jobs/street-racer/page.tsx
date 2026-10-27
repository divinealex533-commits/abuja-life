"use client";

import { useEffect, useState } from "react";
import StreetRacerPanel from "@/components/game/StreetRacerPanel";
import type { PlayerGameState } from "@/lib/game/player";
import { loadPlayerState } from "@/lib/game/playerStorage";

export default function StreetRacerPage() {
  const [player, setPlayer] = useState<PlayerGameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedPlayer = loadPlayerState();

    if (loadedPlayer) {
      setPlayer(loadedPlayer);
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] text-white">
        <div className="text-center">
          <div className="text-5xl animate-bounce">🏎️</div>
          <p className="mt-4 text-sm font-bold text-gray-400">
            Starting engine...
          </p>
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] px-6 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center">
          <div className="text-5xl">🏎️</div>

          <h1 className="mt-4 text-2xl font-black">
            Racer Profile Not Found
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Create your Abuja Life character first before entering the street
            racing scene.
          </p>
        </div>
      </main>
    );
  }

  return (
    <StreetRacerPanel
      player={player}
      setPlayer={setPlayer}
    />
  );
}
