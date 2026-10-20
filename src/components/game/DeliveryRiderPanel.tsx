"use client";

import { useMemo, useState } from "react";

import {
  calculateDeliveryResult,
  type DeliveryMission,
} from "@/lib/game/deliveryRider";

type DeliveryRiderPanelProps = {
  mission: DeliveryMission;
  onComplete: (result: {
    pay: number;
    tip: number;
    reputation: number;
    satisfaction: number;
    energyCost: number;
    message: string;
  }) => void;
  onCancel: () => void;
};

type Step = "pickup" | "delivery" | "result";

export default function DeliveryRiderPanel({
  mission,
  onComplete,
  onCancel,
}: DeliveryRiderPanelProps) {
  const [step, setStep] = useState<Step>("pickup");

  const [pickupAccuracy, setPickupAccuracy] = useState(0);
  const [routeChoice, setRouteChoice] = useState<
    "safe" | "balanced" | "fast"
  >("balanced");

  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState(
    mission.estimatedMinutes
  );

  const [result, setResult] = useState<ReturnType<
    typeof calculateDeliveryResult
  > | null>(null);

  const routeData = useMemo(() => {
    if (routeChoice === "safe") {
      return {
        name: "Safe Route",
        description: "Slower but protects the package.",
        timeMultiplier: 1.18,
        performanceBonus: 0.08,
      };
    }

    if (routeChoice === "fast") {
      return {
        name: "Fast Route",
        description: "Quickest route, but more difficult.",
        timeMultiplier: 0.82,
        performanceBonus: -0.05,
      };
    }

    return {
      name: "Balanced Route",
      description: "A good balance between speed and safety.",
      timeMultiplier: 1,
      performanceBonus: 0.03,
    };
  }, [routeChoice]);

  function handlePickup() {
    const accuracy =
      pickupAccuracy >= 80
        ? 1
        : pickupAccuracy >= 55
          ? 0.8
          : pickupAccuracy >= 30
            ? 0.6
            : 0.4;

    setPickupAccuracy(Math.round(accuracy * 100));

    setStep("delivery");
  }

  function handleDelivery() {
    const routePerformance = Math.max(
      0,
      Math.min(
        1,
        0.72 +
          routeData.performanceBonus +
          (pickupAccuracy / 100) * 0.12
      )
    );

    const calculatedMinutes = Math.max(
      4,
      Math.round(
        mission.estimatedMinutes * routeData.timeMultiplier
      )
    );

    setDeliveryTime(calculatedMinutes);
    setDeliveryProgress(100);

    const deliveryResult = calculateDeliveryResult(
      mission,
      routePerformance,
      calculatedMinutes
    );

    setResult(deliveryResult);
    setStep("result");
  }

  function renderPickup() {
    return (
      <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-emerald-500/10 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
              Step 1 / 3
            </div>

            <h2 className="mt-2 text-3xl font-black">
              Pick Up Package
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Arrive at the pickup location and make sure you
              collect the correct package before leaving.
            </p>
          </div>

          <div className="text-5xl">{mission.emoji}</div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Pickup
            </div>

            <div className="mt-2 text-lg font-black">
              {mission.pickup}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Package
            </div>

            <div className="mt-2 text-lg font-black">
              {mission.packageName}
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black">
              Package Check
            </span>

            <span className="text-xs font-black text-cyan-300">
              {pickupAccuracy}%
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={pickupAccuracy}
            onChange={(event) =>
              setPickupAccuracy(Number(event.target.value))
            }
            className="mt-4 w-full accent-cyan-400"
          />

          <div className="mt-2 flex justify-between text-[9px] uppercase tracking-wider text-white/25">
            <span>Rush</span>
            <span>Careful</span>
            <span>Perfect</span>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs font-black transition hover:bg-white/10"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={handlePickup}
            className="flex-1 rounded-2xl bg-cyan-400 px-5 py-4 text-xs font-black text-black transition hover:bg-cyan-300"
          >
            COLLECT PACKAGE →
          </button>
        </div>
      </section>
    );
  }

  function renderDelivery() {
    return (
      <section className="rounded-[2rem] border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-white/[0.03] to-emerald-500/10 p-6 shadow-2xl sm:p-8">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">
          Step 2 / 3
        </div>

        <h2 className="mt-2 text-3xl font-black">
          Deliver Package
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
          Choose your route carefully. Fast routes save time but
          can make the delivery more difficult.
        </p>

        <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
                Route
              </div>

              <div className="mt-1 text-xl font-black">
                {routeData.name}
              </div>

              <div className="mt-1 text-xs text-white/40">
                {routeData.description}
              </div>
            </div>

            <div className="text-4xl">🛵</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(
            [
              ["safe", "🛡️", "Safe Route", "Protect the package"],
              [
                "balanced",
                "⚖️",
                "Balanced Route",
                "Normal speed and safety",
              ],
              [
                "fast",
                "⚡",
                "Fast Route",
                "Reach the customer quickly",
              ],
            ] as const
          ).map(([id, emoji, name, description]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRouteChoice(id)}
              className={`rounded-2xl border p-5 text-left transition ${
                routeChoice === id
                  ? "border-emerald-400/50 bg-emerald-400/10"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div className="text-2xl">{emoji}</div>

              <div className="mt-3 text-sm font-black">
                {name}
              </div>

              <div className="mt-1 text-[11px] leading-5 text-white/35">
                {description}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Destination
            </div>

            <div className="mt-1 font-black">
              {mission.destination}
            </div>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Traffic
            </div>

            <div className="mt-1 font-black">
              {mission.traffic}
            </div>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Target Time
            </div>

            <div className="mt-1 font-black">
              {mission.estimatedMinutes} min
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black">
              Delivery Progress
            </span>

            <span className="text-xs font-black text-orange-300">
              {deliveryProgress}%
            </span>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-400 transition-all duration-500"
              style={{
                width: `${deliveryProgress}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setStep("pickup")}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs font-black transition hover:bg-white/10"
          >
            ← BACK
          </button>

          <button
            type="button"
            onClick={() => {
              setDeliveryProgress(100);
              handleDelivery();
            }}
            className="flex-1 rounded-2xl bg-orange-400 px-5 py-4 text-xs font-black text-black transition hover:bg-orange-300"
          >
            COMPLETE DELIVERY 🛵
          </button>
        </div>
      </section>
    );
  }

  function renderResult() {
    if (!result) return null;

    const total = result.pay + result.tip;

    return (
      <section className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-cyan-500/10 p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <div className="text-6xl">
            {result.satisfaction >= 85 ? "🎉" : "📦"}
          </div>

          <div className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
            Delivery Complete
          </div>

          <h2 className="mt-2 text-4xl font-black">
            {result.satisfaction >= 90
              ? "Excellent Delivery!"
              : result.satisfaction >= 75
                ? "Good Delivery!"
                : "Delivery Completed"}
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/45">
            {result.message}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Delivery Pay
            </div>

            <div className="mt-2 text-2xl font-black text-emerald-300">
              ₦{result.pay.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Tip
            </div>

            <div className="mt-2 text-2xl font-black text-yellow-300">
              ₦{result.tip.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Satisfaction
            </div>

            <div className="mt-2 text-2xl font-black">
              {result.satisfaction}%
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Energy
            </div>

            <div className="mt-2 text-2xl font-black text-orange-300">
              -{result.energyCost}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
            Total Earned
          </div>

          <div className="mt-2 text-4xl font-black text-white">
            ₦{total.toLocaleString()}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onComplete(result)}
          className="mt-7 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-xs font-black text-black transition hover:bg-emerald-300"
        >
          COLLECT REWARD & RETURN TO SHIFT →
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {step === "pickup" && renderPickup()}
      {step === "delivery" && renderDelivery()}
      {step === "result" && renderResult()}
    </div>
  );
}
