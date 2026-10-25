"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import FashionDesignerPanel from "@/components/game/FashionDesignerPanel";
import {
  FASHION_CUSTOMERS,
  type FashionCustomer,
} from "@/lib/game/fashionDesigner";
import {
  DEFAULT_PLAYER_STATE,
  loadPersistentPlayerState,
  savePersistentPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function FashionDesignerPage() {
  const [player, setPlayer] =
    useState<PlayerGameState>(DEFAULT_PLAYER_STATE);

  const [customer, setCustomer] =
    useState<FashionCustomer>(FASHION_CUSTOMERS[0]);

  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("");

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

  async function handleComplete(
    result: Parameters<
      React.ComponentProps<typeof FashionDesignerPanel>["onComplete"]
    >[0]
  ) {
    const nextState: PlayerGameState = {
      ...player,
      cash: player.cash + result.totalPayment,
      energy: Math.max(0, player.energy - result.energyCost),
      reputation: player.reputation + result.reputationGain,
      jobExperience: player.jobExperience + result.satisfaction,
    };

    const saved = await savePersistentPlayerState(nextState);

    if (!saved) {
      setMessage("The design was completed, but the reward could not be saved.");
      return;
    }

    setPlayer(nextState);
    setCompleted(true);
    setMessage(
      `Earned ₦${result.totalPayment.toLocaleString()} and +${result.reputationGain} reputation.`
    );
  }

  function nextCustomer() {
    const currentIndex = FASHION_CUSTOMERS.findIndex(
      (item) => item.id === customer.id
    );

    const nextIndex =
      (currentIndex + 1) % FASHION_CUSTOMERS.length;

    setCustomer(FASHION_CUSTOMERS[nextIndex]);
    setCompleted(false);
    setMessage("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0710] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-7 text-center">
          <div className="text-5xl">👗</div>
          <p className="mt-3 text-sm font-bold text-white/50">
            Loading fashion studio...
          </p>
        </div>
      </main>
    );
  }

  const isFashionDesigner =
    player.currentJobId === "fashion-designer";

  if (!isFashionDesigner) {
    return (
      <main className="min-h-screen bg-[#0b0710] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/jobs"
            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black"
          >
            ← Back to Jobs
          </Link>

          <section className="mt-8 rounded-3xl border border-pink-400/20 bg-pink-400/5 p-10 text-center">
            <div className="text-7xl">👗</div>

            <h1 className="mt-5 text-3xl font-black">
              Become a Fashion Designer first
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/50">
              Apply for the Fashion Designer career from the Jobs page
              before entering the fashion studio.
            </p>

            <Link
              href="/jobs"
              className="mt-7 inline-flex rounded-2xl bg-pink-400 px-7 py-4 text-sm font-black text-black"
            >
              APPLY FOR FASHION DESIGNER →
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0710] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-300">
              Abuja Careers / Creative
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Fashion Studio
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Turn customer ideas into outfits and build your designer reputation.
            </p>
          </div>

          <Link
            href="/jobs"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black"
          >
            ← Back to Jobs
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Cash
            </div>
            <div className="mt-2 text-xl font-black text-emerald-300">
              ₦{player.cash.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Energy
            </div>
            <div className="mt-2 text-xl font-black">
              {player.energy}/{player.maxEnergy}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Reputation
            </div>
            <div className="mt-2 text-xl font-black text-orange-300">
              {player.reputation}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Job XP
            </div>
            <div className="mt-2 text-xl font-black text-pink-300">
              {player.jobExperience}
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm font-bold text-emerald-200">
            {message}
          </div>
        )}

        {completed ? (
          <section className="rounded-3xl border border-pink-400/20 bg-gradient-to-br from-pink-500/10 via-white/[0.03] to-purple-500/10 p-8 text-center">
            <div className="text-5xl">✨</div>

            <h2 className="mt-4 text-2xl font-black">
              Design completed
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Your customer has received the finished outfit.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={nextCustomer}
                className="rounded-2xl bg-pink-400 px-7 py-4 text-sm font-black text-black"
              >
                NEXT CUSTOMER →
              </button>

              <Link
                href="/jobs"
                className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-black"
              >
                BACK TO JOBS
              </Link>
            </div>
          </section>
        ) : (
          <FashionDesignerPanel
            customer={customer}
            onComplete={handleComplete}
          />
        )}
      </div>
    </main>
  );
}
