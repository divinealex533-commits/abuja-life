"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JournalistPanel from "@/components/game/JournalistPanel";
import { getPersistentPlayerState, savePersistentPlayerState } from "@/lib/game/player";

export default function JournalistJobPage() {
  const router = useRouter();

  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const state = await getPersistentPlayerState();

        if (!active) return;

        if (!state) {
          router.replace("/jobs");
          return;
        }

        if (state.currentJobId !== "journalist") {
          router.replace("/jobs");
          return;
        }

        setPlayer(state);
      } catch {
        router.replace("/jobs");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [router]);

  async function completeJob(result: {
    payment: number;
    reputation: number;
    experience: number;
    energyUsed: number;
  }) {
    if (!player) return;

    const currentEnergy = Number(player.energy ?? 100);
    const nextEnergy = Math.max(0, currentEnergy - result.energyUsed);

    const nextState = {
      ...player,
      cash: Number(player.cash ?? 0) + result.payment,
      energy: nextEnergy,
      reputation: Number(player.reputation ?? 0) + result.reputation,
      jobExperience:
        Number(player.jobExperience ?? 0) + result.experience,
    };

    try {
      await savePersistentPlayerState(nextState);
      setPlayer(nextState);
      setMessage(
        `Story published! You earned ₦${result.payment.toLocaleString()} and gained +${result.reputation} reputation.`
      );
    } catch {
      setMessage("The story finished, but your player state could not be saved.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070707] px-6 py-12 text-white">
        Loading newsroom...
      </main>
    );
  }

  if (!player) return null;

  return (
    <main className="min-h-screen bg-[#070707] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <button
            onClick={() => router.push("/jobs")}
            className="mb-5 text-sm text-white/50 hover:text-white"
          >
            ← Back to Jobs
          </button>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-400/10 via-white/[0.03] to-transparent p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  📰 ABUJA LIFE NEWSROOM
                </div>

                <h1 className="mt-2 text-3xl font-black">
                  Journalist Career
                </h1>

                <p className="mt-2 text-sm text-white/55">
                  Investigate stories, interview people, verify facts and
                  become one of Abuja&apos;s most trusted reporters.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Hud label="Cash" value={`₦${Number(player.cash ?? 0).toLocaleString()}`} />
                <Hud label="Energy" value={`${Number(player.energy ?? 0)}`} />
                <Hud
                  label="Rep"
                  value={`${Number(player.reputation ?? 0)}`}
                />
              </div>
            </div>
          </div>
        </header>

        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {Number(player.energy ?? 0) <= 0 ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center">
            <div className="text-4xl">😴</div>
            <h2 className="mt-3 text-xl font-black">
              You are too exhausted to report.
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Recover some energy before taking another assignment.
            </p>

            <button
              onClick={() => router.push("/jobs")}
              className="mt-6 rounded-xl bg-white px-5 py-3 font-bold text-black"
            >
              Return to Jobs
            </button>
          </div>
        ) : (
          <JournalistPanel
            onComplete={completeJob}
            onBack={() => router.push("/jobs")}
          />
        )}
      </div>
    </main>
  );
}

function Hud({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[80px] rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase text-white/35">{label}</div>
      <div className="mt-1 text-xs font-black text-white">{value}</div>
    </div>
  );
}
