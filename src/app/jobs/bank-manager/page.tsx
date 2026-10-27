"use client";

import { useEffect, useState } from "react";
import BankManagerPanel from "@/components/game/BankManagerPanel";
import {
  loadPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function BankManagerPage() {
  const [player, setPlayer] =
    useState<PlayerGameState | null>(null);

  useEffect(() => {
    setPlayer(loadPlayerState());
  }, []);

  if (!player) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07080d] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500" />

          <p className="text-sm font-semibold text-white/60">
            Opening Bank Manager...
          </p>
        </div>
      </main>
    );
  }

  return (
    <BankManagerPanel
      player={player}
      setPlayer={setPlayer}
    />
  );
}
