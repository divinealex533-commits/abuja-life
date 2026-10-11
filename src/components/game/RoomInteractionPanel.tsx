"use client";

import React, { useState } from "react";
import {
  loadPlayerState,
  savePlayerState,
  spendEnergy,
  completeJob,
} from "@/lib/game/player";

interface RoomInteractionPanelProps {
  roomId: string;
  roomName: string;
}

interface RoomInteraction {
  id: string;
  icon: string;
  title: string;
  description: string;
  energyCost: number;
  reward: number;
  reputationGain: number;
  experienceGain: number;
}

const ROOM_INTERACTIONS: Record<string, RoomInteraction[]> = {
  "living-room": [
    {
      id: "relax",
      icon: "🛋️",
      title: "Relax",
      description: "Take some time to relax and recover your energy.",
      energyCost: 0,
      reward: 0,
      reputationGain: 0,
      experienceGain: 0,
    },
    {
      id: "watch-tv",
      icon: "📺",
      title: "Watch TV",
      description: "Enjoy some entertainment in your living room.",
      energyCost: 5,
      reward: 0,
      reputationGain: 1,
      experienceGain: 1,
    },
    {
      id: "invite-friends",
      icon: "👥",
      title: "Invite Friends",
      description: "Spend time with friends at home.",
      energyCost: 8,
      reward: 0,
      reputationGain: 3,
      experienceGain: 2,
    },
  ],

  bedroom: [
    {
      id: "sleep",
      icon: "😴",
      title: "Sleep",
      description: "Get some rest and restore your energy.",
      energyCost: 0,
      reward: 0,
      reputationGain: 0,
      experienceGain: 1,
    },
    {
      id: "get-ready",
      icon: "👕",
      title: "Get Ready",
      description: "Prepare yourself for the day.",
      energyCost: 2,
      reward: 0,
      reputationGain: 1,
      experienceGain: 1,
    },
  ],

  kitchen: [
    {
      id: "cook",
      icon: "🍳",
      title: "Cook a Meal",
      description: "Prepare a meal for yourself.",
      energyCost: 5,
      reward: 0,
      reputationGain: 1,
      experienceGain: 2,
    },
    {
      id: "make-breakfast",
      icon: "🥞",
      title: "Make Breakfast",
      description: "Start your day with a proper breakfast.",
      energyCost: 3,
      reward: 0,
      reputationGain: 1,
      experienceGain: 1,
    },
  ],

  bathroom: [
    {
      id: "freshen-up",
      icon: "🚿",
      title: "Freshen Up",
      description: "Take a shower and freshen yourself up.",
      energyCost: 2,
      reward: 0,
      reputationGain: 1,
      experienceGain: 1,
    },
    {
      id: "get-ready",
      icon: "🪥",
      title: "Get Ready",
      description: "Take care of your morning routine.",
      energyCost: 2,
      reward: 0,
      reputationGain: 1,
      experienceGain: 1,
    },
  ],

  office: [
    {
      id: "work",
      icon: "💻",
      title: "Work",
      description: "Spend some time working from home.",
      energyCost: 10,
      reward: 1500,
      reputationGain: 3,
      experienceGain: 3,
    },
    {
      id: "study",
      icon: "📚",
      title: "Study",
      description: "Improve your knowledge and skills.",
      energyCost: 6,
      reward: 0,
      reputationGain: 2,
      experienceGain: 3,
    },
  ],

  "game-room": [
    {
      id: "play-games",
      icon: "🎮",
      title: "Play Games",
      description: "Take a break and enjoy some gaming.",
      energyCost: 5,
      reward: 0,
      reputationGain: 1,
      experienceGain: 1,
    },
    {
      id: "gaming-tournament",
      icon: "🏆",
      title: "Practice Tournament",
      description: "Practice for the city's gaming tournaments.",
      energyCost: 8,
      reward: 500,
      reputationGain: 2,
      experienceGain: 3,
    },
  ],
};

const DEFAULT_INTERACTIONS: RoomInteraction[] = [
  {
    id: "relax",
    icon: "🛋️",
    title: "Relax",
    description: "Take some time to relax in your home.",
    energyCost: 0,
    reward: 0,
    reputationGain: 0,
    experienceGain: 1,
  },
];

export default function RoomInteractionPanel({
  roomId,
  roomName,
}: RoomInteractionPanelProps) {
  const [message, setMessage] = useState("");
  const [activeInteraction, setActiveInteraction] = useState<string | null>(
    null
  );
  const [player, setPlayer] = useState(() => loadPlayerState());

  const interactions =
    ROOM_INTERACTIONS[roomId] ?? DEFAULT_INTERACTIONS;

  function handleInteraction(interaction: RoomInteraction) {
    const currentPlayer = loadPlayerState();

    if (currentPlayer.energy < interaction.energyCost) {
      setMessage(
        `⚡ You need ${interaction.energyCost} energy, but you only have ${currentPlayer.energy}.`
      );
      return;
    }

    let updatedPlayer = spendEnergy(
      currentPlayer,
      interaction.energyCost
    );

    if (interaction.reward > 0 || interaction.reputationGain > 0) {
      updatedPlayer = completeJob(
        updatedPlayer,
        interaction.reward,
        interaction.reputationGain,
        interaction.experienceGain
      );
    } else if (interaction.experienceGain > 0) {
      updatedPlayer = {
        ...updatedPlayer,
        jobExperience:
          updatedPlayer.jobExperience + interaction.experienceGain,
      };
    }

    savePlayerState(updatedPlayer);
    setPlayer(updatedPlayer);
    setActiveInteraction(interaction.id);

    const rewards: string[] = [];

    if (interaction.energyCost > 0) {
      rewards.push(`-${interaction.energyCost} energy`);
    }

    if (interaction.reward > 0) {
      rewards.push(`+₦${interaction.reward.toLocaleString()}`);
    }

    if (interaction.reputationGain > 0) {
      rewards.push(`+${interaction.reputationGain} reputation`);
    }

    setMessage(
      `${interaction.icon} ${interaction.title} completed${
        rewards.length ? ` — ${rewards.join(" • ")}` : ""
      }`
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">
          {roomName} Activities
        </h3>

        <p className="mt-1 text-sm text-white/60">
          Interact with this room to affect your character.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {interactions.map((interaction) => {
          const canUse =
            player.energy >= interaction.energyCost;

          const isActive =
            activeInteraction === interaction.id;

          return (
            <button
              key={interaction.id}
              type="button"
              onClick={() => handleInteraction(interaction)}
              disabled={!canUse}
              className={`rounded-xl border p-4 text-left transition ${
                isActive
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : canUse
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {interaction.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">
                    {interaction.title}
                  </div>

                  <p className="mt-1 text-sm text-white/60">
                    {interaction.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {interaction.energyCost > 0 && (
                      <span className="rounded-full bg-yellow-400/10 px-2 py-1 text-yellow-300">
                        ⚡ -{interaction.energyCost}
                      </span>
                    )}

                    {interaction.reward > 0 && (
                      <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-300">
                        💰 +₦{interaction.reward.toLocaleString()}
                      </span>
                    )}

                    {interaction.reputationGain > 0 && (
                      <span className="rounded-full bg-blue-400/10 px-2 py-1 text-blue-300">
                        ⭐ +{interaction.reputationGain} Rep
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm">
        <span className="text-white/70">
          ⚡ Energy:{" "}
          <strong className="text-white">
            {player.energy}/{player.maxEnergy}
          </strong>
        </span>

        <span className="text-white/70">
          💰 Cash:{" "}
          <strong className="text-white">
            ₦{player.cash.toLocaleString()}
          </strong>
        </span>

        <span className="text-white/70">
          ⭐ Reputation:{" "}
          <strong className="text-white">
            {player.reputation}
          </strong>
        </span>
      </div>
    </div>
  );
}