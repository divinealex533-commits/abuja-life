"use client";

import React, { useMemo, useState } from "react";
import { BusinessMission } from "@/lib/game/businessMissions";

interface BusinessContractGameProps {
  mission: BusinessMission;
  stage: number;
  onStageComplete: () => void;
}

interface Choice {
  id: string;
  label: string;
  emoji: string;
  score: number;
}

const GENERAL_CHOICES: Record<
  string,
  Choice[]
> = {
  event: [
    {
      id: "venue",
      label: "Prepare the venue",
      emoji: "🏛️",
      score: 10,
    },
    {
      id: "vendors",
      label: "Coordinate vendors",
      emoji: "🤝",
      score: 10,
    },
    {
      id: "guests",
      label: "Manage guests",
      emoji: "👥",
      score: 10,
    },
    {
      id: "schedule",
      label: "Run the schedule",
      emoji: "🕐",
      score: 10,
    },
  ],
  interior: [
    {
      id: "lighting",
      label: "Modern lighting",
      emoji: "💡",
      score: 10,
    },
    {
      id: "sofa",
      label: "Designer sofa",
      emoji: "🛋️",
      score: 10,
    },
    {
      id: "art",
      label: "Wall artwork",
      emoji: "🖼️",
      score: 10,
    },
    {
      id: "plants",
      label: "Indoor plants",
      emoji: "🌿",
      score: 10,
    },
  ],
  food: [
    {
      id: "menu",
      label: "Prepare the menu",
      emoji: "📋",
      score: 10,
    },
    {
      id: "ingredients",
      label: "Check ingredients",
      emoji: "🥬",
      score: 10,
    },
    {
      id: "cook",
      label: "Prepare the meals",
      emoji: "👨🏽‍🍳",
      score: 10,
    },
    {
      id: "serve",
      label: "Serve the guests",
      emoji: "🍽️",
      score: 10,
    },
  ],
  fashion: [
    {
      id: "fabric",
      label: "Select fabric",
      emoji: "🧵",
      score: 10,
    },
    {
      id: "measure",
      label: "Take measurements",
      emoji: "📏",
      score: 10,
    },
    {
      id: "design",
      label: "Create the design",
      emoji: "✏️",
      score: 10,
    },
    {
      id: "finish",
      label: "Finish the outfit",
      emoji: "👗",
      score: 10,
    },
  ],
  beauty: [
    {
      id: "consult",
      label: "Client consultation",
      emoji: "💬",
      score: 10,
    },
    {
      id: "prepare",
      label: "Prepare the station",
      emoji: "🧴",
      score: 10,
    },
    {
      id: "service",
      label: "Perform the service",
      emoji: "💇🏽",
      score: 10,
    },
    {
      id: "finish",
      label: "Final styling",
      emoji: "✨",
      score: 10,
    },
  ],
  automotive: [
    {
      id: "inspect",
      label: "Inspect the vehicle",
      emoji: "🔍",
      score: 10,
    },
    {
      id: "clean",
      label: "Deep clean",
      emoji: "🧽",
      score: 10,
    },
    {
      id: "service",
      label: "Service the vehicle",
      emoji: "🔧",
      score: 10,
    },
    {
      id: "finish",
      label: "Final inspection",
      emoji: "✅",
      score: 10,
    },
  ],
  hospitality: [
    {
      id: "room",
      label: "Prepare the room",
      emoji: "🛏️",
      score: 10,
    },
    {
      id: "amenities",
      label: "Prepare amenities",
      emoji: "🧴",
      score: 10,
    },
    {
      id: "guest",
      label: "Welcome the guest",
      emoji: "🤵🏽",
      score: 10,
    },
    {
      id: "service",
      label: "Check guest service",
      emoji: "⭐",
      score: 10,
    },
  ],
  media: [
    {
      id: "location",
      label: "Scout the location",
      emoji: "📍",
      score: 10,
    },
    {
      id: "equipment",
      label: "Prepare equipment",
      emoji: "📷",
      score: 10,
    },
    {
      id: "capture",
      label: "Capture the shots",
      emoji: "📸",
      score: 10,
    },
    {
      id: "edit",
      label: "Deliver final media",
      emoji: "💻",
      score: 10,
    },
  ],
  technology: [
    {
      id: "requirements",
      label: "Gather requirements",
      emoji: "📝",
      score: 10,
    },
    {
      id: "design",
      label: "Design the solution",
      emoji: "🧠",
      score: 10,
    },
    {
      id: "build",
      label: "Build the solution",
      emoji: "💻",
      score: 10,
    },
    {
      id: "test",
      label: "Test and deliver",
      emoji: "🧪",
      score: 10,
    },
  ],
  logistics: [
    {
      id: "pickup",
      label: "Collect the package",
      emoji: "📦",
      score: 10,
    },
    {
      id: "route",
      label: "Choose the route",
      emoji: "🗺️",
      score: 10,
    },
    {
      id: "transport",
      label: "Transport the package",
      emoji: "🚚",
      score: 10,
    },
    {
      id: "delivery",
      label: "Confirm delivery",
      emoji: "✅",
      score: 10,
    },
  ],
  real_estate: [
    {
      id: "brief",
      label: "Understand the client",
      emoji: "💬",
      score: 10,
    },
    {
      id: "search",
      label: "Search properties",
      emoji: "🔎",
      score: 10,
    },
    {
      id: "viewing",
      label: "Arrange property viewing",
      emoji: "🏠",
      score: 10,
    },
    {
      id: "deal",
      label: "Close the deal",
      emoji: "🤝",
      score: 10,
    },
  ],
  entertainment: [
    {
      id: "venue",
      label: "Prepare the venue",
      emoji: "🎮",
      score: 10,
    },
    {
      id: "equipment",
      label: "Check equipment",
      emoji: "🕹️",
      score: 10,
    },
    {
      id: "players",
      label: "Organize players",
      emoji: "👥",
      score: 10,
    },
    {
      id: "competition",
      label: "Run the competition",
      emoji: "🏆",
      score: 10,
    },
  ],
};

const EVENT_STAGES: Choice[][] = [
  [
    {
      id: "maitama",
      label: "Maitama Event Hall",
      emoji: "🏛️",
      score: 30,
    },
    {
      id: "park",
      label: "Outdoor Garden",
      emoji: "🌳",
      score: 18,
    },
    {
      id: "small",
      label: "Small Community Hall",
      emoji: "🏠",
      score: 8,
    },
    {
      id: "street",
      label: "Street Setup",
      emoji: "🛣️",
      score: 4,
    },
  ],
  [
    {
      id: "premium",
      label: "Premium Vendors",
      emoji: "💎",
      score: 30,
    },
    {
      id: "balanced",
      label: "Balanced Vendor Package",
      emoji: "🤝",
      score: 22,
    },
    {
      id: "budget",
      label: "Budget Vendors",
      emoji: "💰",
      score: 12,
    },
    {
      id: "random",
      label: "Random Vendors",
      emoji: "🎲",
      score: 4,
    },
  ],
  [
    {
      id: "professional",
      label: "Professional Event Team",
      emoji: "👔",
      score: 30,
    },
    {
      id: "friends",
      label: "Friends & Volunteers",
      emoji: "🙋🏽",
      score: 20,
    },
    {
      id: "minimal",
      label: "Minimal Staff",
      emoji: "👤",
      score: 10,
    },
    {
      id: "none",
      label: "No Guest Management",
      emoji: "🚫",
      score: 2,
    },
  ],
];

const INTERIOR_STAGES: Choice[][] = [
  [
    {
      id: "modern",
      label: "Modern Luxury",
      emoji: "✨",
      score: 30,
    },
    {
      id: "minimal",
      label: "Minimalist",
      emoji: "⬜",
      score: 24,
    },
    {
      id: "classic",
      label: "Classic",
      emoji: "🏛️",
      score: 18,
    },
    {
      id: "random",
      label: "Mixed Styles",
      emoji: "🎲",
      score: 5,
    },
  ],
  [
    {
      id: "designer",
      label: "Designer Furniture",
      emoji: "🛋️",
      score: 30,
    },
    {
      id: "balanced",
      label: "Comfortable Furniture",
      emoji: "🪑",
      score: 24,
    },
    {
      id: "basic",
      label: "Basic Furniture",
      emoji: "🪑",
      score: 14,
    },
    {
      id: "empty",
      label: "Keep It Empty",
      emoji: "⬜",
      score: 2,
    },
  ],
  [
    {
      id: "lighting",
      label: "Premium Lighting",
      emoji: "💡",
      score: 30,
    },
    {
      id: "art",
      label: "Luxury Artwork",
      emoji: "🖼️",
      score: 26,
    },
    {
      id: "plants",
      label: "Plants & Natural Decor",
      emoji: "🌿",
      score: 20,
    },
    {
      id: "plain",
      label: "Plain Finish",
      emoji: "⬜",
      score: 8,
    },
  ],
];

const STAGE_TITLES = [
  "Plan the Project",
  "Execute the Project",
  "Final Client Review",
];

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function getStageChoices(
  mission: BusinessMission,
  stage: number
): Choice[] {
  if (mission.category === "event") {
    return EVENT_STAGES[Math.min(stage, 2)];
  }

  if (mission.category === "interior") {
    return INTERIOR_STAGES[Math.min(stage, 2)];
  }

  return GENERAL_CHOICES[mission.category] ?? [
    {
      id: "prepare",
      label: "Prepare the project",
      emoji: "📝",
      score: 10,
    },
    {
      id: "work",
      label: "Complete the main work",
      emoji: "🛠️",
      score: 10,
    },
    {
      id: "review",
      label: "Review the result",
      emoji: "🔍",
      score: 10,
    },
    {
      id: "deliver",
      label: "Deliver to the client",
      emoji: "✅",
      score: 10,
    },
  ];
}

function getSuccessThreshold(
  mission: BusinessMission
): number {
  if (
    mission.category === "event" ||
    mission.category === "interior"
  ) {
    return 20;
  }

  return 10;
}

export default function BusinessContractGame({
  mission,
  stage,
  onStageComplete,
}: BusinessContractGameProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    null
  );
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("");

  const stageIndex = Math.max(
    0,
    Math.min(stage, 2)
  );

  const choices = useMemo(
    () => getStageChoices(mission, stageIndex),
    [mission, stageIndex]
  );

  const shuffledChoices = useMemo(
    () => shuffle(choices),
    [choices]
  );

  const isSpecialized =
    mission.category === "event" ||
    mission.category === "interior";

  function handleChoice(choice: Choice) {
    if (completed) {
      return;
    }

    setSelectedId(choice.id);

    const newScore = choice.score;
    setScore(newScore);

    const threshold = getSuccessThreshold(mission);

    if (newScore >= threshold) {
      setCompleted(true);

      if (newScore >= 28) {
        setMessage(
          "Excellent decision! The client will be very impressed. ⭐⭐⭐"
        );
      } else if (newScore >= 20) {
        setMessage(
          "Great decision! The project is going well. ⭐⭐"
        );
      } else {
        setMessage(
          "The project can still succeed, but the client expected more."
        );
      }
    } else {
      setMessage(
        "That choice is too risky. Choose another option."
      );
    }
  }

  function continueStage() {
    if (!completed) {
      return;
    }

    setSelectedId(null);
    setScore(0);
    setCompleted(false);
    setMessage("");

    onStageComplete();
  }

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-slate-950 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
            {isSpecialized
              ? mission.category === "event"
                ? "Event Planner Gameplay"
                : "Interior Designer Gameplay"
              : "Business Contract Gameplay"}
          </p>

          <h3 className="mt-1 text-xl font-black">
            {STAGE_TITLES[stageIndex]}
          </h3>
        </div>

        <div className="rounded-full bg-slate-800 px-3 py-1 text-xs font-black text-slate-300">
          Stage {stageIndex + 1}/3
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-900 p-4">
        <p className="text-sm leading-6 text-slate-300">
          {mission.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-400">
            📍 {mission.location}
          </span>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-400">
            👤 {mission.client}
          </span>

          {isSpecialized && (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              🎯 Specialized Mission
            </span>
          )}
        </div>
      </div>

      {mission.category === "event" && (
        <div className="mt-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-purple-300">
            Event Objective
          </p>

          <p className="mt-2 text-sm text-slate-300">
            {stageIndex === 0 &&
              "Choose the venue that best matches the client's event."}

            {stageIndex === 1 &&
              "Choose vendors that can deliver the quality the client expects."}

            {stageIndex === 2 &&
              "Choose a professional team to keep guests happy and the event running smoothly."}
          </p>
        </div>
      )}

      {mission.category === "interior" && (
        <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-orange-300">
            Interior Objective
          </p>

          <p className="mt-2 text-sm text-slate-300">
            {stageIndex === 0 &&
              "Choose a design direction that matches a premium Abuja property."}

            {stageIndex === 1 &&
              "Select furniture that balances comfort, quality and prestige."}

            {stageIndex === 2 &&
              "Add finishing touches that make the completed room feel premium."}
          </p>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-3 text-sm font-bold text-slate-300">
          Make your decision:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {shuffledChoices.map((choice) => {
            const isSelected =
              selectedId === choice.id;

            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleChoice(choice)}
                disabled={completed}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? completed
                      ? "border-emerald-400 bg-emerald-500/15"
                      : "border-amber-400 bg-amber-500/10"
                    : "border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                <div className="text-2xl">
                  {choice.emoji}
                </div>

                <p className="mt-2 text-sm font-bold">
                  {choice.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${
            completed
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          {message}
        </div>
      )}

      {completed && (
        <div className="mt-4 rounded-2xl bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Decision Score
            </span>

            <span className="text-lg font-black text-emerald-400">
              {score}/30
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (score / 30) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!completed}
        onClick={continueStage}
        className={`mt-4 w-full rounded-xl px-5 py-3 font-black transition ${
          completed
            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            : "cursor-not-allowed bg-slate-800 text-slate-600"
        }`}
      >
        {stageIndex === 2
          ? "Finish Final Stage"
          : "Continue to Next Stage →"}
      </button>
    </div>
  );
}