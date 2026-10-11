"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  BUSINESS_CATEGORIES,
  BUSINESSES,
  Business,
  BusinessCategory,
  canStartBusiness,
} from "@/lib/game/businesses";

import {
  addOwnedBusiness,
  createOwnedBusiness,
  loadOwnedBusinesses,
} from "@/lib/game/ownedBusinesses";

import {
  loadPlayerState,
  savePlayerState,
} from "@/lib/game/player";

export default function BusinessesPage() {
  const [playerCash, setPlayerCash] = useState(0);
  const [playerReputation, setPlayerReputation] = useState(0);
  const [playerLevel] = useState(1);

  const [selectedCategory, setSelectedCategory] =
    useState<BusinessCategory | "all">("all");

  const [search, setSearch] = useState("");

  const [ownedBusinessIds, setOwnedBusinessIds] =
    useState<string[]>([]);

  const [selectedBusiness, setSelectedBusiness] =
    useState<Business | null>(null);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const player = loadPlayerState();

    setPlayerCash(player.cash);
    setPlayerReputation(player.reputation);

    const owned = loadOwnedBusinesses();

    setOwnedBusinessIds(
      owned.map((business) => business.businessId)
    );
  }, []);

  const filteredBusinesses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return BUSINESSES.filter((business) => {
      const categoryMatch =
        selectedCategory === "all" ||
        business.category === selectedCategory;

      if (!categoryMatch) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        business.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        business.description
          .toLowerCase()
          .includes(normalizedSearch) ||
        business.tags.some((tag) =>
          tag.toLowerCase().includes(normalizedSearch)
        )
      );
    });
  }, [selectedCategory, search]);

  function isOwned(business: Business) {
    return ownedBusinessIds.includes(business.id);
  }

  function handleStartBusiness(business: Business) {
    const player = loadPlayerState();

    if (
      !canStartBusiness(
        business,
        player.cash,
        player.reputation,
        playerLevel
      )
    ) {
      setMessage(
        `You do not currently meet the requirements for ${business.name}.`
      );
      return;
    }

    if (isOwned(business)) {
      setMessage(
        `You already own ${business.name}.`
      );
      return;
    }

    const ownedBusiness = createOwnedBusiness(
      business
    );

    const updatedBusinesses =
      addOwnedBusiness(ownedBusiness);

    const updatedPlayer = {
      ...player,
      cash: player.cash - business.startupCost,
    };

    savePlayerState(updatedPlayer);

    setPlayerCash(updatedPlayer.cash);

    setOwnedBusinessIds(
      updatedBusinesses.map(
        (item) => item.businessId
      )
    );

    setSelectedBusiness(null);

    setMessage(
      `🎉 Congratulations! You now own ${business.name}.`
    );

    window.dispatchEvent(
      new Event("abujaLifePlayerUpdated")
    );
  }

  function formatMoney(amount: number) {
    return `₦${amount.toLocaleString("en-NG")}`;
  }

  function getTierLabel(business: Business) {
    return business.tier.charAt(0).toUpperCase() +
      business.tier.slice(1);
  }

  function getTierStyle(business: Business) {
    switch (business.tier) {
      case "luxury":
        return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";

      case "premium":
        return "border-purple-400/30 bg-purple-400/10 text-purple-300";

      case "standard":
        return "border-blue-400/30 bg-blue-400/10 text-blue-300";

      default:
        return "border-green-400/30 bg-green-400/10 text-green-300";
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* HEADER */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">
              Abuja Life
            </p>

            <h1 className="text-xl font-black">
              Business District
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/game"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              ← Back to City
            </Link>

            <div className="rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-2">
              <p className="text-[10px] uppercase text-green-300">
                Cash
              </p>

              <p className="font-black text-green-400">
                {formatMoney(playerCash)}
              </p>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* HERO */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/15 via-red-500/10 to-purple-500/10 p-6 shadow-2xl">
          <div className="max-w-3xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
              Build your empire
            </p>

            <h2 className="text-3xl font-black sm:text-5xl">
              Own Abuja.
              <br />
              Build something big.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Start a business, serve customers, build your reputation,
              hire staff and grow from a small local operation into one
              of Abuja&apos;s biggest businesses.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs text-white/50">
                  Reputation
                </p>
                <p className="font-black text-orange-300">
                  {playerReputation}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs text-white/50">
                  Businesses Available
                </p>
                <p className="font-black">
                  {BUSINESSES.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs text-white/50">
                  Your Businesses
                </p>
                <p className="font-black text-green-300">
                  {ownedBusinessIds.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-2xl border border-orange-400/20 bg-orange-400/10 px-5 py-4 text-sm font-semibold text-orange-200">
            {message}

            <button
              onClick={() => setMessage("")}
              className="ml-4 text-orange-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* SEARCH */}
        <div className="mb-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search businesses..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm outline-none placeholder:text-white/30 focus:border-orange-400/50"
          />
        </div>

        {/* CATEGORIES */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() =>
              setSelectedCategory("all")
            }
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
              selectedCategory === "all"
                ? "bg-orange-500 text-white"
                : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            🏢 All Businesses
          </button>

          {BUSINESS_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                setSelectedCategory(category.id)
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                selectedCategory === category.id
                  ? "bg-orange-500 text-white"
                  : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* BUSINESS GRID */}
        {filteredBusinesses.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="text-5xl">🔎</div>

            <h3 className="mt-4 text-xl font-black">
              No businesses found
            </h3>

            <p className="mt-2 text-sm text-white/50">
              Try another category or search.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredBusinesses.map((business) => {
              const owned = isOwned(business);

              const affordable =
                canStartBusiness(
                  business,
                  playerCash,
                  playerReputation,
                  playerLevel
                );

              return (
                <article
                  key={business.id}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-orange-400/30 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-3xl">
                      {
                        BUSINESS_CATEGORIES.find(
                          (category) =>
                            category.id ===
                            business.category
                        )?.icon
                      }
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getTierStyle(
                        business
                      )}`}
                    >
                      {getTierLabel(business)}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black">
                    {business.name}
                  </h3>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/55">
                    {business.description}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-black/20 p-3">
                      <p className="text-[10px] uppercase text-white/40">
                        Start Cost
                      </p>

                      <p className="mt-1 text-sm font-black text-orange-300">
                        {formatMoney(
                          business.startupCost
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-3">
                      <p className="text-[10px] uppercase text-white/40">
                        Potential / Day
                      </p>

                      <p className="mt-1 text-sm font-black text-green-300">
                        {formatMoney(
                          business.maximumDailyRevenue
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-3">
                      <p className="text-[10px] uppercase text-white/40">
                        Location
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {business.neighborhood}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-3">
                      <p className="text-[10px] uppercase text-white/40">
                        Customers
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {business.customerCapacity}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {business.tags
                      .slice(0, 3)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/45"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() =>
                        setSelectedBusiness(
                          business
                        )
                      }
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10"
                    >
                      Inspect
                    </button>

                    {owned ? (
                      <button
                        disabled
                        className="flex-1 rounded-xl bg-green-500/15 px-4 py-3 text-sm font-bold text-green-300"
                      >
                        ✓ Owned
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setSelectedBusiness(
                            business
                          )
                        }
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-black ${
                          affordable
                            ? "bg-orange-500 hover:bg-orange-400"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {affordable
                          ? "Start Business"
                          : "Locked"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* INSPECTION MODAL */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1626] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
                  Business Opportunity
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {selectedBusiness.name}
                </h2>

                <p className="mt-2 text-white/50">
                  📍 {selectedBusiness.neighborhood}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedBusiness(null)
                }
                className="rounded-xl bg-white/5 px-3 py-2 text-white/60 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <p className="mt-6 leading-7 text-white/65">
              {selectedBusiness.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Startup Cost
                </p>
                <p className="mt-1 text-xl font-black text-orange-300">
                  {formatMoney(
                    selectedBusiness.startupCost
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Maximum Daily Revenue
                </p>
                <p className="mt-1 text-xl font-black text-green-300">
                  {formatMoney(
                    selectedBusiness.maximumDailyRevenue
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Reputation Required
                </p>
                <p className="mt-1 text-xl font-black">
                  {selectedBusiness.reputationRequired}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Level Required
                </p>
                <p className="mt-1 text-xl font-black">
                  {selectedBusiness.levelRequired}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Staff Slots
                </p>
                <p className="mt-1 text-xl font-black">
                  {selectedBusiness.staffSlots}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Upgrade Slots
                </p>
                <p className="mt-1 text-xl font-black">
                  {selectedBusiness.upgradeSlots}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-orange-400/10 bg-orange-400/5 p-4">
              <p className="text-sm font-bold text-orange-300">
                Your current position
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-white/40">
                    Cash
                  </span>

                  <p className="font-bold">
                    {formatMoney(playerCash)}
                  </p>
                </div>

                <div>
                  <span className="text-white/40">
                    Reputation
                  </span>

                  <p className="font-bold">
                    {playerReputation}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() =>
                  setSelectedBusiness(null)
                }
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold hover:bg-white/10"
              >
                Cancel
              </button>

              {isOwned(selectedBusiness) ? (
                <button
                  disabled
                  className="flex-1 rounded-xl bg-green-500/15 px-5 py-3 font-black text-green-300"
                >
                  ✓ Already Owned
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleStartBusiness(
                      selectedBusiness
                    )
                  }
                  className={`flex-1 rounded-xl px-5 py-3 font-black ${
                    canStartBusiness(
                      selectedBusiness,
                      playerCash,
                      playerReputation,
                      playerLevel
                    )
                      ? "bg-orange-500 hover:bg-orange-400"
                      : "cursor-not-allowed bg-white/10 text-white/35"
                  }`}
                >
                  Start Business
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}