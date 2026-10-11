"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import BusinessContractGame from "@/components/game/BusinessContractGame";

import {
  getBusinessMissionById,
  type BusinessMission,
} from "@/lib/game/businessMissions";

import {
  acceptBusinessContract,
  completeBusinessContract,
  getMyBusinessContracts,
  getOpenBusinessContracts,
  startBusinessContract,
  type PlayerBusinessContract,
} from "@/lib/multiplayer/businessContracts";

type Tab = "market" | "my";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function statusLabel(status: PlayerBusinessContract["status"]) {
  switch (status) {
    case "open":
      return "Open";
    case "accepted":
      return "Accepted";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function statusClass(status: PlayerBusinessContract["status"]) {
  switch (status) {
    case "open":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-400";
    case "accepted":
      return "border-blue-500/30 bg-blue-500/15 text-blue-400";
    case "in_progress":
      return "border-amber-500/30 bg-amber-500/15 text-amber-400";
    case "completed":
      return "border-purple-500/30 bg-purple-500/15 text-purple-400";
    default:
      return "border-white/10 bg-white/10 text-white/60";
  }
}

export default function BusinessContractsPage() {
  const [tab, setTab] = useState<Tab>("market");

  const [openContracts, setOpenContracts] = useState<
    PlayerBusinessContract[]
  >([]);

  const [myContracts, setMyContracts] = useState<
    PlayerBusinessContract[]
  >([]);

  const [activeContract, setActiveContract] =
    useState<PlayerBusinessContract | null>(null);

  const [activeMission, setActiveMission] =
    useState<BusinessMission | null>(null);

  const [contractStage, setContractStage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);

      const [open, mine] = await Promise.all([
        getOpenBusinessContracts(),
        getMyBusinessContracts(),
      ]);

      setOpenContracts(open);
      setMyContracts(mine);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load business contracts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const handleAccept = async (
    contract: PlayerBusinessContract
  ) => {
    try {
      setWorkingId(contract.id);
      setMessage("");

      await acceptBusinessContract(contract.id);

      setMessage("Contract accepted successfully.");

      await loadContracts();

      setTab("my");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to accept this contract."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const handleStart = async (
    contract: PlayerBusinessContract
  ) => {
    try {
      setWorkingId(contract.id);
      setMessage("");

      if (!contract.missionId) {
        throw new Error(
          "This contract does not have a business mission attached."
        );
      }

      const mission = getBusinessMissionById(
        contract.missionId
      );

      if (!mission) {
        throw new Error(
          "The business mission for this contract could not be found."
        );
      }

      await startBusinessContract(contract.id);

      setActiveContract(contract);
      setActiveMission(mission);
      setContractStage(0);

      setMessage(
        "Contract started. Complete all three stages to finish the job."
      );

      await loadContracts();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start this contract."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const finishContract = async (
    contract: PlayerBusinessContract
  ) => {
    try {
      setWorkingId(contract.id);
      setMessage("");

      const result = await completeBusinessContract(
        contract.id
      );

      setMessage(
        `${formatNaira(
          result.reward
        )} has been transferred to your multiplayer wallet.`
      );

      setActiveContract(null);
      setActiveMission(null);
      setContractStage(0);

      await loadContracts();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete the contract payment."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const handleStageComplete = async () => {
    if (!activeContract) {
      return;
    }

    if (contractStage < 2) {
      setContractStage((current) => current + 1);
      return;
    }

    await finishContract(activeContract);
  };

  const activeContracts = useMemo(
    () =>
      myContracts.filter(
        (contract) =>
          contract.status === "accepted" ||
          contract.status === "in_progress"
      ),
    [myContracts]
  );

  const completedContracts = useMemo(
    () =>
      myContracts.filter(
        (contract) => contract.status === "completed"
      ),
    [myContracts]
  );

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/game"
              className="mb-3 inline-flex items-center text-sm text-white/50 transition hover:text-white"
            >
              ← Back to Abuja Life
            </Link>

            <h1 className="text-3xl font-black tracking-tight">
              Player Business Marketplace
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Work for other players, complete real business
              contracts around Abuja and earn virtual ₦.
            </p>
          </div>

          <Link
            href="/my-businesses"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            My Businesses
          </Link>
        </header>

        {/* ACTIVE MINI-GAME */}
        {activeContract && activeMission ? (
          <section className="mb-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
                  Active Player Contract
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {activeContract.title}
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  Stage {contractStage + 1} of 3
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <p className="text-xs text-white/40">
                  Contract Reward
                </p>

                <p className="font-black text-emerald-400">
                  {formatNaira(activeContract.reward)}
                </p>
              </div>
            </div>

            <BusinessContractGame
              mission={activeMission}
              stage={contractStage}
              onStageComplete={handleStageComplete}
            />

            {workingId === activeContract.id && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm text-white/60">
                Processing contract completion...
              </div>
            )}
          </section>
        ) : (
          <>
            {/* STATS */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/45">
                  Open Contracts
                </p>

                <p className="mt-1 text-2xl font-black">
                  {openContracts.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/45">
                  Active Jobs
                </p>

                <p className="mt-1 text-2xl font-black">
                  {activeContracts.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/45">
                  Completed
                </p>

                <p className="mt-1 text-2xl font-black">
                  {completedContracts.length}
                </p>
              </div>
            </div>

            {/* MESSAGE */}
            {message && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/75">
                {message}
              </div>
            )}

            {/* TABS */}
            <div className="mb-6 flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              <button
                type="button"
                onClick={() => setTab("market")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  tab === "market"
                    ? "bg-white text-black"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                Contract Marketplace
              </button>

              <button
                type="button"
                onClick={() => setTab("my")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  tab === "my"
                    ? "bg-white text-black"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                My Contracts
              </button>
            </div>

            <div className="mt-4 flex justify-end">
  <Link
    href="/business-contracts/post"
    className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-bold text-black transition hover:bg-emerald-400"
  >
    💼 Post a Contract
  </Link>
</div>

            {/* LOADING */}
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

                <p className="text-sm text-white/50">
                  Loading player contracts...
                </p>
              </div>
            ) : tab === "market" ? (
              /* MARKETPLACE */
              <section>
                <div className="mb-5">
                  <h2 className="text-xl font-black">
                    Available Contracts
                  </h2>

                  <p className="mt-1 text-sm text-white/45">
                    Accept a contract and complete the work to
                    earn money, reputation and experience.
                  </p>
                </div>

                {openContracts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
                    <div className="text-5xl">📋</div>

                    <h3 className="mt-4 text-lg font-bold">
                      No open contracts yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
                      Player businesses will appear here when
                      they create work for other players.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {openContracts.map((contract) => (
                      <article
                        key={contract.id}
                        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                              Player Contract
                            </span>

                            <h3 className="mt-2 text-xl font-black">
                              {contract.title}
                            </h3>
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                              contract.status
                            )}`}
                          >
                            {statusLabel(contract.status)}
                          </span>
                        </div>

                        {contract.description && (
                          <p className="mt-3 text-sm leading-6 text-white/55">
                            {contract.description}
                          </p>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-black/20 p-3">
                            <p className="text-xs text-white/35">
                              Reward
                            </p>

                            <p className="mt-1 font-black text-emerald-400">
                              {formatNaira(contract.reward)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-black/20 p-3">
                            <p className="text-xs text-white/35">
                              Location
                            </p>

                            <p className="mt-1 font-bold">
                              {contract.locationId ?? "Abuja"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-black/20 p-3">
                            <p className="text-xs text-white/35">
                              Reputation
                            </p>

                            <p className="mt-1 font-bold">
                              +{contract.reputationReward}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-black/20 p-3">
                            <p className="text-xs text-white/35">
                              Experience
                            </p>

                            <p className="mt-1 font-bold">
                              +{contract.experienceReward} XP
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleAccept(contract)
                          }
                          disabled={
                            workingId === contract.id
                          }
                          className="mt-5 w-full rounded-2xl bg-white px-4 py-3 font-black text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {workingId === contract.id
                            ? "Accepting..."
                            : "Accept Contract"}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              /* MY CONTRACTS */
              <section>
                <div className="mb-5">
                  <h2 className="text-xl font-black">
                    My Contracts
                  </h2>

                  <p className="mt-1 text-sm text-white/45">
                    Manage contracts you have accepted and
                    complete active jobs.
                  </p>
                </div>

                {myContracts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
                    <div className="text-5xl">💼</div>

                    <h3 className="mt-4 text-lg font-bold">
                      You have no contracts
                    </h3>

                    <p className="mt-2 text-sm text-white/45">
                      Browse the marketplace and accept your
                      first player job.
                    </p>

                    <button
                      type="button"
                      onClick={() => setTab("market")}
                      className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-black text-black"
                    >
                      Browse Contracts
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myContracts.map((contract) => (
                      <article
                        key={contract.id}
                        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                                  contract.status
                                )}`}
                              >
                                {statusLabel(
                                  contract.status
                                )}
                              </span>

                              <span className="text-xs text-white/35">
                                {contract.businessId}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black">
                              {contract.title}
                            </h3>

                            {contract.description && (
                              <p className="mt-2 max-w-2xl text-sm text-white/50">
                                {contract.description}
                              </p>
                            )}
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-xs text-white/35">
                              Contract Value
                            </p>

                            <p className="text-xl font-black text-emerald-400">
                              {formatNaira(
                                contract.reward
                              )}
                            </p>
                          </div>
                        </div>

                        {contract.status === "accepted" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStart(contract)
                            }
                            disabled={
                              workingId === contract.id
                            }
                            className="mt-5 rounded-2xl bg-white px-5 py-3 font-black text-black disabled:opacity-50"
                          >
                            {workingId === contract.id
                              ? "Starting..."
                              : "Start Contract"}
                          </button>
                        )}

                        {contract.status ===
                          "in_progress" && (
                          <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                            <p className="text-sm text-amber-300">
                              This contract is already in
                              progress. Continue the business
                              job to complete it.
                            </p>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  !contract.missionId
                                ) {
                                  setMessage(
                                    "This contract has no business mission attached."
                                  );
                                  return;
                                }

                                const mission =
                                  getBusinessMissionById(
                                    contract.missionId
                                  );

                                if (!mission) {
                                  setMessage(
                                    "The business mission could not be found."
                                  );
                                  return;
                                }

                                setActiveContract(
                                  contract
                                );
                                setActiveMission(
                                  mission
                                );
                                setContractStage(0);
                              }}
                              className="mt-4 rounded-2xl bg-white px-5 py-3 font-black text-black"
                            >
                              Continue Contract
                            </button>
                          </div>
                        )}

                        {contract.status ===
                          "completed" && (
                          <div className="mt-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                            <p className="font-bold text-purple-300">
                              Contract completed
                            </p>

                            <p className="mt-1 text-sm text-white/50">
                              The secure multiplayer wallet
                              processed the payment.
                            </p>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}