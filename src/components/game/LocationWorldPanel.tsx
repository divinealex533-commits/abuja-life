"use client";

import React, { useMemo, useState } from "react";
import {
  getLocationWorld,
  getOpenBusinesses,
} from "@/lib/game/locationWorld";
import type { LocationWorldActivity } from "@/lib/game/locationWorld";
import {
  loadPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";
import {
  performLocationActivity,
} from "@/lib/game/locationActivity";

interface LocationWorldPanelProps {
  locationId: string;
  currentHour?: number;
  onActivitySelect?: (activity: LocationWorldActivity) => void;
  onBusinessSelect?: (businessId: string) => void;
}

export default function LocationWorldPanel({
  locationId,
  currentHour = new Date().getHours(),
  onActivitySelect,
  onBusinessSelect,
}: LocationWorldPanelProps) {
  const world = getLocationWorld(locationId);

  const [activeTab, setActiveTab] = useState<
    "activities" | "businesses" | "features"
  >("activities");

  const [player, setPlayer] = useState<PlayerGameState>(() =>
    loadPlayerState()
  );

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">(
    ""
  );
  const [busyActivityId, setBusyActivityId] = useState<string | null>(null);

  const openBusinesses = useMemo(() => {
    if (!world) return [];
    return getOpenBusinesses(world.id, currentHour);
  }, [world, currentHour]);

  if (!world) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
        <p className="font-semibold text-red-300">
          Location unavailable
        </p>
        <p className="mt-1 text-sm text-red-200/70">
          We could not load this Abuja location.
        </p>
      </div>
    );
  }

  const handleActivity = (activity: LocationWorldActivity) => {
    if (busyActivityId) return;

    setBusyActivityId(activity.id);
    setMessage("");

    try {
      const currentPlayer = loadPlayerState();

      const result = performLocationActivity(
        currentPlayer,
        activity
      );

      setPlayer(result.player);
      setMessage(result.message);
      setMessageType(result.success ? "success" : "error");

      if (result.success) {
        onActivitySelect?.(activity);
      }
    } catch (error) {
      console.error("Location activity error:", error);

      setMessage("Something went wrong while completing this activity.");
      setMessageType("error");
    } finally {
      setBusyActivityId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-xl">
      {/* Location Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-red-950/60 via-orange-950/40 to-slate-950 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{world.icon}</span>

              <div>
                <h2 className="text-xl font-bold text-white">
                  {world.name}
                </h2>

                <p className="text-sm text-white/50">
                  {world.neighborhood}
                </p>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              {world.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-white/40">Traffic</div>
              <div className="mt-1 font-semibold capitalize text-white">
                {world.trafficLevel.replace("-", " ")}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-white/40">Safety</div>
              <div className="mt-1 font-semibold capitalize text-white">
                {world.safetyLevel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Status */}
      <div className="grid grid-cols-3 gap-2 border-b border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs text-white/40">Cash</div>
          <div className="mt-1 font-bold text-white">
            ₦{player.cash.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs text-white/40">Energy</div>
          <div className="mt-1 font-bold text-white">
            {player.energy}/{player.maxEnergy}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs text-white/40">Reputation</div>
          <div className="mt-1 font-bold text-white">
            {player.reputation}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("activities")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "activities"
              ? "bg-red-500/15 text-red-300"
              : "text-white/50 hover:bg-white/5 hover:text-white"
          }`}
        >
          🎮 Activities
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("businesses")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "businesses"
              ? "bg-red-500/15 text-red-300"
              : "text-white/50 hover:bg-white/5 hover:text-white"
          }`}
        >
          🏪 Businesses
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("features")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "features"
              ? "bg-red-500/15 text-red-300"
              : "text-white/50 hover:bg-white/5 hover:text-white"
          }`}
        >
          📍 Area
        </button>
      </div>

      {/* Activity Result */}
      {message && (
        <div
          className={`mx-4 mt-4 rounded-xl border p-4 text-sm ${
            messageType === "success"
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              : "border-red-400/20 bg-red-500/10 text-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Activities */}
      {activeTab === "activities" && (
        <div className="space-y-3 p-4">
          {world.activities.length === 0 ? (
            <div className="rounded-xl bg-white/5 p-5 text-center text-sm text-white/50">
              No activities are available here yet.
            </div>
          ) : (
            world.activities.map((activity) => {
              const enoughEnergy =
                player.energy >= activity.energyCost;

              const isBusy = busyActivityId === activity.id;

              return (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                        {activity.icon}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-white">
                          {activity.name}
                        </h3>

                        <p className="mt-1 text-sm leading-5 text-white/50">
                          {activity.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-orange-300">
                            ⚡ {activity.energyCost} energy
                          </span>

                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                            +₦{activity.reward.toLocaleString()}
                          </span>

                          <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-purple-300">
                            +{activity.reputationGain} rep
                          </span>

                          <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-300">
                            +{activity.experienceGain} XP
                          </span>

                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/50">
                            {activity.durationMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!enoughEnergy || isBusy}
                      onClick={() => handleActivity(activity)}
                      className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                        enoughEnergy && !isBusy
                          ? "bg-red-500 text-white hover:bg-red-400"
                          : "cursor-not-allowed bg-white/10 text-white/30"
                      }`}
                    >
                      {isBusy
                        ? "Working..."
                        : enoughEnergy
                          ? "Play"
                          : "Low Energy"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Businesses */}
      {activeTab === "businesses" && (
        <div className="space-y-3 p-4">
          {world.businesses.length === 0 ? (
            <div className="rounded-xl bg-white/5 p-5 text-center text-sm text-white/50">
              No businesses have been added here yet.
            </div>
          ) : (
            world.businesses.map((business) => {
              const isOpen = openBusinesses.some(
                (item) => item.id === business.id
              );

              return (
                <button
                  key={business.id}
                  type="button"
                  onClick={() => onBusinessSelect?.(business.id)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
                      {business.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white">
                          {business.name}
                        </h3>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isOpen
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          {isOpen ? "OPEN" : "CLOSED"}
                        </span>

                        {business.playerOwned && (
                          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                            PLAYER OWNED
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-white/50">
                        {business.description}
                      </p>

                      <div className="mt-2 text-xs text-white/35">
                        Open {business.openHour}:00 –{" "}
                        {business.closeHour}:00
                      </div>
                    </div>

                    <span className="text-white/30">→</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Area Features */}
      {activeTab === "features" && (
        <div className="p-4">
          <div className="mb-4 rounded-2xl bg-white/[0.03] p-4">
            <h3 className="font-bold text-white">
              {world.atmosphere}
            </h3>

            <p className="mt-1 text-sm text-white/45">
              Explore this part of Abuja and discover what is happening
              around you.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {world.specialFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70"
              >
                📍 {feature}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">
                Property available
              </span>

              <span
                className={`font-bold ${
                  world.propertyAvailable
                    ? "text-emerald-300"
                    : "text-white/30"
                }`}
              >
                {world.propertyAvailable ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}