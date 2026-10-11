'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import {
  HOUSES,
  type House,
} from '@/lib/game/houses';

import {
  purchaseHouse,
} from '@/lib/game/property';

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG')}`;

const tierStyles: Record<string, string> = {
  starter:
    'bg-slate-500/15 text-slate-300 border-slate-400/20',
  standard:
    'bg-blue-500/15 text-blue-300 border-blue-400/20',
  premium:
    'bg-violet-500/15 text-violet-300 border-violet-400/20',
  luxury:
    'bg-amber-500/15 text-amber-300 border-amber-400/20',
  elite:
    'bg-rose-500/15 text-rose-300 border-rose-400/20',
};

export default function HousesPage() {
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState('all');
  const [tier, setTier] = useState('all');

  const [selectedHouse, setSelectedHouse] =
    useState<House | null>(null);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<
    'success' | 'error' | ''
  >('');

  const [cash, setCash] = useState(() => {
    if (typeof window === 'undefined') return 10000;

    const saved = localStorage.getItem('abujaLifeCash');

    if (!saved) return 10000;

    const parsed = Number(saved);

    return Number.isFinite(parsed) ? parsed : 10000;
  });

  const [reputation] = useState(() => {
    if (typeof window === 'undefined') return 0;

    const saved = localStorage.getItem(
      'abujaLifeReputation'
    );

    if (!saved) return 0;

    const parsed = Number(saved);

    return Number.isFinite(parsed) ? parsed : 0;
  });

  const neighborhoods = useMemo(() => {
    return Array.from(
      new Set(HOUSES.map((house) => house.neighborhood))
    ).sort();
  }, []);

  const filteredHouses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return HOUSES.filter((house) => {
      const matchesSearch =
        !query ||
        house.name.toLowerCase().includes(query) ||
        house.neighborhood.toLowerCase().includes(query) ||
        house.description.toLowerCase().includes(query);

      const matchesNeighborhood =
        neighborhood === 'all' ||
        house.neighborhood === neighborhood;

      const matchesTier =
        tier === 'all' || house.tier === tier;

      return (
        matchesSearch &&
        matchesNeighborhood &&
        matchesTier
      );
    });
  }, [search, neighborhood, tier]);

  const buyHouse = (house: House) => {
    setMessage('');
    setMessageType('');

    const result = purchaseHouse(
      house.id,
      cash,
      reputation
    );

    if (!result.success || !result.ownedHouse) {
      setMessage(
        result.message || 'You cannot purchase this house.'
      );
      setMessageType('error');
      return;
    }

    localStorage.setItem(
  'abujaLifeOwnedHouse',
  JSON.stringify(result.ownedHouse)
);

    const newCash = result.remainingCash;

    setCash(newCash);

    localStorage.setItem(
      'abujaLifeCash',
      String(newCash)
    );

    localStorage.setItem(
      'abujaLifeOwnedHouse',
      JSON.stringify(result.ownedHouse)
    );

    setMessage(
      `${house.name} is now yours. Welcome home. 🏠`
    );

    setMessageType('success');

    setSelectedHouse(null);
  };

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07110f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link
              href="/game"
              className="text-sm text-emerald-300 transition hover:text-emerald-200"
            >
              ← Back to Abuja Life
            </Link>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Abuja Property Market
            </h1>

            <p className="text-sm text-white/50">
              Find your place in the city.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Your Cash
            </p>

            <p className="text-lg font-black text-emerald-300">
              {formatNaira(cash)}
            </p>

            <p className="text-xs text-white/40">
              Rep {reputation}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-2xl border p-4 ${
              messageType === 'success'
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                : 'border-red-400/20 bg-red-400/10 text-red-300'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold">{message}</p>

              <button
                type="button"
                onClick={() => {
                  setMessage('');
                  setMessageType('');
                }}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-[#10231e] to-black p-6 shadow-2xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative">
            <div className="mb-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
              🏙️ Abuja Real Estate
            </div>

            <h2 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Build your life.
              <br />
              <span className="text-emerald-300">
                Own your space.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
              From a starter room in Garki to a luxury
              estate in Asokoro, your house is more than
              somewhere to sleep. It becomes part of your
              reputation, lifestyle and wealth.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black">
                  {HOUSES.length}
                </p>
                <p className="text-xs text-white/40">
                  Properties
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black">
                  {neighborhoods.length}
                </p>
                <p className="text-xs text-white/40">
                  Areas
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black">
                  {formatNaira(
                    Math.min(
                      ...HOUSES.map(
                        (house) => house.purchasePrice
                      )
                    )
                  )}
                </p>
                <p className="text-xs text-white/40">
                  Starting from
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black">
                  ₦180m+
                </p>
                <p className="text-xs text-white/40">
                  Luxury tier
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                🔎
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search houses, areas..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40"
              />
            </div>

            <select
              value={neighborhood}
              onChange={(event) =>
                setNeighborhood(event.target.value)
              }
              className="rounded-2xl border border-white/10 bg-[#0b1714] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="all">
                All neighborhoods
              </option>

              {neighborhoods.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <select
              value={tier}
              onChange={(event) =>
                setTier(event.target.value)
              }
              className="rounded-2xl border border-white/10 bg-[#0b1714] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="all">All tiers</option>
              <option value="starter">Starter</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="luxury">Luxury</option>
              <option value="elite">Elite</option>
            </select>
          </div>
        </section>

        {/* Results */}
        <div className="mb-4 mt-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">
              Available Properties
            </h2>

            <p className="mt-1 text-sm text-white/40">
              {filteredHouses.length} property
              {filteredHouses.length === 1 ? '' : 'ies'} found
            </p>
          </div>
        </div>

        {filteredHouses.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="text-5xl">🏚️</div>

            <h3 className="mt-4 text-lg font-bold">
              No properties found
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Try another neighborhood or search term.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredHouses.map((house) => {
              const canAfford =
                cash >= house.purchasePrice;

              const meetsRep =
                reputation >= house.reputationRequired;

              const canBuy =
                canAfford && meetsRep;

              return (
                <article
                  key={house.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.055]"
                >
                  {/* Visual */}
                  <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500/10 via-[#14241f] to-black">
                    <div className="text-7xl transition duration-300 group-hover:scale-110">
                      {house.icon}
                    </div>

                    <div
                      className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        tierStyles[house.tier] ||
                        tierStyles.standard
                      }`}
                    >
                      {house.tier}
                    </div>

                    <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-md">
                      <p className="text-[10px] uppercase tracking-wider text-white/40">
                        Location
                      </p>
                      <p className="text-xs font-bold">
                        📍 {house.neighborhood}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-black">
                      {house.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/45">
                      {house.description}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-[10px] uppercase text-white/30">
                          Bedrooms
                        </p>
                        <p className="mt-1 font-bold">
                          {house.features.bedrooms}
                        </p>
                      </div>

                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-[10px] uppercase text-white/30">
                          Bathrooms
                        </p>
                        <p className="mt-1 font-bold">
                          {house.features.bathrooms}
                        </p>
                      </div>

                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-[10px] uppercase text-white/30">
                          Parking
                        </p>
                        <p className="mt-1 font-bold">
                          {house.features.parkingSpaces}
                        </p>
                      </div>

                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-[10px] uppercase text-white/30">
                          Security
                        </p>
                        <p className="mt-1 font-bold">
                          Lv. {house.features.securityLevel}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-white/30">
                            Purchase price
                          </p>

                          <p className="text-xl font-black text-emerald-300">
                            {formatNaira(
                              house.purchasePrice
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-white/30">
                            Weekly rent
                          </p>

                          <p className="text-sm font-bold text-white/70">
                            {formatNaira(
                              house.weeklyRent
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedHouse(house)
                      }
                      className="mt-5 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-300"
                    >
                      View Property
                    </button>

                    {!canBuy && (
                      <div className="mt-3 text-center text-xs text-white/30">
                        {!canAfford
                          ? `Need ${formatNaira(
                              house.purchasePrice -
                                cash
                            )} more`
                          : `Requires ${house.reputationRequired} reputation`}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Property Modal */}
      {selectedHouse && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0b1714] shadow-2xl sm:rounded-3xl">
            <div className="relative p-6 sm:p-8">
              <button
                type="button"
                onClick={() =>
                  setSelectedHouse(null)
                }
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>

              <div className="pr-12">
                <div className="text-6xl">
                  {selectedHouse.icon}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${
                      tierStyles[selectedHouse.tier] ||
                      tierStyles.standard
                    }`}
                  >
                    {selectedHouse.tier}
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                    📍 {selectedHouse.neighborhood}
                  </span>
                </div>

                <h2 className="mt-4 text-3xl font-black">
                  {selectedHouse.name}
                </h2>

                <p className="mt-3 leading-6 text-white/50">
                  {selectedHouse.description}
                </p>
              </div>

              {/* Features */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Feature
                  icon="🛏️"
                  label="Bedrooms"
                  value={selectedHouse.features.bedrooms}
                />

                <Feature
                  icon="🚿"
                  label="Bathrooms"
                  value={selectedHouse.features.bathrooms}
                />

                <Feature
                  icon="🚗"
                  label="Parking"
                  value={selectedHouse.features.parkingSpaces}
                />

                <Feature
                  icon="🛡️"
                  label="Security"
                  value={`Level ${selectedHouse.features.securityLevel}`}
                />

                <Feature
                  icon="⚡"
                  label="Power"
                  value={`Level ${selectedHouse.features.powerReliability}`}
                />

                <Feature
                  icon="📶"
                  label="Internet"
                  value={`Level ${selectedHouse.features.internetQuality}`}
                />
              </div>

              {/* Lifestyle */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <h3 className="font-black">
                  Lifestyle features
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedHouse.features.hasKitchen && (
                    <Tag>🍳 Kitchen</Tag>
                  )}

                  {selectedHouse.features.hasLivingRoom && (
                    <Tag>🛋️ Living Room</Tag>
                  )}

                  {selectedHouse.features.hasBalcony && (
                    <Tag>🌇 Balcony</Tag>
                  )}

                  {selectedHouse.features.hasGarden && (
                    <Tag>🌳 Garden</Tag>
                  )}

                  {selectedHouse.features.hasPool && (
                    <Tag>🏊 Pool</Tag>
                  )}

                  {selectedHouse.features.hasGym && (
                    <Tag>🏋️ Gym</Tag>
                  )}

                  {selectedHouse.features.hasGarage && (
                    <Tag>🚘 Garage</Tag>
                  )}

                  {selectedHouse.features.hasHomeOffice && (
                    <Tag>💻 Home Office</Tag>
                  )}

                  {selectedHouse.features.hasGameRoom && (
                    <Tag>🎮 Game Room</Tag>
                  )}

                  {selectedHouse.features.hasCinema && (
                    <Tag>🎬 Cinema</Tag>
                  )}

                  {selectedHouse.features.hasSecurityRoom && (
                    <Tag>🛡️ Security Room</Tag>
                  )}

                  {selectedHouse.features.hasServantsQuarter && (
                    <Tag>🏠 Servant's Quarter</Tag>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/30">
                      Purchase price
                    </p>

                    <p className="mt-1 text-3xl font-black text-emerald-300">
                      {formatNaira(
                        selectedHouse.purchasePrice
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-white/30">
                      Weekly rent
                    </p>

                    <p className="font-bold">
                      {formatNaira(
                        selectedHouse.weeklyRent
                      )}
                    </p>
                  </div>
                </div>

                {reputation <
                  selectedHouse.reputationRequired && (
                  <p className="mt-3 text-xs text-amber-300">
                    ⭐ You need{' '}
                    {selectedHouse.reputationRequired}{' '}
                    reputation to purchase this property.
                  </p>
                )}

                {cash <
                  selectedHouse.purchasePrice && (
                  <p className="mt-2 text-xs text-red-300">
                    💰 You need{' '}
                    {formatNaira(
                      selectedHouse.purchasePrice - cash
                    )}{' '}
                    more cash.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    buyHouse(selectedHouse)
                  }
                  disabled={
                    cash < selectedHouse.purchasePrice ||
                    reputation <
                      selectedHouse.reputationRequired
                  }
                  className="flex-1 rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  🏠 Purchase Property
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedHouse(null)
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold text-white/70 hover:bg-white/10 hover:text-white"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Feature({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xl">{icon}</div>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-white/30">
        {label}
      </p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function Tag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">
      {children}
    </span>
  );
}