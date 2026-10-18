"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ShopkeeperPanel from "@/components/game/ShopkeeperPanel";
import {
  DEFAULT_PLAYER_STATE,
  loadPersistentPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function ShopkeeperPage() {
  const [player, setPlayer] = useState<PlayerGameState>(
    DEFAULT_PLAYER_STATE
  );

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
      <main className="flex min-h-screen items-center justify-center bg-[#07110f] px-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-7 text-center">
          <div className="text-4xl">🏪</div>

          <p className="mt-3 text-sm font-bold text-white/60">
            Opening your shop...
          </p>
        </div>
      </main>
    );
  }

  const isShopkeeper =
    player.currentJobId === "shopkeeper";

  return (
    <main className="min-h-screen bg-[#07110f] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">
              Abuja Careers / Business
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Shopkeeper
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Serve customers, set smart prices and build your
              reputation as one of Abuja&apos;s best shopkeepers.
            </p>
          </div>

          <Link
            href="/jobs"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black transition hover:border-orange-400/30 hover:bg-orange-400/10"
          >
            ← Back to Jobs
          </Link>
        </div>

        {!isShopkeeper ? (
          <section className="rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-[#0b1815] to-emerald-500/10 p-7 text-center shadow-2xl sm:p-10">
            <div className="text-6xl">🏪</div>

            <h2 className="mt-5 text-3xl font-black">
              Become a Shopkeeper first
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/50">
              Apply for the Shopkeeper career from the Jobs page
              before opening your shop.
            </p>

            <Link
              href="/jobs"
              className="mt-6 inline-flex rounded-2xl bg-orange-400 px-7 py-4 text-sm font-black text-black transition hover:bg-orange-300"
            >
              APPLY FOR SHOPKEEPER →
            </Link>
          </section>
        ) : (
          <ShopkeeperPanel />
        )}
      </div>
    </main>
  );
}
