"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import FoodVendorPanel from "@/components/game/FoodVendorPanel";
import {
  DEFAULT_PLAYER_STATE,
  loadPersistentPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function FoodVendorPage() {
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
          <div className="text-4xl">🍲</div>

          <p className="mt-3 text-sm font-bold text-white/60">
            Loading your food stall...
          </p>
        </div>
      </main>
    );
  }

  const isFoodVendor =
    player.currentJobId === "food-vendor";

  return (
    <main className="min-h-screen bg-[#07110f] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">
              Abuja Careers / Food
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Food Vendor
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Run your shift, prepare customer orders and build
              your food reputation.
            </p>
          </div>

          <Link
            href="/jobs"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black transition hover:border-orange-400/30 hover:bg-orange-400/10"
          >
            ← Back to Jobs
          </Link>
        </div>

        {!isFoodVendor ? (
          <section className="rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-[#0b1815] to-emerald-500/10 p-7 text-center shadow-2xl sm:p-10">
            <div className="text-6xl">🍲</div>

            <h2 className="mt-5 text-3xl font-black">
              Become a Food Vendor first
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/50">
              Apply for the Food Vendor career from the Jobs page
              before starting a customer shift.
            </p>

            <Link
              href="/jobs"
              className="mt-6 inline-flex rounded-2xl bg-orange-400 px-7 py-4 text-sm font-black text-black transition hover:bg-orange-300"
            >
              APPLY FOR FOOD VENDOR →
            </Link>
          </section>
        ) : (
          <FoodVendorPanel />
        )}
      </div>
    </main>
  );
}
