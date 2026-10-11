"use client";

import React, { useMemo, useState } from "react";
import {
  FoodOrder,
  FoodPreparation,
  FOOD_DISHES,
  calculateFoodOrder,
} from "@/lib/game/foodVendor";
import FoodCookingGame from "@/components/game/FoodCookingGame";

interface FoodVendorPanelProps {
  order: FoodOrder;
  onComplete: (result: {
    payment: number;
    tip: number;
    reputation: number;
    satisfaction: number;
    energyCost: number;
    quality: string;
    message: string;
  }) => void;
  onCancel?: () => void;
}

export default function FoodVendorPanel({
  order,
  onComplete,
  onCancel,
}: FoodVendorPanelProps) {
  const [step, setStep] = useState(1);

  const [ingredients, setIngredients] = useState(75);
  const [cooking, setCooking] = useState(75);
  const [presentation, setPresentation] = useState(75);

  const [finished, setFinished] = useState(false);
  const [cookingCompleted, setCookingCompleted] = useState(false);

  const dish = useMemo(
    () => FOOD_DISHES[order.dish],
    [order.dish]
  );

  const progress = (step / 5) * 100;

  function nextStep() {
    if (step < 5) {
      setStep((current) => current + 1);
    }
  }

  function handleCookingComplete(performance: number) {
    const cookingScore = Math.round(
      Math.max(0, Math.min(1, performance)) * 100
    );

    setCooking(cookingScore);
    setCookingCompleted(true);
    setStep(4);
  }

  function completeOrder() {
    if (!cookingCompleted) return;

    const preparation: FoodPreparation = {
      ingredientScore: ingredients,
      cookingScore: cooking,
      presentationScore: presentation,
    };

    const result = calculateFoodOrder(
      order,
      preparation
    );

    setFinished(true);

    onComplete(result);
  }

  if (finished) {
    return (
      <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6 shadow-2xl">
        <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
          Order Completed
        </div>

        <h2 className="mt-2 text-3xl font-black text-white">
          {dish.emoji} {dish.name}
        </h2>

        <p className="mt-2 text-white/60">
          The customer has received the order.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
            Food Vendor
          </div>

          <h2 className="mt-2 text-3xl font-black text-white">
            {dish.emoji} {dish.name}
          </h2>

          <p className="mt-2 text-white/60">
            Customer:{" "}
            <span className="font-semibold text-white">
              {order.customer}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
          <div className="text-xs uppercase tracking-wider text-white/40">
            Base Price
          </div>

          <div className="text-xl font-black text-emerald-300">
            ₦{order.basePrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs font-bold text-white/50">
          <span>Order Progress</span>
          <span>Step {step} of 5</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* STEP 1 — ACCEPT ORDER */}
      {step === 1 && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-4xl">👨🏾‍🍳</div>

          <h3 className="mt-4 text-2xl font-black text-white">
            New customer order
          </h3>

          <p className="mt-2 text-white/60">
            {order.customer} wants{" "}
            <span className="font-bold text-white">
              {dish.name}
            </span>
            .
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs text-white/40">
                Customer Mood
              </div>

              <div className="mt-1 font-bold capitalize text-white">
                {order.customerMood}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs text-white/40">
                Difficulty
              </div>

              <div className="mt-1 font-bold capitalize text-white">
                {order.difficulty}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs text-white/40">
                Energy
              </div>

              <div className="mt-1 font-bold text-white">
                ⚡ {order.energyCost}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black transition hover:bg-emerald-300 active:scale-[0.98]"
          >
            ACCEPT ORDER 🍲
          </button>
        </div>
      )}

      {/* STEP 2 — INGREDIENTS */}
      {step === 2 && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-4xl">🥕</div>

          <h3 className="mt-4 text-2xl font-black text-white">
            Choose your ingredients
          </h3>

          <p className="mt-2 text-white/60">
            Better ingredients improve the final quality
            of the meal.
          </p>

          <div className="mt-6">
            <div className="mb-3 flex justify-between">
              <span className="font-bold text-white/60">
                Ingredient Quality
              </span>

              <span className="font-black text-emerald-300">
                {ingredients}%
              </span>
            </div>

            <input
              type="range"
              min="40"
              max="100"
              step="5"
              value={ingredients}
              onChange={(event) =>
                setIngredients(Number(event.target.value))
              }
              className="w-full accent-emerald-400"
            />

            <div className="mt-2 flex justify-between text-xs text-white/40">
              <span>Basic ingredients</span>
              <span>Premium ingredients</span>
            </div>
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black transition hover:bg-emerald-300 active:scale-[0.98]"
          >
            PREPARE INGREDIENTS
          </button>
        </div>
      )}

      {/* STEP 3 — ACTUAL COOKING GAME */}
      {step === 3 && (
        <div>
          <div className="mb-4 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
              Step 3 — Live Cooking
            </div>

            <h3 className="mt-2 text-2xl font-black text-white">
              Cook the {dish.name}
            </h3>

            <p className="mt-2 text-sm text-white/60">
              Your performance in the cooking game will determine
              your cooking quality, payment and customer satisfaction.
            </p>
          </div>

          <FoodCookingGame
  dishName={dish.name}
  cookingTime={10}
  onComplete={handleCookingComplete}
/>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white transition hover:bg-white/10"
          >
            BACK TO INGREDIENTS
          </button>
        </div>
      )}

      {/* STEP 4 — PRESENTATION */}
      {step === 4 && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-4xl">🍽️</div>

          <h3 className="mt-4 text-2xl font-black text-white">
            Plate the meal
          </h3>

          <p className="mt-2 text-white/60">
            Presentation matters. A beautiful plate can turn
            a normal order into an excellent one.
          </p>

          {/* COOKING RESULT */}
          <div className="mt-5 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-orange-300">
              Cooking Result
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold text-white/60">
                Cooking Quality
              </span>

              <span className="text-2xl font-black text-orange-300">
                {cooking}%
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-orange-400 transition-all"
                style={{
                  width: `${cooking}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex justify-between">
              <span className="font-bold text-white/60">
                Presentation
              </span>

              <span className="font-black text-emerald-300">
                {presentation}%
              </span>
            </div>

            <input
              type="range"
              min="40"
              max="100"
              step="5"
              value={presentation}
              onChange={(event) =>
                setPresentation(Number(event.target.value))
              }
              className="w-full accent-emerald-400"
            />

            <div className="mt-2 flex justify-between text-xs text-white/40">
              <span>Simple</span>
              <span>Restaurant quality</span>
            </div>
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black transition hover:bg-emerald-300 active:scale-[0.98]"
          >
            PLATE & SERVE 🍽️
          </button>

          <button
            type="button"
            onClick={() => setStep(3)}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white transition hover:bg-white/10"
          >
            REPLAY COOKING
          </button>
        </div>
      )}

      {/* STEP 5 — FINAL RESULT */}
      {step === 5 && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <div className="text-4xl">💰</div>

          <h3 className="mt-4 text-2xl font-black text-white">
            Order ready!
          </h3>

          <p className="mt-2 text-white/60">
            Everything is ready. Serve{" "}
            <span className="font-bold text-white">
              {order.customer}
            </span>{" "}
            and see how they rate your meal.
          </p>

          {/* FINAL SCORES */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <div className="text-xs text-white/40">
                Ingredients
              </div>

              <div className="mt-1 font-black text-white">
                {ingredients}%
              </div>
            </div>

            <div className="rounded-xl bg-orange-500/10 p-3 text-center">
              <div className="text-xs text-orange-300/60">
                Cooking
              </div>

              <div className="mt-1 font-black text-orange-300">
                {cooking}%
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3 text-center">
              <div className="text-xs text-white/40">
                Presentation
              </div>

              <div className="mt-1 font-black text-white">
                {presentation}%
              </div>
            </div>
          </div>

          {/* OVERALL QUALITY */}
          <div className="mt-4 rounded-2xl bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wider text-white/40">
              Overall Meal Quality
            </div>

            <div className="mt-2 text-3xl font-black text-emerald-300">
              {Math.round(
                (ingredients + cooking + presentation) / 3
              )}
              %
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{
                  width: `${
                    (ingredients + cooking + presentation) / 3
                  }%`,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={completeOrder}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black transition hover:bg-emerald-300 active:scale-[0.98]"
          >
            SERVE & GET PAID 💰
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-3 font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              CANCEL ORDER
            </button>
          )}
        </div>
      )}

      {/* ORDER INFO */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/40">
            Customer
          </div>

          <div className="mt-1 font-bold text-white">
            {order.customer}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/40">
            Dish
          </div>

          <div className="mt-1 font-bold text-white">
            {dish.name}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/40">
            Energy
          </div>

          <div className="mt-1 font-bold text-white">
            ⚡ {order.energyCost}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/40">
            Difficulty
          </div>

          <div className="mt-1 font-bold capitalize text-white">
            {order.difficulty}
          </div>
        </div>
      </div>
    </section>
  );
}