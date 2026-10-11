"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  DEALERSHIPS,
  VEHICLES,
  type DealershipId,
  type Vehicle,
  getVehiclesByDealership,
  purchaseVehicle,
} from "@/lib/game/vehicles";
import VehicleTestDriveGame, {
  type TestDriveResult,
} from "@/components/game/VehicleTestDriveGame";
import {
  addOwnedVehicle,
} from "@/lib/game/garage";
import {
  loadPlayerState,
  savePlayerState,
} from "@/lib/game/player";

type FilterClass =
  | "all"
  | "economy"
  | "sedan"
  | "suv"
  | "luxury"
  | "sports"
  | "supercar"
  | "hypercar"
  | "performance";

const FILTERS: {
  id: FilterClass;
  label: string;
  icon: string;
}[] = [
  { id: "all", label: "All Cars", icon: "🚘" },
  { id: "economy", label: "Economy", icon: "🚗" },
  { id: "sedan", label: "Sedan", icon: "🚘" },
  { id: "suv", label: "SUV", icon: "🚙" },
  { id: "luxury", label: "Luxury", icon: "💎" },
  { id: "sports", label: "Sports", icon: "🏎️" },
  { id: "supercar", label: "Supercars", icon: "🔥" },
  { id: "hypercar", label: "Hypercars", icon: "🚀" },
  { id: "performance", label: "Performance", icon: "🏁" },
];

function formatMoney(amount: number) {
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
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold text-white">{value}/100</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-orange-500 transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function DealershipPage() {
  const [selectedDealership, setSelectedDealership] =
    useState<DealershipId>("abuja-auto-gallery");

  const [selectedClass, setSelectedClass] =
    useState<FilterClass>("all");

  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [testDriveVehicle, setTestDriveVehicle] =
    useState<Vehicle | null>(null);

  const [lastTestDriveResult, setLastTestDriveResult] =
    useState<TestDriveResult | null>(null);

  const [search, setSearch] = useState("");

  const dealership =
    DEALERSHIPS.find(
      (item) => item.id === selectedDealership
    ) ?? DEALERSHIPS[0];

  const dealershipVehicles = useMemo(() => {
    let vehicles = getVehiclesByDealership(
      selectedDealership
    );

    if (selectedClass !== "all") {
      vehicles = vehicles.filter(
        (vehicle) => vehicle.class === selectedClass
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      vehicles = vehicles.filter(
        (vehicle) =>
          vehicle.name.toLowerCase().includes(query) ||
          vehicle.brand.toLowerCase().includes(query) ||
          vehicle.class.toLowerCase().includes(query) ||
          vehicle.tags.some((tag) =>
            tag.toLowerCase().includes(query)
          )
      );
    }

    return vehicles;
  }, [selectedDealership, selectedClass, search]);

  function startTestDrive(vehicle: Vehicle) {
    setSelectedVehicle(null);
    setLastTestDriveResult(null);
    setTestDriveVehicle(vehicle);
  }

  function handleTestDriveComplete(result: TestDriveResult) {
    if (!lastTestDriveResult) {
      setLastTestDriveResult(result);
      return;
    }

    const vehicle = testDriveVehicle;

    setLastTestDriveResult(null);
    setTestDriveVehicle(null);

    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  }

  function cancelTestDrive() {
    const vehicle = testDriveVehicle;

    setLastTestDriveResult(null);
    setTestDriveVehicle(null);

    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
              Abuja Life
            </div>

            <h1 className="text-xl font-black">
              Auto District
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/game"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold transition hover:bg-white/10"
            >
              ← Back to Game
            </Link>

            <Link
              href="/garage"
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-black transition hover:bg-orange-400"
            >
              My Garage
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-950/50 via-black to-black p-6 md:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative">
            <div className="mb-3 inline-flex rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-300">
              🏁 Abuja Automotive District
            </div>

            <h2 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
              Find the car that
              <span className="text-orange-400">
                {" "}
                defines your lifestyle.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400 md:text-base">
              Walk into Abuja&apos;s finest dealerships,
              inspect vehicles, compare performance and build
              your dream garage.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs text-gray-500">
                  Available Cars
                </div>
                <div className="text-xl font-black">
                  {VEHICLES.length}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs text-gray-500">
                  Dealerships
                </div>
                <div className="text-xl font-black">
                  {DEALERSHIPS.length}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs text-gray-500">
                  Automotive Classes
                </div>
                <div className="text-xl font-black">
                  8
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEALERSHIPS */}
        <section className="mb-8">
          <div className="mb-4">
            <h3 className="text-2xl font-black">
              Dealerships
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Choose where you want to shop.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {DEALERSHIPS.map((item) => {
              const active =
                item.id === selectedDealership;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedDealership(item.id);
                    setSelectedClass("all");
                    setSelectedVehicle(null);
                    setTestDriveVehicle(null);
                    setLastTestDriveResult(null);
                  }}
                  className={`rounded-2xl border p-5 text-left transition ${
                    active
                      ? "border-orange-500/60 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="text-4xl">
                      {item.icon}
                    </div>

                    {active && (
                      <span className="rounded-full bg-orange-500 px-2 py-1 text-[10px] font-black uppercase text-black">
                        Selected
                      </span>
                    )}
                  </div>

                  <h4 className="font-black">
                    {item.name}
                  </h4>

                  <p className="mt-1 text-xs font-bold text-orange-400">
                    📍 {item.neighborhood}
                  </p>

                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-gray-500">
                    {item.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* CURRENT SHOWROOM */}
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Currently Visiting
              </div>

              <h3 className="mt-1 text-2xl font-black">
                {dealership.icon} {dealership.name}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                📍 {dealership.neighborhood}, Abuja
              </p>
            </div>

            <div className="w-full lg:max-w-sm">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search cars..."
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/60"
              />
            </div>
          </div>
        </section>

        {/* FILTERS */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.filter(
            (filter) =>
              dealership.vehicleClasses.includes(
                filter.id as Vehicle["class"]
              ) || filter.id === "all"
          ).map((filter) => {
            const active =
              selectedClass === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() =>
                  setSelectedClass(filter.id)
                }
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "bg-orange-500 text-black"
                    : "border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {filter.icon} {filter.label}
              </button>
            );
          })}
        </div>

        {/* CARS */}
        {dealershipVehicles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="text-5xl">🚘</div>

            <h3 className="mt-4 text-xl font-black">
              No vehicles found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try another category or search.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {dealershipVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onInspect={() =>
                  setSelectedVehicle(vehicle)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* INSPECTION MODAL */}
      {selectedVehicle && (
        <VehicleInspection
          vehicle={selectedVehicle}
          onClose={() =>
            setSelectedVehicle(null)
          }
          onTestDrive={() =>
            startTestDrive(selectedVehicle)
          }
        />
      )}

      {/* TEST DRIVE GAME */}
      {testDriveVehicle && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black">
          <VehicleTestDriveGame
            vehicle={testDriveVehicle}
            onComplete={handleTestDriveComplete}
            onCancel={cancelTestDrive}
          />
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* VEHICLE CARD                                                                */
/* -------------------------------------------------------------------------- */

function VehicleCard({
  vehicle,
  onInspect,
}: {
  vehicle: Vehicle;
  onInspect: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-orange-500/30 hover:bg-white/[0.05]">
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-white/10 via-black to-orange-950/20">
        <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-300">
          {vehicle.class}
        </div>

        <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-black/20">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-gray-300">
          {vehicle.brand}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">
              {vehicle.name}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              {vehicle.description}
            </p>
          </div>

          <div className="whitespace-nowrap text-right">
            <div className="text-sm font-black text-orange-400">
              {formatMoney(vehicle.price)}
            </div>

            <div className="text-[10px] text-gray-600">
              Starting price
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatBar
            label="Speed"
            value={vehicle.speed}
          />

          <StatBar
            label="Handling"
            value={vehicle.handling}
          />

          <StatBar
            label="Comfort"
            value={vehicle.comfort}
          />

          <StatBar
            label="Reliability"
            value={vehicle.reliability}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {vehicle.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={onInspect}
          className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black transition hover:bg-orange-400"
        >
          Inspect Vehicle →
        </button>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* VEHICLE INSPECTION                                                          */
/* -------------------------------------------------------------------------- */

function VehicleInspection({
  vehicle,
  onClose,
  onTestDrive,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onTestDrive: () => void;
}) {
  const [buying, setBuying] = useState(false);
  const [purchaseMessage, setPurchaseMessage] =
    useState("");

  const [purchaseSuccess, setPurchaseSuccess] =
    useState(false);

  const [remainingCash, setRemainingCash] =
    useState<number | null>(null);

  function handleBuyVehicle() {
    if (buying || purchaseSuccess) {
      return;
    }

    setBuying(true);
    setPurchaseMessage("");

    const player = loadPlayerState();

    const result = purchaseVehicle(
      vehicle.id,
      player.cash,
      player.reputation
    );

    if (!result.success || !result.ownedVehicle) {
      setPurchaseMessage(result.message);
      setBuying(false);
      return;
    }

    const updatedPlayer = {
      ...player,
      cash: result.remainingCash,
    };

    savePlayerState(updatedPlayer);

    addOwnedVehicle(result.ownedVehicle);

    setRemainingCash(result.remainingCash);
    setPurchaseSuccess(true);
    setPurchaseMessage(
      `${vehicle.name} is now yours! Your vehicle has been added to your garage.`
    );

    setBuying(false);
  }

  if (purchaseSuccess) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm md:items-center md:p-6"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl rounded-t-3xl border border-emerald-500/20 bg-[#101010] p-8 shadow-2xl md:rounded-3xl"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-5xl">
              ✅
            </div>

            <div className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Purchase Complete
            </div>

            <h2 className="mt-2 text-3xl font-black">
              Congratulations!
            </h2>

            <p className="mt-3 text-gray-400">
              You now own the{" "}
              <strong className="text-white">
                {vehicle.name}
              </strong>
              .
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-center">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="h-44 w-full object-contain"
                />
              </div>

              <div className="mt-3 text-xl font-black">
                {vehicle.name}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                {vehicle.brand} • {vehicle.class}
              </div>

              {remainingCash !== null && (
                <div className="mt-5 rounded-xl bg-black/40 px-4 py-3">
                  <div className="text-xs text-gray-500">
                    REMAINING CASH
                  </div>

                  <div className="mt-1 text-lg font-black text-emerald-400">
                    {formatMoney(remainingCash)}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-5 text-sm text-emerald-400">
              🚗 Your vehicle is waiting for you in your garage.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href="/garage"
                className="rounded-xl bg-orange-500 px-5 py-3 font-black text-black transition hover:bg-orange-400"
              >
                🚗 Go To My Garage
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-black transition hover:bg-white/10"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl md:rounded-3xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
              Vehicle Inspection
            </div>

            <h2 className="mt-1 text-3xl font-black">
              {vehicle.name}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {vehicle.brand} • {vehicle.class}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 flex h-56 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-black to-orange-950/20">
          <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-black/20">
            <img
              src={vehicle.image}
              alt={vehicle.name}
              className="h-full w-full object-contain p-6"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <StatBar
            label="Top Speed"
            value={vehicle.speed}
          />

          <StatBar
            label="Handling"
            value={vehicle.handling}
          />

          <StatBar
            label="Comfort"
            value={vehicle.comfort}
          />

          <StatBar
            label="Reliability"
            value={vehicle.reliability}
          />

          <StatBar
            label="Fuel Efficiency"
            value={vehicle.fuelEfficiency}
          />

          <StatBar
            label="Customization"
            value={Math.min(
              100,
              vehicle.upgradeSlots * 10
            )}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-black">
            Vehicle Details
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            {vehicle.description}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-xs text-gray-600">
                Price
              </div>
              <div className="mt-1 font-black text-orange-400">
                {formatMoney(vehicle.price)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600">
                Resale Value
              </div>
              <div className="mt-1 font-bold">
                {formatMoney(vehicle.resaleValue)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600">
                Upgrade Slots
              </div>
              <div className="mt-1 font-bold">
                {vehicle.upgradeSlots}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600">
                Reputation
              </div>
              <div className="mt-1 font-bold">
                {vehicle.reputationRequired}+
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex gap-3">
            <span className="text-xl">🔒</span>

            <div>
              <div className="font-black">
                Ownership requirements
              </div>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                You need at least{" "}
                <strong className="text-gray-300">
                  {formatMoney(
                    vehicle.cashRequired
                  )}
                </strong>{" "}
                and{" "}
                <strong className="text-gray-300">
                  {vehicle.reputationRequired}
                </strong>{" "}
                reputation to purchase this vehicle.
              </p>
            </div>
          </div>
        </div>

        {purchaseMessage && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {purchaseMessage}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onTestDrive}
            disabled={buying}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-black transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🏁 Test Drive
          </button>

          <button
            type="button"
            onClick={handleBuyVehicle}
            disabled={buying}
            className="rounded-xl bg-orange-500 px-4 py-3 font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buying
              ? "Processing Purchase..."
              : `💰 Buy Vehicle — ${formatMoney(
                  vehicle.price
                )}`}
          </button>
        </div>
      </div>
    </div>
  );
}