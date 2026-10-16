"use client";

import React, { useEffect, useMemo, useState } from "react";

import {
  FOOD_DISHES,
  FOOD_ORDERS,
  FoodPreparation,
  FoodOrder,
  calculateFoodOrder,
} from "@/lib/game/foodVendor";

import {
  PlayerGameState,
  loadPersistentPlayerState,
  savePersistentPlayerState,
} from "@/lib/game/player";

const STEPS = [
  {
    key: "ingredientScore" as const,
    title: "Prepare the ingredients",
    icon: "🥕",
    description:
      "Stop the meter close to the target to prepare the ingredients properly.",
  },
  {
    key: "cookingScore" as const,
    title: "Cook the meal",
    icon: "🍳",
    description:
      "Time the heat carefully. A better stop means better cooking.",
  },
  {
    key: "presentationScore" as const,
    title: "Present the meal",
    icon: "🍽️",
    description:
      "Plate the order neatly before serving the customer.",
  },
] as const;

type Props = {
  onComplete?: (
    result: ReturnType<typeof calculateFoodOrder>
  ) => void;
};

function randomOrder(previousId?: string): FoodOrder {
  const available = FOOD_ORDERS.filter(
    (order) => order.id !== previousId
  );

  return (
    available[
      Math.floor(Math.random() * available.length)
    ] ?? FOOD_ORDERS[0]
  );
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(min, Math.min(max, value));
}

export default function FoodVendorPanel({
  onComplete,
}: Props) {
  const [player, setPlayer] =
    useState<PlayerGameState | null>(null);

  const [order, setOrder] = useState<FoodOrder>(
    () => FOOD_ORDERS[0]
  );

  const [stepIndex, setStepIndex] = useState(0);

  const [meter, setMeter] = useState(50);
  const [direction, setDirection] = useState(1);
  const [target, setTarget] = useState(75);

  const [preparation, setPreparation] =
    useState<FoodPreparation>({
      ingredientScore: 0,
      cookingScore: 0,
      presentationScore: 0,
    });

  const [result, setResult] =
    useState<ReturnType<
      typeof calculateFoodOrder
    > | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const step = STEPS[stepIndex];
  const dish = FOOD_DISHES[order.dish];

  useEffect(() => {
    let mounted = true;

    void loadPersistentPlayerState().then(
      (state) => {
        if (mounted) {
          setPlayer(state);
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (result || !player) {
      return;
    }

    const timer = window.setInterval(() => {
      setMeter((current) => {
        let next =
          current + direction * 3;

        if (next >= 100) {
          next = 100;
          setDirection(-1);
        }

        if (next <= 0) {
          next = 0;
          setDirection(1);
        }

        return next;
      });
    }, 45);

    return () => {
      window.clearInterval(timer);
    };
  }, [direction, player, result]);

  const scoreLabel = useMemo(() => {
    const distance = Math.abs(
      meter - target
    );

    if (distance <= 4) {
      return "PERFECT";
    }

    if (distance <= 10) {
      return "GREAT";
    }

    if (distance <= 18) {
      return "GOOD";
    }

    return "POOR";
  }, [meter, target]);

  function prepareNewStep(
    nextIndex: number
  ) {
    setStepIndex(nextIndex);
    setMeter(50);
    setDirection(
      Math.random() > 0.5 ? 1 : -1
    );
    setTarget(
      25 + Math.floor(Math.random() * 51)
    );
  }

  function stopMeter() {
    if (!player || saving || result) {
      return;
    }

    const distance = Math.abs(
      meter - target
    );

    const score = clamp(
      Math.round(100 - distance * 4),
      0,
      100
    );

    const nextPreparation: FoodPreparation = {
      ...preparation,
      [step.key]: score,
    };

    setPreparation(nextPreparation);

    if (stepIndex < STEPS.length - 1) {
      prepareNewStep(stepIndex + 1);
      setMessage(
        `${scoreLabel}! ${score}/100`
      );
      return;
    }

    void finishOrder(nextPreparation);
  }

  async function finishOrder(
    finalPreparation: FoodPreparation
  ) {
    if (!player) {
      return;
    }

    if (player.energy < order.energyCost) {
      setMessage(
        `You need ${order.energyCost} energy for this order, but you only have ${player.energy}.`
      );
      return;
    }

    const calculated =
      calculateFoodOrder(
        order,
        finalPreparation
      );

    const updatedPlayer: PlayerGameState = {
      ...player,

      cash:
        player.cash +
        calculated.payment +
        calculated.tip,

      energy: Math.max(
        0,
        player.energy -
          calculated.energyCost
      ),

      reputation:
        player.reputation +
        calculated.reputation,

      jobExperience:
        player.jobExperience +
        calculated.reputation +
        2,
    };

    setSaving(true);
    setMessage(
      "Saving your earnings..."
    );

    const saved =
      await savePersistentPlayerState(
        updatedPlayer
      );

    if (!saved) {
      setSaving(false);

      setMessage(
        "The order was completed, but your player state could not be saved. Please try again."
      );

      return;
    }

    setPlayer(updatedPlayer);
    setResult(calculated);
    setSaving(false);
    setMessage(calculated.message);

    onComplete?.(calculated);
  }

  function startNextOrder() {
    const nextOrder = randomOrder(
      order.id
    );

    setOrder(nextOrder);
    setStepIndex(0);
    setMeter(50);
    setDirection(1);
    setTarget(75);

    setPreparation({
      ingredientScore: 0,
      cookingScore: 0,
      presentationScore: 0,
    });

    setResult(null);
    setMessage("");
  }

  if (!player) {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#08110f] p-6 text-center">
        <div className="text-sm font-bold text-slate-400">
          Loading your Food Vendor shift...
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-[#08110f] to-emerald-500/10 p-5 shadow-2xl sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">
            🍲 Food Vendor Shift
          </div>

          <h2 className="mt-2 text-3xl font-black">
            {dish.name}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            {dish.description} Serve{" "}
            {order.customer} before they lose
            patience.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
          <Stat
            label="Cash"
            value={`₦${player.cash.toLocaleString()}`}
          />

          <Stat
            label="Energy"
            value={`⚡ ${player.energy}/${player.maxEnergy}`}
          />

          <Stat
            label="Rep"
            value={String(player.reputation)}
          />

          <Stat
            label="Job XP"
            value={String(
              player.jobExperience
            )}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="text-6xl">
            {dish.emoji}
          </div>

          <div className="mt-4 text-[10px] font-black uppercase tracking-wider text-orange-300">
            Customer order
          </div>

          <div className="mt-1 text-2xl font-black">
            {order.customer}
          </div>

          <div className="mt-2 text-sm text-white/50">
            Mood: {order.customerMood}
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <InfoRow
              label="Base price"
              value={`₦${order.basePrice.toLocaleString()}`}
            />

            <InfoRow
              label="Energy cost"
              value={`⚡ ${order.energyCost}`}
            />

            <InfoRow
              label="Difficulty"
              value={order.difficulty.toUpperCase()}
            />

            <InfoRow
              label="Patience"
              value={`${order.patience}%`}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-orange-400/10 bg-orange-400/5 p-4 text-xs leading-5 text-white/50">
            Better preparation increases
            satisfaction, payment, tips and
            reputation.
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          {!result ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    Step {stepIndex + 1} of{" "}
                    {STEPS.length}
                  </div>

                  <h3 className="mt-1 text-2xl font-black">
                    {step.icon}{" "}
                    {step.title}
                  </h3>
                </div>

                <div className="rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-white/60">
                  {meter}%
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {step.description}
              </p>

              <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/35">
                  <span>0</span>
                  <span>
                    Target: {target}
                  </span>
                  <span>100</span>
                </div>

                <div className="relative mt-5 h-7 rounded-full bg-white/10">
                  <div
                    className="absolute top-0 h-full w-1 rounded-full bg-orange-300/80"
                    style={{
                      left: `${target}%`,
                    }}
                  />

                  <div
                    className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-400 shadow-lg transition-[left]"
                    style={{
                      left: `${meter}%`,
                    }}
                  />
                </div>

                <div className="mt-5 text-center text-sm font-black text-white/70">
                  {scoreLabel}
                </div>

                <button
                  type="button"
                  onClick={stopMeter}
                  disabled={saving}
                  className="mt-5 w-full rounded-2xl bg-orange-400 px-5 py-4 text-sm font-black text-black transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {stepIndex ===
                  STEPS.length - 1
                    ? "SERVE MEAL 🍽️"
                    : `STOP — ${step.title.toUpperCase()}`}
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {STEPS.map(
                  (item, index) => {
                    const score =
                      preparation[
                        item.key
                      ];

                    return (
                      <div
                        key={item.key}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center"
                      >
                        <div className="text-lg">
                          {item.icon}
                        </div>

                        <div className="mt-1 text-[9px] font-black uppercase text-white/35">
                          {index + 1}
                        </div>

                        <div className="mt-1 text-sm font-black text-white">
                          {score || "—"}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-6xl">
                {result.quality ===
                "excellent"
                  ? "🔥"
                  : result.quality ===
                    "good"
                  ? "😋"
                  : result.quality ===
                    "okay"
                  ? "🙂"
                  : "😬"}
              </div>

              <div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                Order complete
              </div>

              <h3 className="mt-2 text-3xl font-black">
                {result.quality.toUpperCase()}{" "}
                MEAL
              </h3>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/55">
                {result.message}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Reward
                  label="Meal payment"
                  value={`₦${result.payment.toLocaleString()}`}
                />

                <Reward
                  label="Customer tip"
                  value={`₦${result.tip.toLocaleString()}`}
                />

                <Reward
                  label="Satisfaction"
                  value={`${result.satisfaction}%`}
                />

                <Reward
                  label="Reputation"
                  value={`+${result.reputation}`}
                />
              </div>

              <button
                type="button"
                onClick={startNextOrder}
                className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-black transition hover:bg-emerald-300"
              >
                TAKE NEXT ORDER →
              </button>
            </div>
          )}

          {message && !result && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs font-bold text-white/55">
              {message}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-black text-white">
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
      <span className="text-white/35">
        {label}
      </span>

      <span className="font-black text-white/75">
        {value}
      </span>
    </div>
  );
}

function Reward({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
      <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
        {label}
      </div>

      <div className="mt-1 text-lg font-black text-emerald-300">
        {value}
      </div>
    </div>
  );
}
