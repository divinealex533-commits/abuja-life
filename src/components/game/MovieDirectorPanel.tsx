"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  MOVIE_PROJECTS,
  MovieAction,
  MovieDifficulty,
  MovieProject,
  MovieScenario,
  calculateMovieResult,
  getMovieActionOutcome,
  getMovieProductionDuration,
  getRandomMovieScenario,
} from "@/lib/game/movieDirector";
import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";

interface MovieDirectorPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<
    React.SetStateAction<PlayerGameState | null>
  >;
}

type Screen =
  | "studio"
  | "projects"
  | "briefing"
  | "production"
  | "result";

const ACTIONS: {
  id: MovieAction;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "cast",
    label: "Cast",
    icon: "🎭",
    description: "Choose the right talent for the production.",
  },
  {
    id: "shoot",
    label: "Shoot",
    icon: "🎥",
    description: "Push production forward and capture the scene.",
  },
  {
    id: "retake",
    label: "Retake",
    icon: "🔁",
    description: "Spend more budget to improve a bad take.",
  },
  {
    id: "direct",
    label: "Direct",
    icon: "🎬",
    description: "Take control and direct the scene.",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "📢",
    description: "Build hype and attract an audience.",
  },
  {
    id: "protect",
    label: "Protect",
    icon: "🛡️",
    description: "Protect the production from major losses.",
  },
  {
    id: "premiere",
    label: "Premiere",
    icon: "🍿",
    description: "Launch the finished movie.",
  },
];

const DIFFICULTY_LABELS: Record<
  MovieDifficulty,
  string
> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  extreme: "Extreme",
};

function formatMoney(value: number) {
  return `₦${Math.max(0, Math.round(value)).toLocaleString()}`;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function difficultyColor(
  difficulty: MovieDifficulty
) {
  switch (difficulty) {
    case "easy":
      return "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";

    case "medium":
      return "text-yellow-300 bg-yellow-400/10 border-yellow-400/20";

    case "hard":
      return "text-orange-300 bg-orange-400/10 border-orange-400/20";

    case "extreme":
      return "text-red-300 bg-red-400/10 border-red-400/20";
  }
}

function scenarioIcon(type: MovieScenario["type"]) {
  switch (type) {
    case "casting":
      return "🎭";

    case "production":
      return "🎥";

    case "actor":
      return "😤";

    case "budget":
      return "💰";

    case "viral":
      return "🔥";

    case "marketing":
      return "📢";

    case "problem":
      return "⚠️";

    case "premiere":
      return "🍿";

    case "award":
      return "🏆";

    default:
      return "🎬";
  }
}

export default function MovieDirectorPanel({
  player,
  setPlayer,
}: MovieDirectorPanelProps) {
  const [screen, setScreen] =
    useState<Screen>("studio");

  const [selectedProject, setSelectedProject] =
    useState<MovieProject | null>(null);

  const [currentScenario, setCurrentScenario] =
    useState<MovieScenario | null>(null);

  const [usedScenarioIds, setUsedScenarioIds] =
    useState<string[]>([]);

  const [timeLeft, setTimeLeft] = useState(120);

  const [score, setScore] = useState(0);
  const [movieQuality, setMovieQuality] =
    useState(25);
  const [audienceHype, setAudienceHype] =
    useState(10);

  const [productionBudget, setProductionBudget] =
    useState(0);

  const [productionBudgetUsed, setProductionBudgetUsed] =
    useState(0);

  const [scenesCompleted, setScenesCompleted] =
    useState(0);

  const [successfulDecisions, setSuccessfulDecisions] =
    useState(0);

  const [failedDecisions, setFailedDecisions] =
    useState(0);

  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
    cash: number;
  } | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [result, setResult] =
    useState<ReturnType<
      typeof calculateMovieResult
    > | null>(null);

  const [festivalAlert, setFestivalAlert] =
    useState(false);

  const productionProgress = useMemo(() => {
    if (!selectedProject) return 0;

    return Math.min(
      100,
      Math.round(
        (scenesCompleted /
          selectedProject.productionDays) *
          100
      )
    );
  }, [scenesCompleted, selectedProject]);

  const startProject = (project: MovieProject) => {
    setSelectedProject(project);
    setProductionBudget(project.startingBudget);

    setMovieQuality(25);
    setAudienceHype(10);
    setScore(0);

    setProductionBudgetUsed(0);
    setScenesCompleted(0);

    setSuccessfulDecisions(0);
    setFailedDecisions(0);

    setUsedScenarioIds([]);
    setFeedback(null);
    setResult(null);
    setFestivalAlert(false);

    setScreen("briefing");
  };

  const beginProduction = () => {
    if (!selectedProject) return;

    const firstScenario =
      getRandomMovieScenario();

    setCurrentScenario(firstScenario);
    setUsedScenarioIds([firstScenario.id]);

    setTimeLeft(
      getMovieProductionDuration(
        selectedProject.difficulty
      )
    );

    setScreen("production");
  };

  const finishProduction = () => {
    if (!selectedProject || screen !== "production") {
      return;
    }

    const finalResult = calculateMovieResult({
      project: selectedProject,
      score,
      movieQuality,
      audienceHype,
      scenesCompleted,
      successfulDecisions,
      failedDecisions,
      productionBudgetUsed,
      elapsedSeconds:
        getMovieProductionDuration(
          selectedProject.difficulty
        ) - timeLeft,
    });

    setResult(finalResult);
    setFestivalAlert(finalResult.awardChance >= 70);
    setScreen("result");
  };

  useEffect(() => {
    if (screen !== "production") return;

    if (timeLeft <= 0) {
      finishProduction();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((value) =>
        Math.max(0, value - 1)
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, timeLeft]);

  const handleAction = (
    action: MovieAction
  ) => {
    if (
      !currentScenario ||
      !selectedProject ||
      processing ||
      timeLeft <= 0
    ) {
      return;
    }

    setProcessing(true);

    const outcome = getMovieActionOutcome(
      currentScenario,
      action
    );

    setScore((value) => value + outcome.score);

    setProductionBudget((value) =>
      Math.max(
        0,
        value + outcome.budgetImpact
      )
    );

    setProductionBudgetUsed((value) =>
      Math.max(
        0,
        value + Math.max(0, -outcome.budgetImpact)
      )
    );

    setMovieQuality((value) =>
      Math.max(
        0,
        Math.min(
          100,
          value + outcome.qualityImpact
        )
      )
    );

    setAudienceHype((value) =>
      Math.max(
        0,
        Math.min(
          100,
          value + outcome.hypeImpact
        )
      )
    );

    if (outcome.correct) {
      setSuccessfulDecisions(
        (value) => value + 1
      );
    } else {
      setFailedDecisions(
        (value) => value + 1
      );
    }

    if (
      currentScenario.type === "production" ||
      currentScenario.type === "casting" ||
      currentScenario.type === "actor"
    ) {
      setScenesCompleted((value) =>
        Math.min(
          selectedProject.productionDays,
          value + (outcome.correct ? 1 : 0)
        )
      );
    }

    setFeedback({
      correct: outcome.correct,
      message: outcome.message,
      cash: outcome.cash,
    });

    if (
      outcome.correct &&
      currentScenario.type === "viral"
    ) {
      setAudienceHype((value) =>
        Math.min(100, value + 10)
      );
    }

    window.setTimeout(() => {
      const next =
        getRandomMovieScenario([
          ...usedScenarioIds,
          currentScenario.id,
        ]);

      setUsedScenarioIds((ids) => [
        ...ids,
        next.id,
      ]);

      setCurrentScenario(next);

      setFeedback(null);
      setProcessing(false);
    }, 1200);
  };

  const collectRewards = async () => {
    if (!result) return;

    const nextPlayer: PlayerGameState = {
      ...player,
      cash: player.cash + result.cash,
      reputation:
        player.reputation + result.reputation,
      energy: Math.max(0, player.energy - 22),
      currentJobId: "movie-director",
      jobExperience:
        player.jobExperience + result.score,
    };

    setPlayer(nextPlayer);

    await savePersistentPlayerState(
      nextPlayer
    );

    setScreen("studio");
    setSelectedProject(null);
    setCurrentScenario(null);
  };

  if (screen === "studio") {
    return (
      <main className="min-h-screen bg-[#070709] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-950/60 via-[#111016] to-black shadow-2xl">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />

            <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.4fr_0.6fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-purple-300">
                  🎬 Abuja Life • Entertainment
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
                  Movie Director
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
                  Build your own movie, manage the production,
                  make difficult decisions, create hype and
                  try to turn your project into Abuja's next
                  blockbuster.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      setScreen("projects")
                    }
                    disabled={player.energy < 22}
                    className="rounded-2xl bg-purple-500 px-6 py-3.5 font-black text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02] hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    🎥 Start New Movie
                  </button>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/35">
                      Energy
                    </div>
                    <div className="mt-1 font-black">
                      {player.energy} /{" "}
                      {player.maxEnergy} ⚡
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="text-xs font-black uppercase tracking-widest text-white/35">
                  Director Profile
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/15 text-3xl">
                    🎬
                  </div>

                  <div>
                    <div className="font-black">
                      Divine Studios
                    </div>

                    <div className="text-sm text-white/40">
                      Abuja, Nigeria
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-[10px] uppercase text-white/35">
                      Cash
                    </div>

                    <div className="mt-1 font-black">
                      {formatMoney(player.cash)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-[10px] uppercase text-white/35">
                      Experience
                    </div>

                    <div className="mt-1 font-black">
                      {player.jobExperience}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              [
                "🎭",
                "Cast",
                "Build the right team.",
              ],
              [
                "🎥",
                "Produce",
                "Shoot scenes and manage problems.",
              ],
              [
                "🍿",
                "Premiere",
                "Turn hype into box-office money.",
              ],
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="text-2xl">
                  {icon}
                </div>

                <div className="mt-4 font-black">
                  {title}
                </div>

                <div className="mt-1 text-sm text-white/40">
                  {text}
                </div>
              </div>
            ))}
          </section>

          <div className="mt-6 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.04] p-5">
            <div className="flex gap-3">
              <div className="text-xl">💡</div>

              <div>
                <div className="font-black text-yellow-200">
                  Director Tip
                </div>

                <p className="mt-1 text-sm leading-6 text-white/50">
                  A great movie needs more than good scenes.
                  Balance quality, audience hype and your
                  production budget if you want a blockbuster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "projects") {
    return (
      <main className="min-h-screen bg-[#070709] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">
                Production Studio
              </div>

              <h1 className="mt-2 text-3xl font-black sm:text-5xl">
                Choose Your Movie
              </h1>

              <p className="mt-2 text-white/45">
                Bigger projects can make more money, but they
                also come with bigger risks.
              </p>
            </div>

            <button
              onClick={() => setScreen("studio")}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white"
            >
              ← Back
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {MOVIE_PROJECTS.map((project) => (
              <button
                key={project.id}
                onClick={() =>
                  startProject(project)
                }
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-left transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-purple-400/[0.04]"
              >
                <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-purple-950/60 via-black to-blue-950/40 text-7xl">
                  <span className="transition duration-300 group-hover:scale-110">
                    {project.emoji}
                  </span>

                  <div
                    className={`absolute right-4 top-4 rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${difficultyColor(
                      project.difficulty
                    )}`}
                  >
                    {
                      DIFFICULTY_LABELS[
                        project.difficulty
                      ]
                    }
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-bold uppercase tracking-widest text-purple-300">
                    {project.genre}
                  </div>

                  <h2 className="mt-2 text-2xl font-black">
                    {project.title}
                  </h2>

                  <p className="mt-2 min-h-[72px] text-sm leading-6 text-white/45">
                    {project.description}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 p-3">
                      <div className="text-[9px] uppercase text-white/30">
                        Budget
                      </div>

                      <div className="mt-1 text-sm font-black">
                        {formatMoney(
                          project.startingBudget
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <div className="text-[9px] uppercase text-white/30">
                        Potential
                      </div>

                      <div className="mt-1 text-sm font-black text-emerald-300">
                        {formatMoney(
                          project.expectedRevenue
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-white/35">
                    <span>
                      🎥 {project.productionDays} scenes
                    </span>

                    <span className="font-black text-purple-300">
                      Select →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (
    screen === "briefing" &&
    selectedProject
  ) {
    return (
      <main className="min-h-screen bg-[#070709] text-white">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8">
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0c11] shadow-2xl">
            <div className="bg-gradient-to-br from-purple-500/15 to-transparent p-6 sm:p-10">
              <div className="text-7xl">
                {selectedProject.emoji}
              </div>

              <div className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-purple-300">
                Production Brief
              </div>

              <h1 className="mt-2 text-4xl font-black sm:text-6xl">
                {selectedProject.title}
              </h1>

              <div className="mt-2 text-lg font-bold text-white/40">
                {selectedProject.genre}
              </div>

              <p className="mt-5 max-w-2xl leading-7 text-white/55">
                {selectedProject.description}
              </p>
            </div>

            <div className="grid gap-px border-y border-white/10 bg-white/10 sm:grid-cols-4">
              {[
                [
                  "Budget",
                  formatMoney(
                    selectedProject.startingBudget
                  ),
                ],
                [
                  "Potential",
                  formatMoney(
                    selectedProject.expectedRevenue
                  ),
                ],
                [
                  "Scenes",
                  selectedProject.productionDays,
                ],
                [
                  "Difficulty",
                  DIFFICULTY_LABELS[
                    selectedProject.difficulty
                  ],
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-[#0d0c11] p-5"
                >
                  <div className="text-[9px] uppercase tracking-widest text-white/30">
                    {label}
                  </div>

                  <div className="mt-2 font-black">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 p-6 sm:flex-row sm:justify-end sm:p-8">
              <button
                onClick={() =>
                  setScreen("projects")
                }
                className="rounded-2xl border border-white/10 px-5 py-3 font-bold text-white/60 hover:bg-white/5 hover:text-white"
              >
                Change Movie
              </button>

              <button
                onClick={beginProduction}
                className="rounded-2xl bg-purple-500 px-7 py-3 font-black hover:bg-purple-400"
              >
                Start Production 🎬
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (
    screen === "production" &&
    selectedProject &&
    currentScenario
  ) {
    return (
      <main className="min-h-screen bg-[#050507] text-white">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
          <header className="mb-4 rounded-2xl border border-white/10 bg-[#0d0c11] p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
                  🎬 Production • {selectedProject.title}
                </div>

                <div className="mt-1 text-xl font-black">
                  Director's Chair
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-xl bg-white/5 px-4 py-2">
                  <div className="text-[9px] uppercase text-white/30">
                    Time
                  </div>

                  <div
                    className={`font-black ${
                      timeLeft <= 20
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="rounded-xl bg-white/5 px-4 py-2">
                  <div className="text-[9px] uppercase text-white/30">
                    Budget
                  </div>

                  <div className="font-black text-emerald-300">
                    {formatMoney(
                      productionBudget
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-white/5 px-4 py-2">
                  <div className="text-[9px] uppercase text-white/30">
                    Score
                  </div>

                  <div className="font-black text-purple-300">
                    {score}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-white/30">
                  <span>Production</span>
                  <span>
                    {productionProgress}%
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: `${productionProgress}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-white/30">
                  <span>Quality</span>
                  <span>{movieQuality}%</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-all duration-500"
                    style={{
                      width: `${movieQuality}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-white/30">
                  <span>Audience Hype</span>
                  <span>{audienceHype}%</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-pink-400 transition-all duration-500"
                    style={{
                      width: `${audienceHype}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-[1fr_310px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c0b10] shadow-2xl">
              <div className="border-b border-white/10 p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-white/30">
                      Current Production Event
                    </div>

                    <h1 className="mt-2 text-2xl font-black sm:text-4xl">
                      {currentScenario.title}
                    </h1>
                  </div>

                  <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-purple-300">
                    {scenarioIcon(
                      currentScenario.type
                    )}{" "}
                    {currentScenario.type}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/30 via-black to-blue-950/20 p-6 sm:p-8">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-5xl shadow-inner">
                    {scenarioIcon(
                      currentScenario.type
                    )}
                  </div>

                  <h2 className="mt-6 text-2xl font-black">
                    {currentScenario.title}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                    {currentScenario.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <span
                      className={`rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${difficultyColor(
                        currentScenario.difficulty
                      )}`}
                    >
                      {
                        DIFFICULTY_LABELS[
                          currentScenario.difficulty
                        ]
                      }
                    </span>

                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/40">
                      Reward{" "}
                      {formatMoney(
                        currentScenario.reward
                      )}
                    </span>
                  </div>
                </div>

                {feedback && (
                  <div
                    className={`mt-5 rounded-2xl border p-5 ${
                      feedback.correct
                        ? "border-emerald-400/20 bg-emerald-400/10"
                        : "border-red-400/20 bg-red-400/10"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl">
                        {feedback.correct
                          ? "🎬"
                          : "⚠️"}
                      </div>

                      <div>
                        <div className="font-black">
                          {feedback.correct
                            ? "Great Direction"
                            : "Production Mistake"}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-white/55">
                          {feedback.message}
                        </p>

                        <div
                          className={`mt-2 text-sm font-black ${
                            feedback.cash >= 0
                              ? "text-emerald-300"
                              : "text-red-300"
                          }`}
                        >
                          {feedback.cash >= 0
                            ? "+"
                            : ""}
                          {formatMoney(
                            feedback.cash
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-7">
                  <div className="mb-3 text-xs font-black uppercase tracking-widest text-white/30">
                    Director Decision
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() =>
                          handleAction(action.id)
                        }
                        disabled={processing}
                        className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-purple-400/30 hover:bg-purple-400/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <div className="text-2xl transition group-hover:scale-110">
                          {action.icon}
                        </div>

                        <div className="mt-3 font-black">
                          {action.label}
                        </div>

                        <div className="mt-1 text-xs leading-5 text-white/35">
                          {action.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-[#0c0b10] p-5">
                <div className="text-xs font-black uppercase tracking-widest text-white/30">
                  Production Dashboard
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/40">
                      Scenes
                    </span>

                    <span className="font-black">
                      {scenesCompleted}/
                      {selectedProject.productionDays}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/40">
                      Quality
                    </span>

                    <span className="font-black text-blue-300">
                      {movieQuality}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/40">
                      Hype
                    </span>

                    <span className="font-black text-pink-300">
                      {audienceHype}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/40">
                      Correct
                    </span>

                    <span className="font-black text-emerald-300">
                      {successfulDecisions}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/40">
                      Mistakes
                    </span>

                    <span className="font-black text-red-300">
                      {failedDecisions}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-yellow-400/10 bg-yellow-400/[0.035] p-5">
                <div className="flex items-center gap-2">
                  <span>🎥</span>

                  <span className="text-xs font-black uppercase tracking-widest text-yellow-300">
                    Studio Note
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  Don't burn the entire budget chasing perfection.
                  A successful director knows when to retake a
                  scene and when to move forward.
                </p>
              </div>

              <button
                onClick={finishProduction}
                disabled={processing}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                Finish Production
              </button>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "result" && result) {
    return (
      <main className="min-h-screen bg-[#070709] text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0c11] shadow-2xl">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/10 p-6 text-center sm:p-10">
              <div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-purple-500/15 blur-3xl" />

              <div className="relative">
                <div className="text-6xl">
                  {result.rating >= 4.5
                    ? "🏆"
                    : result.rating >= 3.8
                      ? "🎬"
                      : "🍿"}
                </div>

                <div className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-purple-300">
                  Premiere Complete
                </div>

                <h1 className="mt-3 text-4xl font-black sm:text-6xl">
                  {result.rank}
                </h1>

                <p className="mx-auto mt-3 max-w-2xl text-white/50">
                  {result.message}
                </p>

                {festivalAlert && (
                  <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-4">
                    <div className="font-black text-yellow-200">
                      🏆 Awards Buzz!
                    </div>

                    <div className="mt-1 text-sm text-white/50">
                      Your movie has a strong chance of
                      receiving major recognition.
                    </div>
                  </div>
                )}

                <div className="mx-auto mt-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-purple-400/20 bg-purple-400/10">
                  <div>
                    <div className="text-3xl font-black">
                      {result.rating}
                    </div>

                    <div className="text-[9px] uppercase tracking-widest text-white/40">
                      Rating
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-y border-white/10 bg-white/10 sm:grid-cols-4">
              {[
                [
                  "Quality",
                  `${result.movieQuality}%`,
                ],
                [
                  "Audience Hype",
                  `${result.audienceHype}%`,
                ],
                [
                  "Box Office",
                  formatMoney(result.boxOffice),
                ],
                [
                  "Award Chance",
                  `${result.awardChance}%`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-[#0d0c11] p-5 text-center"
                >
                  <div className="text-xl font-black sm:text-2xl">
                    {value}
                  </div>

                  <div className="mt-1 text-[9px] uppercase tracking-wider text-white/30">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/30">
                  Director Earnings
                </div>

                <div className="mt-2 text-3xl font-black text-emerald-300">
                  +{formatMoney(result.cash)}
                </div>
              </div>

              <div className="rounded-2xl border border-purple-400/15 bg-purple-400/[0.06] p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/30">
                  Experience
                </div>

                <div className="mt-2 text-3xl font-black text-purple-300">
                  +{result.score}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.06] p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/30">
                  Reputation
                </div>

                <div className="mt-2 text-3xl font-black text-blue-300">
                  +{result.reputation}
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2 sm:px-8 sm:pb-8">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/35">
                  Scenes Completed
                </div>

                <div className="mt-1 font-black">
                  {result.scenesCompleted}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs text-white/35">
                  Production Budget Used
                </div>

                <div className="mt-1 font-black">
                  {formatMoney(
                    result.productionBudgetUsed
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-end sm:p-8">
              <button
                onClick={() => {
                  setScreen("projects");
                  setResult(null);
                }}
                className="rounded-2xl border border-white/10 px-6 py-3 font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                Make Another Movie
              </button>

              <button
                onClick={collectRewards}
                className="rounded-2xl bg-purple-500 px-7 py-3 font-black text-white transition hover:bg-purple-400"
              >
                Collect ₦
                {result.cash.toLocaleString()} →
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
