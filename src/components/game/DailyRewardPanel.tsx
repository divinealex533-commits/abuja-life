"use client";

import React, { useEffect, useState } from "react";
import {
  claimDailyReward,
  getTodayReward,
  loadDailyRewardState,
  type DailyReward,
  type DailyRewardState,
} from "@/lib/game/dailyRewards";

export default function DailyRewardPanel() {
  const [reward, setReward] = useState<DailyReward>(
    getTodayReward()
  );

  const [state, setState] = useState<DailyRewardState>(
    loadDailyRewardState()
  );

  const [message, setMessage] = useState("");

  useEffect(() => {
    const refresh = () => {
      setReward(getTodayReward());
      setState(loadDailyRewardState());
    };

    window.addEventListener(
      "abujaLifeDailyRewardUpdated",
      refresh
    );

    return () => {
      window.removeEventListener(
        "abujaLifeDailyRewardUpdated",
        refresh
      );
    };
  }, []);

  function handleClaim() {
    const result = claimDailyReward();

    setReward(getTodayReward());
    setState(result.state);
    setMessage(result.message);

    window.dispatchEvent(
      new Event("abujaLifePlayerUpdated")
    );

    window.dispatchEvent(
      new Event("abujaLifeProgressionUpdated")
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white shadow-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Daily City Reward
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            {reward.label}
          </h2>

          <p className="mt-1 text-sm text-white/60">
            Keep coming back to build your streak.
          </p>
        </div>

        <div className="rounded-xl bg-orange-500/10 px-4 py-3 text-center">
          <div className="text-2xl font-black">
            {state.streak}
          </div>

          <div className="text-[10px] uppercase tracking-wider text-white/50">
            Streak
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RewardBox
          icon="₦"
          value={`₦${reward.cash.toLocaleString()}`}
          label="Cash"
        />

        <RewardBox
          icon="⚡"
          value={`+${reward.energy}`}
          label="Energy"
        />

        <RewardBox
          icon="⭐"
          value={`+${reward.reputation}`}
          label="Reputation"
        />

        <RewardBox
          icon="XP"
          value={`+${reward.experience}`}
          label="Experience"
        />
      </div>

      <button
        type="button"
        onClick={handleClaim}
        disabled={state.claimedToday}
        className="mt-5 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state.claimedToday
          ? "✓ Today's Reward Claimed"
          : "🎁 Claim Today's Reward"}
      </button>

      {message && (
        <p className="mt-3 text-center text-sm text-green-400">
          {message}
        </p>
      )}

      <div className="mt-5 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, index) => {
          const day = index + 1;
          const completed =
            state.totalClaims > 0 &&
            day < state.currentDay;

          const active = day === state.currentDay;

          return (
            <div
              key={day}
              className={[
                "rounded-lg border p-2 text-center",
                completed
                  ? "border-green-500/40 bg-green-500/10"
                  : active
                    ? "border-orange-500/60 bg-orange-500/10"
                    : "border-white/10 bg-white/5",
              ].join(" ")}
            >
              <div className="text-[10px] text-white/50">
                DAY
              </div>

              <div className="font-bold">{day}</div>

              {completed && (
                <div className="text-xs text-green-400">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RewardBox({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-lg font-bold">{icon}</div>

      <div className="mt-1 font-bold">
        {value}
      </div>

      <div className="text-xs text-white/50">
        {label}
      </div>
    </div>
  );
}