"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import TaxiMissionPanel from "@/components/game/TaxiMissionPanel";

import {
  JOBS,
  JobCategory,
} from "@/lib/game/jobs";

import {
  PlayerGameState,
  applyJob,
  savePersistentPlayerState,
} from "@/lib/game/player";

import {
  loadPlayerState,
  savePlayerState,
} from "@/lib/game/playerStorage";

import {
  JOB_MISSIONS,
  JobMission,
} from "@/lib/game/jobMissions";

import {
  ActiveMission,
  advanceMission,
  finishMission,
  getMissionProgressPercent,
  isMissionComplete,
  startMission,
} from "@/lib/game/mission";

import {
  TAXI_MISSIONS,
  TaxiMission,
} from "@/lib/game/taxi";

const categories: Array<"all" | JobCategory> = [
  "all",
  "transport",
  "food",
  "business",
  "creative",
  "technology",
  "service",
  "media",
];

const categoryLabels: Record<string, string> = {
  all: "All Jobs",
  transport: "Transport",
  food: "Food",
  business: "Business",
  creative: "Creative",
  technology: "Technology",
  service: "Service",
  media: "Media",
};

const categoryIcons: Record<string, string> = {
  transport: "🚗",
  food: "🍔",
  business: "🏪",
  creative: "🎨",
  technology: "💻",
  service: "🛠️",
  media: "📰",
};

const difficultyColors: Record<string, string> = {
  easy: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  medium: "text-yellow-300 bg-yellow-400/10 border-yellow-400/20",
  hard: "text-red-300 bg-red-400/10 border-red-400/20",
};

const missionStages = [
  {
    title: "Find the passenger",
    description:
      "Drive to the pickup point and locate your passenger.",
    icon: "📍",
  },
  {
    title: "Pick up passenger",
    description:
      "Collect the passenger and prepare for the trip.",
    icon: "🚕",
  },
  {
    title: "Drive through Abuja",
    description:
      "Navigate through the city and avoid losing time.",
    icon: "🛣️",
  },
  {
    title: "Complete the drop-off",
    description:
      "Get your passenger safely to the destination.",
    icon: "🏁",
  },
];

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<"all" | JobCategory>("all");

  const [search, setSearch] = useState("");

  const [selectedJobId, setSelectedJobId] =
    useState<string | null>(null);

  const [player, setPlayer] =
  useState<PlayerGameState>(() => loadPlayerState());

  useEffect(() => {
  savePlayerState(player);
}, [player]);

  const [shiftActive, setShiftActive] =
    useState(false);

    const [taxiMissionActive, setTaxiMissionActive] =
  useState(false);

const [selectedTaxiMissionId, setSelectedTaxiMissionId] =
  useState<string | null>(null);

  const [selectedMissionId, setSelectedMissionId] =
    useState<string | null>(null);

  const [activeMission, setActiveMission] =
    useState<ActiveMission | null>(null);

  const [missionMessage, setMissionMessage] =
    useState<string | null>(null);

  const [missionCompleted, setMissionCompleted] =
    useState(false);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return JOBS.filter((job) => {
      const matchesCategory =
        selectedCategory === "all" ||
        job.category === selectedCategory;

      const matchesSearch =
        !normalizedSearch ||
        [
          job.name,
          job.description,
          job.category,
          ...job.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  const selectedJob = selectedJobId
    ? JOBS.find((job) => job.id === selectedJobId)
    : null;

  const currentJob = player.currentJobId
    ? JOBS.find((job) => job.id === player.currentJobId)
    : null;

  const currentJobMissions = useMemo(() => {
  if (!player.currentJobId) {
    return [];
  }

  const currentJob = JOBS.find(
    (job) => job.id === player.currentJobId
  );

  if (!currentJob) {
    return [];
  }

  const normalizeJobId = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[_\s]+/g, "-");

  const currentJobId = normalizeJobId(currentJob.id);
  const currentJobName = normalizeJobId(currentJob.name);

  return JOB_MISSIONS.filter((mission) => {
    const missionJobId = normalizeJobId(mission.jobId);

    return (
      missionJobId === currentJobId ||
      missionJobId === currentJobName
    );
  });
}, [player.currentJobId]);

  const selectedMission = selectedMissionId
    ? JOB_MISSIONS.find(
        (mission) => mission.id === selectedMissionId
      )
    : null;

  const activeMissionData = activeMission
    ? JOB_MISSIONS.find(
        (mission) => mission.id === activeMission.missionId
      )
    : null;

  const missionProgress = activeMission
    ? getMissionProgressPercent(activeMission)
    : 0;

  const currentStage = activeMission
    ? Math.min(
        activeMission.progress,
        missionStages.length - 1
      )
    : 0;

  function handleStartMission(mission: JobMission) {
    const started = startMission(player, mission);

    if (!started) {
      setMissionMessage(
        "You do not have enough energy for this mission."
      );
      return;
    }

    setSelectedMissionId(null);
    setMissionCompleted(false);
    setMissionMessage(null);
    setActiveMission(started);
  }

  const selectedTaxiMission = useMemo(() => {
  if (!selectedTaxiMissionId) {
    return null;
  }

  return (
    TAXI_MISSIONS.find(
      (mission) => mission.id === selectedTaxiMissionId
    ) ?? null
  );
}, [selectedTaxiMissionId]);

function startTaxiMission(mission: TaxiMission) {
  if (player.energy < 20) {
    setMissionMessage(
      "You do not have enough energy to start this taxi trip."
    );
    return;
  }

  setSelectedTaxiMissionId(mission.id);
  setTaxiMissionActive(true);
  setMissionMessage("");
}

function handleTaxiComplete(result: {
  fare: number;
  tip: number;
  reputation: number;
  satisfaction: number;
  energyCost: number;
  message: string;
}) {
  if (player.energy < result.energyCost) {
    setMissionMessage(
      "You ran out of energy before completing the trip."
    );
    return;
  }

  const updatedPlayer: PlayerGameState = {
    ...player,
    cash: player.cash + result.fare + result.tip,
    energy: Math.max(
      0,
      player.energy - result.energyCost
    ),
    reputation:
      player.reputation + result.reputation,
    jobExperience: player.jobExperience + 1,
  };

  setPlayer(updatedPlayer);
  savePlayerState(updatedPlayer);

  setTaxiMissionActive(false);
  setSelectedTaxiMissionId(null);

  setMissionMessage(
    `${result.message} You earned ₦${(
      result.fare + result.tip
    ).toLocaleString()} total.`
  );
}

  function handleAdvanceMission() {
    if (!activeMission) {
      return;
    }

    if (isMissionComplete(activeMission)) {
      return;
    }

    const nextMission = advanceMission(activeMission);

    setActiveMission(nextMission);

    if (isMissionComplete(nextMission)) {
      setMissionMessage(
        "You reached the destination. Complete the mission to collect your reward."
      );
    } else {
      setMissionMessage(null);
    }
  }

  function handleFinishMission() {
    if (!activeMission || !activeMissionData) {
      return;
    }

    if (!isMissionComplete(activeMission)) {
      return;
    }

    if (missionCompleted) {
      return;
    }

    const result = finishMission(
      player,
      activeMissionData
    );

    setPlayer(result.player);
    setMissionCompleted(true);
    setMissionMessage(result.message);
  }

  function handleCloseMission() {
    setActiveMission(null);
    setMissionMessage(null);
    setMissionCompleted(false);
  }

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      {/* HEADER */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07110f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-xl font-black tracking-tight">
              ABUJA <span className="text-emerald-400">LIFE</span>
            </div>

            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Your city. Your story.
            </div>
          </div>

          <Link
            href="/game"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold transition hover:border-emerald-400/30 hover:bg-emerald-400/10"
          >
            ← Back to Game
          </Link>
        </div>
      </nav>

      {/* PAGE HEADER */}
      <section className="mx-auto max-w-7xl px-4 pt-10">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-[#10201c] to-cyan-500/10 p-6 md:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
              Abuja Careers
            </div>

            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
              Find Your Job.
              <br />
              <span className="text-emerald-400">
                Build Your Life.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
              Choose a career, earn virtual ₦, build your reputation
              and work your way up through Abuja.
            </p>
          </div>

          {/* PLAYER STATS */}
          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/40">
                CASH
              </div>

              <div className="mt-1 text-xl font-black text-emerald-300">
                ₦{player.cash.toLocaleString()}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/40">
                ENERGY
              </div>

              <div className="mt-1 text-xl font-black">
                ⚡ {player.energy}/{player.maxEnergy}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/40">
                CURRENT JOB
              </div>

              <div className="mt-1 font-bold">
                {currentJob?.name ?? "Unemployed"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/40">
                REPUTATION
              </div>

              <div className="mt-1 font-bold">
                {player.reputation === 0
                  ? "Newcomer"
                  : player.reputation}
              </div>
            </div>
          </div>

          {/* CURRENT JOB */}
          {currentJob && (
            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Your Current Career
                  </div>

                  <div className="mt-1 text-xl font-black">
                    {categoryIcons[currentJob.category]}{" "}
                    {currentJob.name}
                  </div>

                  <div className="mt-1 text-sm text-white/50">
                    {shiftActive
                      ? "Your shift is active. Choose a mission below."
                      : "Start your shift to receive available missions."}
                  </div>
                </div>

                {!shiftActive ? (
                  <button
                    onClick={() => setShiftActive(true)}
                    className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-black text-black transition hover:bg-emerald-300"
                  >
                    START SHIFT →
                  </button>
                ) : (
                  <button
                    onClick={() => setShiftActive(false)}
                    className="rounded-2xl border border-red-400/20 bg-red-400/10 px-6 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/20"
                  >
                    END SHIFT
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ACTIVE MISSION */}
      {activeMission && activeMissionData && (
        <section className="mx-auto max-w-7xl px-4 pt-8">
          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-white/[0.03] to-emerald-400/10 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                  Active Mission
                </div>

                <h2 className="mt-2 text-3xl font-black">
                  {activeMissionData.title}
                </h2>

                <div className="mt-2 text-sm text-white/50">
                  {activeMissionData.pickupLocation} →{" "}
                  {activeMissionData.destination}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 px-4 py-3 text-right">
                <div className="text-xs text-white/30">
                  PROGRESS
                </div>

                <div className="text-2xl font-black text-cyan-300">
                  {missionProgress}%
                </div>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-7">
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{
                    width: `${missionProgress}%`,
                  }}
                />
              </div>
            </div>

            {/* CURRENT STAGE */}
            {!missionCompleted && (
              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-4xl">
                  {missionStages[currentStage].icon}
                </div>

                <div className="mt-3 text-xl font-black">
                  {missionStages[currentStage].title}
                </div>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  {missionStages[currentStage].description}
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-white/40">
                    Step {Math.min(
                      activeMission.progress + 1,
                      activeMission.totalSteps
                    )}{" "}
                    of {activeMission.totalSteps}
                  </div>

                  {!isMissionComplete(activeMission) ? (
                    <button
                      onClick={handleAdvanceMission}
                      className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-black text-black transition hover:bg-emerald-300"
                    >
                      {activeMission.progress === 0
                        ? "FIND PASSENGER →"
                        : activeMission.progress === 1
                        ? "START DRIVING →"
                        : activeMission.progress === 2
                        ? "CONTINUE TO DESTINATION →"
                        : "ARRIVE AT DESTINATION →"}
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishMission}
                      className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-black transition hover:bg-cyan-300"
                    >
                      COMPLETE MISSION → ₦
                      {activeMissionData.reward.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* COMPLETED */}
            {missionCompleted && (
              <div className="mt-7 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-center">
                <div className="text-5xl">🎉</div>

                <h3 className="mt-3 text-2xl font-black text-emerald-300">
                  Mission Completed!
                </h3>

                <p className="mt-2 text-sm text-white/60">
                  {missionMessage}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-[10px] text-white/30">
                      CASH
                    </div>

                    <div className="mt-1 font-black text-emerald-300">
                      +₦
                      {activeMissionData.reward.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-[10px] text-white/30">
                      REP
                    </div>

                    <div className="mt-1 font-black">
                      +{activeMissionData.reputationGain}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-[10px] text-white/30">
                      XP
                    </div>

                    <div className="mt-1 font-black text-cyan-300">
                      +{activeMissionData.experienceGain}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCloseMission}
                  className="mt-6 rounded-2xl bg-white/10 px-6 py-3 text-sm font-black transition hover:bg-white/20"
                >
                  BACK TO SHIFT
                </button>
              </div>
            )}

            {missionMessage && !missionCompleted && (
              <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-200">
                {missionMessage}
              </div>
            )}
          </div>
        </section>
      )}

      {/* AVAILABLE MISSIONS */}
      {shiftActive && currentJob && !activeMission && (
        <section className="mx-auto max-w-7xl px-4 pt-8">
          <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 via-white/[0.03] to-cyan-400/5 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                  Shift Active
                </div>

{player.currentJobId === "taxi-driver" &&
  shiftActive &&
  !taxiMissionActive && (
    <section className="mb-8 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
      <div className="mb-5">
        <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
          🚕 Taxi Dispatch
        </div>

        <h2 className="mt-2 text-3xl font-black text-white">
          New passengers are waiting
        </h2>

        <p className="mt-2 text-white/60">
          Choose a passenger and start your next
          Abuja trip.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TAXI_MISSIONS.map((mission) => (
          <button
            key={mission.id}
            onClick={() => startTaxiMission(mission)}
            className="rounded-2xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-black text-white">
                  📍 {mission.pickup} →{" "}
                  {mission.destination}
                </div>

                <div className="mt-2 text-sm text-white/50">
                  Passenger: {mission.passenger}
                </div>
              </div>

              <div className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm font-black text-emerald-300">
                ₦{mission.baseFare.toLocaleString()}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                🚦 {mission.traffic} traffic
              </span>

              <span className="rounded-full bg-white/10 px-3 py-1 capitalize text-white/60">
                🎯 {mission.difficulty}
              </span>

              <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                🛣️ {mission.distanceKm} km
              </span>
            </div>

            <div className="mt-5 font-bold text-emerald-300">
              ACCEPT PASSENGER →
            </div>
          </button>
        ))}
      </div>
    </section>
  )}

  {taxiMissionActive && selectedTaxiMission && (
  <div className="mb-8">
    <TaxiMissionPanel
      mission={selectedTaxiMission}
      onComplete={handleTaxiComplete}
      onCancel={() => {
        setTaxiMissionActive(false);
        setSelectedTaxiMissionId(null);
      }}
    />
  </div>
)}

                <h2 className="mt-1 text-3xl font-black">
                  Available Missions
                </h2>

                <p className="mt-2 text-sm text-white/50">
                  Choose a mission and start working.
                </p>
              </div>

              <div className="text-xs text-white/40">
                {currentJobMissions.length} missions available
              </div>
            </div>

            {currentJobMissions.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
                <div className="text-3xl">📭</div>

                <div className="mt-3 font-bold">
                  No missions available
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {currentJobMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-emerald-400/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xl font-black">
                          {mission.title}
                        </div>

                        <div className="mt-1 text-xs text-white/40">
                          {mission.pickupLocation} →{" "}
                          {mission.destination}
                        </div>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                          difficultyColors[mission.difficulty]
                        }`}
                      >
                        {mission.difficulty}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-white/50">
                      {mission.description}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white/5 p-3">
                        <div className="text-[10px] text-white/30">
                          REWARD
                        </div>

                        <div className="mt-1 text-sm font-black text-emerald-300">
                          ₦{mission.reward.toLocaleString()}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3">
                        <div className="text-[10px] text-white/30">
                          ENERGY
                        </div>

                        <div className="mt-1 text-sm font-black">
                          {mission.energyCost}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3">
                        <div className="text-[10px] text-white/30">
                          XP
                        </div>

                        <div className="mt-1 text-sm font-black text-cyan-300">
                          +{mission.experienceGain}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedMissionId(mission.id)
                      }
                      className="mt-4 w-full rounded-xl bg-white/10 py-3 text-xs font-black transition hover:bg-emerald-400 hover:text-black"
                    >
                      VIEW MISSION →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SEARCH + FILTERS */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search jobs..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/40"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() =>
                setSelectedCategory(category)
              }
              className={`whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-bold transition ${
                selectedCategory === category
                  ? "border-emerald-400 bg-emerald-400 text-black"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {category !== "all" && (
                <span className="mr-1">
                  {categoryIcons[category]}
                </span>
              )}

              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </section>

      {/* JOB LIST */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
              Available Careers
            </div>

            <h2 className="mt-1 text-3xl font-black">
              Choose a career
            </h2>
          </div>

          <div className="text-xs text-white/40">
            {filteredJobs.length} jobs
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <div className="text-4xl">🔎</div>

            <h3 className="mt-4 text-xl font-black">
              No jobs found
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Try another search or category.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-emerald-400/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-3xl">
                      {categoryIcons[job.category]}
                    </div>

                    <div>
                      <h3 className="text-xl font-black">
                        {job.name}
                      </h3>

                      <div className="mt-1 text-xs uppercase tracking-wider text-white/30">
                        {categoryLabels[job.category]}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                      difficultyColors[job.difficulty]
                    }`}
                  >
                    {job.difficulty}
                  </span>
                </div>

                <p className="mt-5 text-sm leading-6 text-white/50">
                  {job.description}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-[10px] text-white/30">
                      START
                    </div>

                    <div className="mt-1 text-sm font-black text-emerald-300">
                      ₦{job.startingPay.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-[10px] text-white/30">
                      MAX
                    </div>

                    <div className="mt-1 text-sm font-black text-cyan-300">
                      ₦{job.maxPay.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-[10px] text-white/30">
                      ENERGY
                    </div>

                    <div className="mt-1 text-sm font-black">
                      {job.energyCost}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-white/40">
                    +{job.reputationGain} reputation
                  </div>

                  <button
                    onClick={() =>
                      setSelectedJobId(job.id)
                    }
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-black transition hover:bg-emerald-300"
                  >
                    VIEW JOB →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1815] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl">
                  {categoryIcons[selectedJob.category]}
                </div>

                <h2 className="mt-3 text-3xl font-black">
                  {selectedJob.name}
                </h2>

                <div className="mt-1 text-xs uppercase tracking-widest text-emerald-300">
                  {categoryLabels[selectedJob.category]}
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedJobId(null)
                }
                className="rounded-xl bg-white/5 px-3 py-2 text-white/60 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-white/60">
              {selectedJob.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/30">
                  STARTING PAY
                </div>

                <div className="mt-1 text-xl font-black text-emerald-300">
                  ₦{selectedJob.startingPay.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/30">
                  MAX PAY
                </div>

                <div className="mt-1 text-xl font-black text-cyan-300">
                  ₦{selectedJob.maxPay.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/30">
                  ENERGY COST
                </div>

                <div className="mt-1 text-xl font-black">
                  {selectedJob.energyCost}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/30">
                  REPUTATION
                </div>

                <div className="mt-1 text-xl font-black">
                  +{selectedJob.reputationGain}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/30">
                JOB SKILLS
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {selectedJob.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              className="mt-6 w-full rounded-2xl bg-emerald-400 py-4 font-black text-black transition hover:bg-emerald-300"
              onClick={async () => {
  const updatedPlayer = applyJob(
    player,
    selectedJob.id
  );

  setPlayer(updatedPlayer);
  savePlayerState(updatedPlayer);

  const saved = await savePersistentPlayerState(
    updatedPlayer
  );

  if (!saved) {
    setMissionMessage(
      "Your job could not be saved. Please try again."
    );
    return;
  }

  setShiftActive(false);
  setActiveMission(null);
  setSelectedJobId(null);

  if (selectedJob.id === "food-vendor") {
  window.location.href = "/jobs/food-vendor";
  return;
}

if (selectedJob.id === "shopkeeper") {
  window.location.href = "/jobs/shopkeeper";
  return;
}

if (selectedJob.id === "taxi-driver") {
  window.location.href = "/jobs/taxi-driver";
  return;
}

if (selectedJob.id === "delivery-rider") {
  window.location.href = "/jobs/delivery-rider";
  return;
}

if (selectedJob.id === "barber") {
  window.location.href = "/jobs/barber";
  return;
}  

 if (selectedJob.id === "fashion-designer") {
  window.location.href = "/jobs/fashion-designer";
  return;
}               
                
}}
            >
              APPLY FOR THIS JOB →
            </button>
          </div>
        </div>
      )}

      {/* MISSION DETAILS MODAL */}
      {selectedMission && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1815] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl">
                  🚕
                </div>

                <h2 className="mt-3 text-3xl font-black">
                  {selectedMission.title}
                </h2>

                <div className="mt-1 text-xs uppercase tracking-widest text-emerald-300">
                  {selectedMission.pickupLocation} →{" "}
                  {selectedMission.destination}
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedMissionId(null)
                }
                className="rounded-xl bg-white/5 px-3 py-2 text-white/60 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-white/60">
              {selectedMission.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/30">
                  MISSION REWARD
                </div>

                <div className="mt-1 text-xl font-black text-emerald-300">
                  ₦{selectedMission.reward.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/30">
                  ENERGY
                </div>

                <div className="mt-1 text-xl font-black">
                  {selectedMission.energyCost}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/30">
                  REPUTATION
                </div>

                <div className="mt-1 text-xl font-black">
                  +{selectedMission.reputationGain}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/30">
                  EXPERIENCE
                </div>

                <div className="mt-1 text-xl font-black text-cyan-300">
                  +{selectedMission.experienceGain} XP
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">
                  ESTIMATED TIME
                </span>

                <span className="font-bold">
                  {selectedMission.estimatedMinutes} min
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-white/40">
                  DIFFICULTY
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                    difficultyColors[
                      selectedMission.difficulty
                    ]
                  }`}
                >
                  {selectedMission.difficulty}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                handleStartMission(selectedMission)
              }
              disabled={
                player.energy <
                selectedMission.energyCost
              }
              className={`mt-6 w-full rounded-2xl py-4 font-black transition ${
                player.energy >=
                selectedMission.energyCost
                  ? "bg-emerald-400 text-black hover:bg-emerald-300"
                  : "cursor-not-allowed bg-white/10 text-white/30"
              }`}
            >
              {player.energy >=
              selectedMission.energyCost
                ? "START MISSION 🚕"
                : "NOT ENOUGH ENERGY"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
