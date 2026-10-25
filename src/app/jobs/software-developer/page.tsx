"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SoftwareDeveloperPanel from "@/components/game/SoftwareDeveloperPanel";
import {
  DEVELOPER_CONTRACTS,
  type DeveloperContract,
} from "@/lib/game/softwareDeveloper";
import {
  DEFAULT_PLAYER_STATE,
  loadPersistentPlayerState,
  savePersistentPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function SoftwareDeveloperPage() {
  const [player, setPlayer] =
    useState<PlayerGameState>(DEFAULT_PLAYER_STATE);

  const [contract, setContract] =
    useState<DeveloperContract>(DEVELOPER_CONTRACTS[0]);

  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    void loadPersistentPlayerState().then((state) => {
      if (!mounted) return;

      setPlayer(state);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleComplete(
    result: Parameters<
      React.ComponentProps<typeof SoftwareDeveloperPanel>["onComplete"]
    >[0]
  ) {
    const nextState: PlayerGameState = {
      ...player,
      cash: player.cash + result.totalPayment,
      energy: Math.max(0, player.energy - result.energyCost),
      reputation: player.reputation + result.reputationGain,
      jobExperience:
        player.jobExperience + result.clientSatisfaction,
    };

    const saved = await savePersistentPlayerState(nextState);

    if (!saved) {
      setMessage(
        "The contract was completed, but the reward could not be saved."
      );
      return;
    }

    setPlayer(nextState);
    setCompleted(true);

    setMessage(
      `Contract completed: ₦${result.totalPayment.toLocaleString()} earned and +${result.reputationGain} reputation.`
    );
  }

  function nextContract() {
    const currentIndex = DEVELOPER_CONTRACTS.findIndex(
      (item) => item.id === contract.id
    );

    const nextIndex =
      (currentIndex + 1) % DEVELOPER_CONTRACTS.length;

    setContract(DEVELOPER_CONTRACTS[nextIndex]);
    setCompleted(false);
    setMessage("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050a12] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-7 text-center">
          <div className="text-5xl">💻</div>

          <p className="mt-3 text-sm font-bold text-white/50">
            Loading developer workspace...
          </p>
        </div>
      </main>
    );
  }

  const isDeveloper =
    player.currentJobId === "software-developer";

  if (!isDeveloper) {
    return (
      <main className="min-h-screen bg-[#050a12] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/jobs"
            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black"
          >
            ← Back to Jobs
          </Link>

          <section className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-10 text-center">
            <div className="text-7xl">💻</div>

            <h1 className="mt-5 text-3xl font-black">
              Become a Software Developer first
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/50">
              Apply for the Software Developer career from the Jobs page
              before entering the developer workspace.
            </p>

            <Link
              href="/jobs"
              className="mt-7 inline-flex rounded-2xl bg-cyan-400 px-7 py-4 text-sm font-black text-black"
            >
              APPLY FOR SOFTWARE DEVELOPER →
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050a12] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
              Abuja Careers / Technology
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Developer Workspace
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Build software, solve bugs and deliver contracts for Abuja businesses.
            </p>
          </div>

          <Link
            href="/jobs"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black"
          >
            ← Back to Jobs
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Cash
            </div>

            <div className="mt-2 text-xl font-black text-emerald-300">
              ₦{player.cash.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Energy
            </div>

            <div className="mt-2 text-xl font-black">
              {player.energy}/{player.maxEnergy}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Reputation
            </div>

            <div className="mt-2 text-xl font-black text-orange-300">
              {player.reputation}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Job XP
            </div>

            <div className="mt-2 text-xl font-black text-cyan-300">
              {player.jobExperience}
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm font-bold text-emerald-200">
            {message}
          </div>
        )}

        {completed ? (
          <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-purple-500/10 p-8 text-center">
            <div className="text-5xl">🚀</div>

            <h2 className="mt-4 text-2xl font-black">
              Contract delivered
            </h2>

            <p className="mt-2 text-sm text-white/45">
              The client has received the completed project.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={nextContract}
                className="rounded-2xl bg-cyan-400 px-7 py-4 text-sm font-black text-black"
              >
                NEXT CONTRACT →
              </button>

              <Link
                href="/jobs"
                className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-black"
              >
                BACK TO JOBS
              </Link>
            </div>
          </section>
        ) : (
          <SoftwareDeveloperPanel
            contract={contract}
            onComplete={handleComplete}
          />
        )}
      </div>
    </main>
  );
}
