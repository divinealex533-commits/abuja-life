"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import TaxiMissionPanel from "@/components/game/TaxiMissionPanel";
import {
  TAXI_MISSIONS,
  type TaxiMission,
} from "@/lib/game/taxi";
import {
  DEFAULT_PLAYER_STATE,
  loadPersistentPlayerState,
  savePersistentPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function TaxiDriverPage() {
  const [player, setPlayer] = useState<PlayerGameState>(
    DEFAULT_PLAYER_STATE
  );

  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] =
    useState<TaxiMission | null>(null);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

  const isTaxiDriver = player.currentJobId === "taxi-driver";

  const availableMissions = useMemo(() => {
    return TAXI_MISSIONS;
  }, []);

  async function handleTripComplete(
    result: {
      fare: number;
      tip: number;
      reputation: number;
      satisfaction: number;
      energyCost: number;
      message: string;
    }
  ) {
    if (saving) return;

    const earnings = result.fare + result.tip;

    if (player.energy < result.energyCost) {
      setMessage(
        `You need ${Math.ceil(result.energyCost)} energy for this trip.`
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updatedPlayer: PlayerGameState = {
        ...player,
        cash: player.cash + earnings,
        energy: Math.max(
          0,
          player.energy - Math.ceil(result.energyCost)
        ),
        reputation: player.reputation + result.reputation,
        jobExperience: player.jobExperience + 1,
      };

      const saved = await savePersistentPlayerState(
        updatedPlayer
      );

      setPlayer(saved);

      setMessage(
        `${result.message} You earned ₦${earnings.toLocaleString()}.`
      );

      setSelectedMission(null);
    } catch (error) {
      console.error("Taxi reward save error:", error);

      setMessage(
        "The trip finished, but your reward could not be saved. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06100e] px-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-7 text-center shadow-2xl">
          <div className="text-5xl">🚕</div>

          <p className="mt-4 text-sm font-bold text-white/60">
            Loading your taxi career...
          </p>
        </div>
      </main>
    );
  }

  if (!isTaxiDriver) {
    return (
      <main className="min-h-screen bg-[#06100e] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Link
              href="/jobs"
              className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black transition hover:bg-white/10"
            >
              ← BACK TO JOBS
            </Link>
          </div>

          <section className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-[#0b1714] to-cyan-500/10 p-8 text-center shadow-2xl sm:p-12">
            <div className="text-7xl">🚕</div>

            <div className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
              Abuja Transport Career
            </div>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Taxi Driver
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50">
              Pick up passengers around Abuja, choose your routes,
              handle traffic and earn money through fares and tips.
            </p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl">🙋🏽</div>
                <div className="mt-2 text-xs font-black text-white">
                  Passengers
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl">🗺️</div>
                <div className="mt-2 text-xs font-black text-white">
                  Abuja Routes
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl">💰</div>
                <div className="mt-2 text-xs font-black text-white">
                  Earn Fares
                </div>
              </div>
            </div>

            <Link
              href="/jobs"
              className="mt-8 inline-flex rounded-2xl bg-emerald-400 px-8 py-4 text-sm font-black text-black transition hover:bg-emerald-300 active:scale-[0.98]"
            >
              APPLY FOR TAXI DRIVER →
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (selectedMission) {
    return (
      <main className="min-h-screen bg-[#06100e] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => {
              setSelectedMission(null);
              setMessage("");
            }}
            className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black transition hover:bg-white/10"
          >
            ← BACK TO TAXI SHIFT
          </button>

          <TaxiMissionPanel
            mission={selectedMission}
            onComplete={handleTripComplete}
            onCancel={() => {
              setSelectedMission(null);
              setMessage("");
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06100e] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
              Abuja Careers / Transport
            </div>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              Taxi Driver
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Start your shift, pick passengers and complete trips
              across Abuja.
            </p>
          </div>

          <Link
            href="/jobs"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black transition hover:border-emerald-400/30 hover:bg-emerald-400/10"
          >
            ← JOBS
          </Link>
        </div>

        {/* DRIVER HUD */}
        <section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Cash
            </div>

            <div className="mt-2 text-2xl font-black text-emerald-300">
              ₦{player.cash.toLocaleString()}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Energy
            </div>

            <div className="mt-2 text-2xl font-black text-white">
              {Math.round(player.energy)}
              <span className="text-sm text-white/30">
                {" "}
                / {Math.round(player.maxEnergy)}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (player.energy / player.maxEnergy) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Reputation
            </div>

            <div className="mt-2 text-2xl font-black text-white">
              ⭐ {player.reputation}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Job XP
            </div>

            <div className="mt-2 text-2xl font-black text-white">
              {player.jobExperience}
            </div>
          </div>
        </section>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm font-bold text-emerald-200">
            {message}
          </div>
        )}

        {/* SHIFT */}
        <section className="mb-7 rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-cyan-500/10 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-3xl">🚕</div>

              <h2 className="mt-3 text-3xl font-black">
                Start Your Shift
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Passengers are waiting across Abuja. Choose a trip
                and put your driving skills to work.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 lg:min-w-[220px]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Current Job
              </div>

              <div className="mt-2 font-black text-emerald-300">
                Taxi Driver
              </div>

              <div className="mt-1 text-xs text-white/35">
                Active career
              </div>
            </div>
          </div>
        </section>

        {/* MISSIONS */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">
              Available Passengers
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Choose your next passenger and trip.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/40">
            {availableMissions.length} Trips
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableMissions.map((mission) => {
            const canDrive =
              player.energy >=
              Math.ceil(10 + mission.distanceKm + 2);

            return (
              <article
                key={mission.id}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl">
                    🙋🏽
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                      mission.difficulty === "easy"
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        : mission.difficulty === "medium"
                          ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                          : "border-red-400/20 bg-red-400/10 text-red-300"
                    }`}
                  >
                    {mission.difficulty}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black">
                  {mission.pickup} → {mission.destination}
                </h3>

                <p className="mt-1 text-sm text-white/40">
                  Passenger:{" "}
                  <span className="font-bold text-white/70">
                    {mission.passenger}
                  </span>
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-black/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Fare
                    </div>

                    <div className="mt-1 font-black text-emerald-300">
                      ₦{mission.baseFare.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Distance
                    </div>

                    <div className="mt-1 font-black text-white">
                      {mission.distanceKm} km
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Traffic
                    </div>

                    <div className="mt-1 font-black text-white">
                      {mission.traffic}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Time
                    </div>

                    <div className="mt-1 font-black text-white">
                      ~{mission.estimatedMinutes} min
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="text-[9px] font-black uppercase tracking-wider text-white/25">
                    Passenger mood
                  </div>

                  <div className="mt-1 text-xs font-bold text-white/60">
                    {mission.passengerMood}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canDrive || saving}
                  onClick={() => {
                    setMessage("");
                    setSelectedMission(mission);
                  }}
                  className="mt-5 w-full rounded-2xl bg-emerald-400 px-4 py-4 text-xs font-black text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                >
                  {!canDrive
                    ? "NOT ENOUGH ENERGY"
                    : saving
                      ? "SAVING..."
                      : "ACCEPT PASSENGER 🚕"}
                </button>
              </article>
            );
          })}
        </div>

        {/* CAREER INFO */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
            Taxi Career
          </div>

          <h2 className="mt-2 text-2xl font-black">
            Build your reputation across Abuja
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
            Better driving performance increases passenger
            satisfaction. Happy passengers can leave larger tips,
            while successful trips build your reputation and job
            experience.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">🎮</div>
              <div className="mt-2 text-sm font-black">
                Drive
              </div>
              <div className="mt-1 text-xs text-white/35">
                Complete the driving challenge.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">⭐</div>
              <div className="mt-2 text-sm font-black">
                Satisfy
              </div>
              <div className="mt-1 text-xs text-white/35">
                Keep your passengers happy.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">💰</div>
              <div className="mt-2 text-sm font-black">
                Earn
              </div>
              <div className="mt-1 text-xs text-white/35">
                Collect fares and tips.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
