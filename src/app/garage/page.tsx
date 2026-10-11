"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  OwnedVehicle,
  Vehicle,
  getVehicleById,
  getVehicleSpeed,
  getVehicleHandling,
  getVehicleComfort,
  calculateMaintenanceCost,
} from "@/lib/game/vehicles";

import {
  loadOwnedVehicles,
  updateOwnedVehicle,
} from "@/lib/game/garage";

import {
  loadPlayerState,
  savePlayerState,
} from "@/lib/game/player";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

function StatBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-white/60">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function GaragePage() {
  const [ownedVehicles, setOwnedVehicles] = useState<
    OwnedVehicle[]
  >([]);

  const [selectedKey, setSelectedKey] = useState<string | null>(
    null
  );

  const [message, setMessage] = useState("");

  const [playerCash, setPlayerCash] = useState(0);

  useEffect(() => {
    const vehicles = loadOwnedVehicles();

    setOwnedVehicles(vehicles);

    const player = loadPlayerState();

    setPlayerCash(player.cash);

    if (vehicles.length > 0) {
      setSelectedKey(
        `${vehicles[0].vehicleId}-${vehicles[0].purchasedAt}`
      );
    }
  }, []);

  const selectedOwnedVehicle = useMemo(() => {
    if (!selectedKey) {
      return null;
    }

    return (
      ownedVehicles.find(
        (vehicle) =>
          `${vehicle.vehicleId}-${vehicle.purchasedAt}` ===
          selectedKey
      ) ?? null
    );
  }, [ownedVehicles, selectedKey]);

  const selectedVehicle = useMemo(() => {
    if (!selectedOwnedVehicle) {
      return null;
    }

    return getVehicleById(
      selectedOwnedVehicle.vehicleId
    ) ?? null;
  }, [selectedOwnedVehicle]);

  function handleMaintain() {
    if (!selectedOwnedVehicle || !selectedVehicle) {
      return;
    }

    const cost = calculateMaintenanceCost(
      selectedVehicle,
      selectedOwnedVehicle
    );

    if (cost <= 0) {
      setMessage("Your vehicle is already in perfect condition.");
      return;
    }

    if (playerCash < cost) {
      setMessage(
        `You need ${formatNaira(cost)} to service this vehicle.`
      );
      return;
    }

    const player = loadPlayerState();

    const updatedPlayer = {
      ...player,
      cash: player.cash - cost,
    };

    savePlayerState(updatedPlayer);

    const updatedVehicle: OwnedVehicle = {
      ...selectedOwnedVehicle,
      condition: 100,
      fuel: 100,
    };

    const updatedVehicles =
      updateOwnedVehicle(updatedVehicle);

    setOwnedVehicles(updatedVehicles);
    setPlayerCash(updatedPlayer.cash);

    setMessage(
      `${selectedVehicle.name} has been fully serviced and refueled.`
    );
  }

  if (ownedVehicles.length === 0) {
    return (
      <main className="min-h-screen bg-[#08090b] px-5 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dealership"
            className="mb-8 inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            ← Back to Dealership
          </Link>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <div className="mb-4 text-6xl">🚗</div>

            <h1 className="text-3xl font-bold">
              Your Garage
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-white/60">
              You don't own any vehicles yet. Visit a dealership,
              test drive a car and purchase your first vehicle.
            </p>

            <Link
              href="/dealership"
              className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:scale-[1.02]"
            >
              Visit Dealership
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/40">
              ABUJA LIFE
            </p>

            <h1 className="mt-1 text-4xl font-black">
              My Garage
            </h1>

            <p className="mt-2 text-white/50">
              Your personal vehicle collection.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-white/40">
                CASH
              </p>
              <p className="font-bold text-emerald-400">
                {formatNaira(playerCash)}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-white/40">
                VEHICLES
              </p>
              <p className="font-bold">
                {ownedVehicles.length}
              </p>
            </div>

            <Link
              href="/dealership"
              className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:scale-[1.02]"
            >
              Buy Vehicle
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* VEHICLE LIST */}

          <aside className="space-y-3">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
              Your Vehicles
            </h2>

            {ownedVehicles.map((ownedVehicle) => {
              const vehicle = getVehicleById(
                ownedVehicle.vehicleId
              );

              if (!vehicle) {
                return null;
              }

              const key = `${ownedVehicle.vehicleId}-${ownedVehicle.purchasedAt}`;

              const selected = key === selectedKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedKey(key);
                    setMessage("");
                  }}
                  className={`w-full overflow-hidden rounded-2xl border text-left transition ${
                    selected
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="h-36 bg-white/[0.03]">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="h-full w-full object-contain p-4"
                    />
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-white/40">
                      {vehicle.brand}
                    </p>

                    <h3 className="font-bold">
                      {vehicle.name}
                    </h3>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-white/50">
                        Condition
                      </span>

                      <span
                        className={
                          ownedVehicle.condition >= 70
                            ? "text-emerald-400"
                            : ownedVehicle.condition >= 40
                              ? "text-yellow-400"
                              : "text-red-400"
                        }
                      >
                        {ownedVehicle.condition}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* SELECTED VEHICLE */}

          {selectedVehicle &&
          selectedOwnedVehicle ? (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
              <div className="relative h-[330px] bg-white/[0.025]">
                <img
                  src={selectedVehicle.image}
                  alt={selectedVehicle.name}
                  className="h-full w-full object-contain p-8"
                />

                <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs uppercase tracking-wider text-white/60">
                  {selectedVehicle.class}
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/40">
                      {selectedVehicle.brand}
                    </p>

                    <h2 className="mt-1 text-3xl font-black">
                      {selectedVehicle.name}
                    </h2>

                    <p className="mt-2 max-w-2xl text-white/50">
                      {selectedVehicle.description}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs text-white/40">
                      PURCHASED
                    </p>

                    <p className="text-sm font-semibold">
                      {new Date(
                        selectedOwnedVehicle.purchasedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-bold">
                      Vehicle Condition
                    </h3>

                    <StatBar
                      label="Condition"
                      value={selectedOwnedVehicle.condition}
                    />

                    <StatBar
                      label="Fuel"
                      value={selectedOwnedVehicle.fuel}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold">
                      Performance
                    </h3>

                    <StatBar
                      label="Speed"
                      value={getVehicleSpeed(
                        selectedVehicle,
                        selectedOwnedVehicle
                      )}
                    />

                    <StatBar
                      label="Handling"
                      value={getVehicleHandling(
                        selectedVehicle,
                        selectedOwnedVehicle
                      )}
                    />

                    <StatBar
                      label="Comfort"
                      value={getVehicleComfort(
                        selectedVehicle,
                        selectedOwnedVehicle
                      )}
                    />
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      MILEAGE
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {selectedOwnedVehicle.mileage.toFixed(1)} km
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      PERFORMANCE UPGRADES
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {selectedOwnedVehicle.performanceLevel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      CUSTOMIZATION
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {selectedOwnedVehicle.customizationLevel}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/game?vehicle=${selectedVehicle.id}`}
                    className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:scale-[1.02]"
                  >
                    🚗 Drive Vehicle
                  </Link>

                  <button
                    type="button"
                    onClick={handleMaintain}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10"
                  >
                    🔧 Service & Refuel
                  </button>

                  <Link
                    href="/dealership"
                    className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white/70 transition hover:bg-white/5"
                  >
                    Browse More Cars
                  </Link>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}