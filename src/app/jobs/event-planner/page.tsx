"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EventPlannerPanel from "@/components/game/EventPlannerPanel";
import {
  getPersistentPlayerState,
  savePersistentPlayerState,
} from "@/lib/game/player";

export default function EventPlannerJobPage() {
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

        if (state.currentJobId !== "event-planner") {
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
      reputation:
        Number(player.reputation ?? 0) + result.reputation,
      jobExperience:
        Number(player.jobExperience ?? 0) + result.experience,
    };

    try {
      await savePersistentPlayerState(nextState);

      setPlayer(nextState);

      setMessage(
        `🎪 Event completed! You earned ₦${result.payment.toLocaleString()} and gained +${result.reputation} reputation and +${result.experience} XP.`
      );
    } catch {
      setMessage(
        "The event finished, but your player state could not be saved."
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070707] px-6 py-12 text-white">
        Loading Event Command Center...
      </main>
    );
  }

  if (!player) return null;

  return (
    <main className="min-h-screen overflow-hidden bg-[#070707] px-4 py-8 text-white md:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[10%] top-[15%] h-72 w-72 animate-pulse rounded-full bg-purple-600/5 blur-[100px]" />
        <div className="absolute right-[5%] top-[45%] h-96 w-96 animate-pulse rounded-full bg-pink-600/5 blur-[120px] [animation-delay:1.5s]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-7">
          <button
            onClick={() => router.push("/jobs")}
            className="mb-5 text-sm text-white/45 transition hover:text-white"
          >
            ← Back to Jobs
          </button>

          <div className="overflow-hidden rounded-[2rem] border border-purple-400/15 bg-gradient-to-br from-purple-500/15 via-white/[0.03] to-pink-500/10 p-6 shadow-2xl md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-purple-300">
                  <span className="animate-bounce">🎪</span>
                  ABUJA LIFE EVENTS
                </div>

                <h1 className="mt-3 text-3xl font-black md:text-5xl">
                  Event Planner
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                  Build experiences people remember. Manage venues, guests,
                  budgets and live event chaos — then get paid for pulling it
                  all together.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Hud
                  label="Cash"
                  value={`₦${Number(player.cash ?? 0).toLocaleString()}`}
                />
                <Hud
                  label="Energy"
                  value={`${Number(player.energy ?? 0)}`}
                />
                <Hud
                  label="Rep"
                  value={`${Number(player.reputation ?? 0)}`}
                />
              </div>
            </div>
          </div>
        </header>

        {message && (
          <div className="mb-6 animate-[slideDown_0.45s_ease-out] rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-300">
            {message}
          </div>
        )}

        {Number(player.energy ?? 0) <= 0 ? (
          <div className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-10 text-center">
            <div className="text-6xl animate-bounce">😴</div>

            <h2 className="mt-5 text-2xl font-black">
              Your event crew needs a break.
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
              You don't have enough energy to manage another event right now.
            </p>

            <button
              onClick={() => router.push("/jobs")}
              className="mt-6 rounded-xl bg-white px-6 py-3 font-black text-black transition hover:-translate-y-0.5"
            >
              Return to Jobs
            </button>
          </div>
        ) : (
          <EventPlannerPanel
            onComplete={completeJob}
            onBack={() => router.push("/jobs")}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes confetti {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }

          100% {
            opacity: 0;
            transform: translateY(500px) rotate(720deg);
          }
        }
      `}</style>
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
    <div className="min-w-[78px] rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-white/35">
        {label}
      </div>

      <div className="mt-1 text-xs font-black text-white">
        {value}
      </div>
    </div>
  );
}
