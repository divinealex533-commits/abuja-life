"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import DeliveryRiderPanel from "@/components/game/DeliveryRiderPanel";
import {
  DELIVERY_MISSIONS,
  type DeliveryMission,
} from "@/lib/game/deliveryRider";
import {
  DEFAULT_PLAYER_STATE,
  loadPersistentPlayerState,
  savePersistentPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function DeliveryRiderPage() {
  const [player, setPlayer] = useState<PlayerGameState>(
    DEFAULT_PLAYER_STATE
  );

  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] =
    useState<DeliveryMission | null>(null);

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

  const isDeliveryRider =
    player.currentJobId === "delivery-rider";

  const availableMissions = useMemo(() => {
    return DELIVERY_MISSIONS;
  }, []);

  async function handleDeliveryComplete(result: {
    pay: number;
    tip: number;
    reputation: number;
    satisfaction: number;
    energyCost: number;
    message: string;
  }) {
    if (saving) return;

    const earnings = result.pay + result.tip;
    const energyCost = Math.ceil(result.energyCost);

    if (player.energy < energyCost) {
      setMessage(
        `You need ${energyCost} energy for this delivery.`
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
          player.energy - energyCost
        ),
        reputation:
          player.reputation + result.reputation,
        jobExperience: player.jobExperience + 1,
      };

      const saved =
        await savePersistentPlayerState(updatedPlayer);

      setPlayer(saved);

      setMessage(
        `${result.message} You earned ₦${earnings.toLocaleString()}.`
      );

      setSelectedMission(null);
    } catch (error) {
      console.error(
        "Delivery Rider reward save error:",
        error
      );

      setMessage(
        "The delivery finished, but your reward could not be saved. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06100e] px-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-7 text-center shadow-2xl">
          <div className="text-5xl">🛵</div>

          <p className="mt-4 text-sm font-bold text-white/60">
            Loading your delivery career...
          </p>
        </div>
      </main>
    );
  }

  if (!isDeliveryRider) {
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

          <section className="rounded-[2rem] border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-[#0b1714] to-cyan-500/10 p-8 text-center shadow-2xl sm:p-12">
            <div className="text-7xl">🛵</div>

            <div className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">
              Abuja Transport Career
            </div>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Delivery Rider
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50">
              Pick up packages around Abuja, choose your route,
              deliver on time and earn money from delivery fees
              and customer tips.
            </p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl">📦</div>

                <div className="mt-2 text-xs font-black">
                  Packages
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl">🛣️</div>

                <div className="mt-2 text-xs font-black">
                  Routes
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl">💰</div>

                <div className="mt-2 text-xs font-black">
                  Earn
                </div>
              </div>
            </div>

            <Link
              href="/jobs"
              className="mt-8 inline-flex rounded-2xl bg-orange-400 px-8 py-4 text-sm font-black text-black transition hover:bg-orange-300 active:scale-[0.98]"
            >
              APPLY FOR DELIVERY RIDER →
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
            ← BACK TO DELIVERY SHIFT
          </button>

          <DeliveryRiderPanel
            mission={selectedMission}
            onComplete={handleDeliveryComplete}
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
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">
              Abuja Careers / Transport
            </div>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              Delivery Rider
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Start your shift, collect packages and deliver
              them safely across Abuja.
            </p>
          </div>

          <Link
            href="/jobs"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black transition hover:border-orange-400/30 hover:bg-orange-400/10"
          >
            ← JOBS
          </Link>
        </div>

        {/* RIDER HUD */}
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

            <div className="mt-2 text-2xl font-black">
              {Math.round(player.energy)}
              <span className="text-sm text-white/30">
                {" "}
                / {Math.round(player.maxEnergy)}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-orange-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (player.energy /
                        player.maxEnergy) *
                        100
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

            <div className="mt-2 text-2xl font-black">
              ⭐ {player.reputation}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Job XP
            </div>

            <div className="mt-2 text-2xl font-black">
              {player.jobExperience}
            </div>
          </div>
        </section>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-2xl border border-orange-400/20 bg-orange-400/10 px-5 py-4 text-sm font-bold text-orange-200">
            {message}
          </div>
        )}

        {/* SHIFT */}
        <section className="mb-7 rounded-[2rem] border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-white/[0.03] to-cyan-500/10 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-3xl">🛵</div>

              <h2 className="mt-3 text-3xl font-black">
                Start Your Shift
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Packages are waiting around Abuja. Choose a
                delivery, plan your route and get it to the
                customer safely.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 lg:min-w-[220px]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Current Job
              </div>

              <div className="mt-2 font-black text-orange-300">
                Delivery Rider
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
              Available Deliveries
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Choose your next package.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/40">
            {availableMissions.length} Deliveries
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableMissions.map((mission) => {
            const estimatedEnergy = Math.max(
              8,
              Math.round(
                7 +
                  mission.distanceKm * 0.45 +
                  (mission.traffic === "heavy"
                    ? 4
                    : 0)
              )
            );

            const canDeliver =
              player.energy >= estimatedEnergy;

            return (
              <article
                key={mission.id}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-orange-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/10 text-2xl">
                    {mission.emoji}
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                      mission.difficulty === "easy"
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        : mission.difficulty ===
                            "medium"
                          ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                          : "border-red-400/20 bg-red-400/10 text-red-300"
                    }`}
                  >
                    {mission.difficulty}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black">
                  {mission.packageName}
                </h3>

                <p className="mt-1 text-sm text-white/40">
                  Customer:{" "}
                  <span className="font-bold text-white/70">
                    {mission.customer}
                  </span>
                </p>

                <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
                  <div className="text-xs font-black">
                    {mission.pickup}
                  </div>

                  <div className="my-2 text-xs text-orange-300">
                    ↓
                  </div>

                  <div className="text-xs font-black">
                    {mission.destination}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-black/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Base Pay
                    </div>

                    <div className="mt-1 font-black text-emerald-300">
                      ₦{mission.basePay.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Distance
                    </div>

                    <div className="mt-1 font-black">
                      {mission.distanceKm} km
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Traffic
                    </div>

                    <div className="mt-1 font-black">
                      {mission.traffic}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Time
                    </div>

                    <div className="mt-1 font-black">
                      ~{mission.estimatedMinutes} min
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-white/25">
                      Urgency
                    </div>

                    <div
                      className={`mt-1 text-xs font-black ${
                        mission.urgency === "urgent"
                          ? "text-red-300"
                          : "text-white/60"
                      }`}
                    >
                      {mission.urgency}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wider text-white/25">
                      Est. Energy
                    </div>

                    <div className="mt-1 text-xs font-black text-orange-300">
                      -{estimatedEnergy}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canDeliver || saving}
                  onClick={() => {
                    setMessage("");
                    setSelectedMission(mission);
                  }}
                  className="mt-5 w-full rounded-2xl bg-orange-400 px-4 py-4 text-xs font-black text-black transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                >
                  {!canDeliver
                    ? "NOT ENOUGH ENERGY"
                    : saving
                      ? "SAVING..."
                      : "ACCEPT DELIVERY 🛵"}
                </button>
              </article>
            );
          })}
        </div>

        {/* CAREER INFO */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">
            Delivery Rider Career
          </div>

          <h2 className="mt-2 text-2xl font-black">
            Become Abuja's most reliable rider
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
            Fast and careful deliveries keep customers happy.
            High satisfaction can increase your tips, reputation
            and career experience.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">📦</div>

              <div className="mt-2 text-sm font-black">
                Collect
              </div>

              <div className="mt-1 text-xs text-white/35">
                Pick up the correct package.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">🛣️</div>

              <div className="mt-2 text-sm font-black">
                Deliver
              </div>

              <div className="mt-1 text-xs text-white/35">
                Choose the right route and reach the customer.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">⭐</div>

              <div className="mt-2 text-sm font-black">
                Build Reputation
              </div>

              <div className="mt-1 text-xs text-white/35">
                Great service earns better rewards.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
