"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import RestaurantChefPanel from "@/components/game/RestaurantChefPanel";
import {
  DEFAULT_PLAYER_STATE,
  loadPersistentPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function RestaurantChefJobPage() {
  const [player, setPlayer] = useState<PlayerGameState>(DEFAULT_PLAYER_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    void loadPersistentPlayerState().then((state) => {
      if (!mounted) return;
      setPlayer(state);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-5xl">👨‍🍳</div>
          <p className="mt-3 text-sm font-semibold text-white/60">Opening the kitchen...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/jobs"
          className="mb-6 inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black"
        >
          ← Back to Jobs
        </Link>

        <RestaurantChefPanel player={player} setPlayer={setPlayer} />
      </div>
    </main>
  );
}
