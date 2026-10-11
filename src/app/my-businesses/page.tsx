"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import BusinessContractGame from "@/components/game/BusinessContractGame";

import {
  BUSINESSES,
  Business,
  OwnedBusiness,
} from "@/lib/game/businesses";

import {
  loadOwnedBusinesses,
  saveOwnedBusinesses,
} from "@/lib/game/ownedBusinesses";

import {
  BUSINESS_MISSIONS,
  BusinessMission,
  calculateBusinessMissionExperience,
  calculateBusinessMissionReward,
  getAvailableBusinessMissions,
} from "@/lib/game/businessMissions";

import {
  loadPlayerState,
  savePlayerState,
  spendEnergy,
} from "@/lib/game/player";

interface ActiveContract {
  missionId: string;
  businessId: string;
  startedAt: number;
  progress: number;
}

const ACTIVE_CONTRACT_KEY = "abujaLifeActiveBusinessContract";

function formatMoney(value: number): string {
  return `₦${Math.max(0, Math.round(value)).toLocaleString()}`;
}

function getBusinessRecord(
  business: Business | undefined
): Record<string, unknown> {
  return (business ?? {}) as unknown as Record<string, unknown>;
}

function getOwnedRecord(
  business: OwnedBusiness
): Record<string, unknown> {
  return business as unknown as Record<string, unknown>;
}

function getBusinessLevel(ownedBusiness: OwnedBusiness): number {
  const record = getOwnedRecord(ownedBusiness);

  const level = Number(record.level ?? record.businessLevel ?? 1);

  return Number.isFinite(level) && level > 0 ? level : 1;
}

function getBusinessExperience(ownedBusiness: OwnedBusiness): number {
  const record = getOwnedRecord(ownedBusiness);

  const experience = Number(
    record.experience ?? record.businessExperience ?? 0
  );

  return Number.isFinite(experience) ? experience : 0;
}

function getBusinessReputation(ownedBusiness: OwnedBusiness): number {
  const record = getOwnedRecord(ownedBusiness);

  const reputation = Number(
    record.reputation ?? record.businessReputation ?? 0
  );

  return Number.isFinite(reputation) ? reputation : 0;
}

function getBusinessName(business: Business | undefined): string {
  const record = getBusinessRecord(business);

  return String(
    record.name ??
      record.title ??
      record.businessName ??
      "Business"
  );
}

function getBusinessDescription(
  business: Business | undefined
): string {
  const record = getBusinessRecord(business);

  return String(
    record.description ??
      "Build your business, complete contracts and grow your reputation."
  );
}

function getBusinessIcon(business: Business | undefined): string {
  const record = getBusinessRecord(business);

  return String(record.icon ?? "🏢");
}

function getBusinessLocation(business: Business | undefined): string {
  const record = getBusinessRecord(business);

  return String(
    record.location ??
      record.neighborhood ??
      record.locationName ??
      "Abuja"
  );
}

function getBusinessValue(ownedBusiness: OwnedBusiness): number {
  const record = getOwnedRecord(ownedBusiness);

  const value = Number(
    record.currentValue ??
      record.value ??
      record.purchasePrice ??
      record.price ??
      0
  );

  return Number.isFinite(value) ? value : 0;
}

function getBusinessUpgradeCount(
  ownedBusiness: OwnedBusiness
): number {
  const record = getOwnedRecord(ownedBusiness);

  const upgrades = record.upgrades;

  if (Array.isArray(upgrades)) {
    return upgrades.length;
  }

  const level = getBusinessLevel(ownedBusiness);

  return Math.max(0, level - 1);
}

export default function MyBusinessesPage() {
  const [ownedBusinesses, setOwnedBusinesses] = useState<
    OwnedBusiness[]
  >([]);

  const [selectedBusinessId, setSelectedBusinessId] =
    useState<string | null>(null);

  const [activeContract, setActiveContract] =
    useState<ActiveContract | null>(null);

  const [playerCash, setPlayerCash] = useState(0);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [playerReputation, setPlayerReputation] = useState(0);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const businesses = loadOwnedBusinesses();

    setOwnedBusinesses(businesses);

    if (businesses.length > 0) {
      setSelectedBusinessId(businesses[0].businessId);
    }

    const player = loadPlayerState();

    setPlayerCash(player.cash);
    setPlayerEnergy(player.energy);
    setPlayerReputation(player.reputation);

    try {
      const storedContract =
        localStorage.getItem(ACTIVE_CONTRACT_KEY);

      if (storedContract) {
        const parsed = JSON.parse(
          storedContract
        ) as ActiveContract;

        if (
          parsed &&
          typeof parsed.missionId === "string" &&
          typeof parsed.businessId === "string"
        ) {
          setActiveContract(parsed);
        }
      }
    } catch {
      localStorage.removeItem(ACTIVE_CONTRACT_KEY);
    }

    setIsLoaded(true);
  }, []);

  const selectedOwnedBusiness = useMemo(() => {
    if (!selectedBusinessId) {
      return undefined;
    }

    return ownedBusinesses.find(
      (business) =>
        business.businessId === selectedBusinessId
    );
  }, [ownedBusinesses, selectedBusinessId]);

  const selectedBusiness = useMemo(() => {
    if (!selectedBusinessId) {
      return undefined;
    }

    return BUSINESSES.find(
      (business) => business.id === selectedBusinessId
    );
  }, [selectedBusinessId]);

  const businessLevel = selectedOwnedBusiness
    ? getBusinessLevel(selectedOwnedBusiness)
    : 1;

  const businessReputation = selectedOwnedBusiness
    ? getBusinessReputation(selectedOwnedBusiness)
    : 0;

  const availableMissions = useMemo(() => {
    if (!selectedBusinessId) {
      return [];
    }

    return getAvailableBusinessMissions(
      selectedBusinessId,
      businessLevel
    );
  }, [selectedBusinessId, businessLevel]);

  const activeMission = useMemo(() => {
    if (!activeContract) {
      return undefined;
    }

    return BUSINESS_MISSIONS.find(
      (mission) => mission.id === activeContract.missionId
    );
  }, [activeContract]);

  function refreshPlayer() {
    const player = loadPlayerState();

    setPlayerCash(player.cash);
    setPlayerEnergy(player.energy);
    setPlayerReputation(player.reputation);
  }

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function startContract(mission: BusinessMission) {
    clearMessages();

    if (!selectedOwnedBusiness) {
      setError("You do not own this business.");
      return;
    }

    if (activeContract) {
      setError(
        "You already have an active business contract."
      );
      return;
    }

    if (businessLevel < mission.requiredBusinessLevel) {
      setError(
        `Business Level ${mission.requiredBusinessLevel} is required for this contract.`
      );
      return;
    }

    const player = loadPlayerState();

    if (player.energy < mission.energyCost) {
      setError(
        `You need ${mission.energyCost} energy to start this contract.`
      );
      return;
    }

    const started: ActiveContract = {
      missionId: mission.id,
      businessId: selectedOwnedBusiness.businessId,
      startedAt: Date.now(),
      progress: 0,
    };

    localStorage.setItem(
      ACTIVE_CONTRACT_KEY,
      JSON.stringify(started)
    );

    setActiveContract(started);

    setMessage(
      `${mission.title} accepted. Complete the contract to receive your payment.`
    );
  }

  function advanceContract() {
    clearMessages();

    if (!activeContract || !activeMission) {
      return;
    }

    const nextProgress = Math.min(
      activeContract.progress + 1,
      3
    );

    const updated: ActiveContract = {
      ...activeContract,
      progress: nextProgress,
    };

    setActiveContract(updated);

    localStorage.setItem(
      ACTIVE_CONTRACT_KEY,
      JSON.stringify(updated)
    );

    if (nextProgress < 3) {
      setMessage(
        `Contract progress: ${nextProgress}/3`
      );
    } else {
      setMessage(
        "Contract ready for completion. Collect your payment."
      );
    }
  }

  function completeContract() {
    clearMessages();

    if (!activeContract || !activeMission) {
      setError("There is no active business contract.");
      return;
    }

    if (!selectedOwnedBusiness) {
      setError("Your business could not be found.");
      return;
    }

    if (activeContract.progress < 3) {
      setError(
        "Complete all contract stages before collecting payment."
      );
      return;
    }

    const player = loadPlayerState();

    if (player.energy < activeMission.energyCost) {
      setError(
        `You need ${activeMission.energyCost} energy to complete this contract.`
      );
      return;
    }
 
    const updatedPlayerAfterEnergy = spendEnergy(
  player,
  activeMission.energyCost
);

const reward = calculateBusinessMissionReward(
  activeMission,
  businessLevel,
  player.reputation
);

const experience = calculateBusinessMissionExperience(
  activeMission,
  businessLevel
);

const updatedPlayer = {
  ...updatedPlayerAfterEnergy,
  cash: updatedPlayerAfterEnergy.cash + reward,
  reputation:
    updatedPlayerAfterEnergy.reputation +
    activeMission.reputationGain,
};

    savePlayerState(updatedPlayer);

    const updatedOwnedBusinesses =
      ownedBusinesses.map((business) => {
        if (
          business.businessId !==
          activeContract.businessId
        ) {
          return business;
        }

        const currentExperience =
          getBusinessExperience(business);

        const currentRecord =
          getOwnedRecord(business);

        const nextExperience =
          currentExperience + experience;

        const nextLevel = Math.max(
          getBusinessLevel(business),
          Math.floor(nextExperience / 500) + 1
        );

        return {
          ...business,
          ...(currentRecord as object),
          experience: nextExperience,
          businessExperience: nextExperience,
          level: nextLevel,
          businessLevel: nextLevel,
          reputation:
            getBusinessReputation(business) +
            activeMission.reputationGain,
          businessReputation:
            getBusinessReputation(business) +
            activeMission.reputationGain,
          lastContractAt: new Date().toISOString(),
        } as OwnedBusiness;
      });

    saveOwnedBusinesses(updatedOwnedBusinesses);

    setOwnedBusinesses(updatedOwnedBusinesses);

    localStorage.removeItem(ACTIVE_CONTRACT_KEY);
    setActiveContract(null);

    setPlayerCash(updatedPlayer.cash);
    setPlayerEnergy(updatedPlayer.energy);
    setPlayerReputation(updatedPlayer.reputation);

    setMessage(
      `Contract completed! You earned ${formatMoney(
        reward
      )} and gained ${activeMission.reputationGain} reputation.`
    );
  }

  function abandonContract() {
    clearMessages();

    if (!activeContract) {
      return;
    }

    localStorage.removeItem(ACTIVE_CONTRACT_KEY);
    setActiveContract(null);

    setMessage("The active contract was abandoned.");
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-slate-300">
            Loading your businesses...
          </p>
        </div>
      </main>
    );
  }

  if (ownedBusinesses.length === 0) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            href="/businesses"
            className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            ← Browse Businesses
          </Link>

          <section className="mt-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 text-center shadow-2xl">
            <div className="text-6xl">🏢</div>

            <h1 className="mt-5 text-3xl font-black">
              You Don't Own a Business Yet
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Start your Abuja business journey. Buy a
              business, accept contracts, earn virtual
              money, build reputation and unlock bigger
              opportunities.
            </p>

            <Link
              href="/businesses"
              className="mt-6 inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-black text-slate-950 hover:bg-emerald-400"
            >
              Explore Businesses
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
              Abuja Life
            </p>

            <h1 className="mt-1 text-3xl sm:text-4xl font-black">
              My Businesses
            </h1>

            <p className="mt-2 text-slate-400">
              Build businesses, complete contracts and
              become one of Abuja's top entrepreneurs.
            </p>
          </div>

          <Link
            href="/businesses"
            className="inline-flex w-fit rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-800"
          >
            + Find Another Business
          </Link>
        </div>

        {/* PLAYER STATS */}
        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">
              Cash
            </p>
            <p className="mt-1 text-xl font-black text-emerald-400">
              {formatMoney(playerCash)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">
              Energy
            </p>
            <p className="mt-1 text-xl font-black">
              {playerEnergy}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">
              Reputation
            </p>
            <p className="mt-1 text-xl font-black text-amber-400">
              {playerReputation}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">
              Businesses
            </p>
            <p className="mt-1 text-xl font-black">
              {ownedBusinesses.length}
            </p>
          </div>
        </section>

        {/* MESSAGES */}
        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {error}
          </div>
        )}

        {/* BUSINESS SELECTOR */}
        <section className="mt-8">
          <h2 className="text-xl font-black">
            Your Business Empire
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ownedBusinesses.map((ownedBusiness) => {
              const business = BUSINESSES.find(
                (item) =>
                  item.id === ownedBusiness.businessId
              );

              const level =
                getBusinessLevel(ownedBusiness);

              const reputation =
                getBusinessReputation(ownedBusiness);

              const experience =
                getBusinessExperience(ownedBusiness);

              const selected =
                selectedBusinessId ===
                ownedBusiness.businessId;

              return (
                <button
                  key={ownedBusiness.businessId}
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setSelectedBusinessId(
                      ownedBusiness.businessId
                    );
                  }}
                  className={`rounded-3xl border p-5 text-left transition ${
                    selected
                      ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-950"
                      : "border-slate-800 bg-slate-900 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
                        {getBusinessIcon(business)}
                      </div>

                      <div>
                        <h3 className="font-black">
                          {getBusinessName(business)}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {getBusinessLocation(business)}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-black text-emerald-400">
                      Lv. {level}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm text-slate-400">
                    {getBusinessDescription(business)}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-slate-950 p-2">
                      <p className="text-[10px] uppercase text-slate-600">
                        XP
                      </p>
                      <p className="text-sm font-bold">
                        {experience}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-2">
                      <p className="text-[10px] uppercase text-slate-600">
                        Rep
                      </p>
                      <p className="text-sm font-bold text-amber-400">
                        {reputation}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-2">
                      <p className="text-[10px] uppercase text-slate-600">
                        Upgrades
                      </p>
                      <p className="text-sm font-bold">
                        {getBusinessUpgradeCount(
                          ownedBusiness
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ACTIVE CONTRACT */}
        {activeContract && activeMission && (
  <section className="mt-8 overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900">
    <div className="border-b border-amber-500/20 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-amber-400">
            Active Contract
          </p>

          <h2 className="mt-1 text-2xl font-black">
            {activeMission.title}
          </h2>
        </div>

        <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-300">
          {activeContract.progress}/3 stages
        </span>
      </div>
    </div>

    <div className="p-5">
      <p className="text-slate-300">
        {activeMission.description}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-xs text-slate-500">
            Location
          </p>
          <p className="mt-1 font-bold">
            📍 {activeMission.location}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-xs text-slate-500">
            Payment
          </p>
          <p className="mt-1 font-bold text-emerald-400">
            {formatMoney(
              calculateBusinessMissionReward(
                activeMission,
                businessLevel,
                playerReputation
              )
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-xs text-slate-500">
            Energy
          </p>
          <p className="mt-1 font-bold">
            {activeMission.energyCost}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <BusinessContractGame
          mission={activeMission}
          stage={activeContract.progress}
          onStageComplete={advanceContract}
        />
      </div>

      <button
        type="button"
        onClick={abandonContract}
        className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-bold text-red-300 hover:bg-red-500/20"
      >
        Abandon Contract
      </button>
    </div>
  </section>
)}

        {/* CONTRACTS */}
        {selectedBusiness && selectedOwnedBusiness && (
          <section className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-400">
                  Business Level {businessLevel}
                </p>

                <h2 className="text-2xl font-black">
                  Available Contracts
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Complete contracts to earn money,
                  reputation and business experience.
                </p>
              </div>

              <span className="text-sm font-bold text-slate-500">
                {availableMissions.length} available
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {availableMissions.map((mission) => {
                const reward =
                  calculateBusinessMissionReward(
                    mission,
                    businessLevel,
                    playerReputation
                  );

                const locked =
                  businessLevel <
                  mission.requiredBusinessLevel;

                return (
                  <article
                    key={mission.id}
                    className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">
                            {mission.difficulty}
                          </span>

                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-400">
                            {mission.category}
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-black">
                          {mission.title}
                        </h3>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Payment
                        </p>

                        <p className="text-lg font-black text-emerald-400">
                          {formatMoney(reward)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {mission.description}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-slate-950 p-3">
                        <p className="text-[10px] uppercase text-slate-600">
                          Client
                        </p>
                        <p className="mt-1 text-xs font-bold">
                          {mission.client}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-3">
                        <p className="text-[10px] uppercase text-slate-600">
                          Location
                        </p>
                        <p className="mt-1 text-xs font-bold">
                          {mission.location}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-3">
                        <p className="text-[10px] uppercase text-slate-600">
                          Energy
                        </p>
                        <p className="mt-1 text-xs font-bold">
                          {mission.energyCost}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-3">
                        <p className="text-[10px] uppercase text-slate-600">
                          Reputation
                        </p>
                        <p className="mt-1 text-xs font-bold text-amber-400">
                          +{mission.reputationGain}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        ⏱ ~{mission.estimatedMinutes} min
                      </p>

                      <button
                        type="button"
                        disabled={
                          locked || Boolean(activeContract)
                        }
                        onClick={() =>
                          startContract(mission)
                        }
                        className={`rounded-xl px-4 py-2.5 text-sm font-black ${
                          locked || activeContract
                            ? "cursor-not-allowed bg-slate-800 text-slate-600"
                            : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        }`}
                      >
                        {locked
                          ? `Requires Lv. ${mission.requiredBusinessLevel}`
                          : activeContract
                            ? "Contract Active"
                            : "Accept Contract"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {availableMissions.length === 0 && (
              <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
                <div className="text-4xl">📋</div>

                <h3 className="mt-3 text-xl font-black">
                  No contracts available
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Upgrade your business to unlock more
                  profitable contracts.
                </p>
              </div>
            )}
          </section>
        )}

        {/* BUSINESS DESCRIPTION */}
        {selectedBusiness && (
          <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                {getBusinessIcon(selectedBusiness)}
              </div>

              <div>
                <h2 className="text-xl font-black">
                  {getBusinessName(selectedBusiness)}
                </h2>

                <p className="text-sm text-slate-500">
                  {getBusinessLocation(selectedBusiness)}
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400">
              {getBusinessDescription(selectedBusiness)}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300">
                🏢 Player Owned
              </span>

              <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300">
                💰 Earn Revenue
              </span>

              <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300">
                ⭐ Build Reputation
              </span>

              <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300">
                📈 Level Up
              </span>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}