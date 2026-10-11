'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RoomInteractionPanel from "@/components/game/RoomInteractionPanel";

import {
  getHouseRooms,
  getHouseRoomById,
  type HouseRoom,
} from '@/lib/game/houseInterior';

import {
  HOUSES,
  getHouseById,
  getFurnitureById,
  calculateFurniturePrestige,
  calculateFurnitureComfort,
  calculateHouseValue,
  getHousePrestige,
} from '@/lib/game/houses';

import type { OwnedHouse } from '@/lib/game/houses';

type Room = {
  id: string;
  name: string;
  icon: string;
  description: string;
  furnitureSlots: number;
};

const ROOMS: Room[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    icon: '🛋️',
    description: 'Relax, entertain visitors and show off your furniture.',
    furnitureSlots: 4,
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    icon: '🛏️',
    description: 'Your private space for rest and recovery.',
    furnitureSlots: 3,
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: '🍳',
    description: 'Prepare food and improve your home lifestyle.',
    furnitureSlots: 3,
  },
  {
    id: 'office',
    name: 'Home Office',
    icon: '💻',
    description: 'A productive workspace for your career.',
    furnitureSlots: 3,
  },
  {
    id: 'garage',
    name: 'Garage',
    icon: '🚗',
    description: 'Store and customize your vehicles here.',
    furnitureSlots: 3,
  },
  {
    id: 'garden',
    name: 'Garden',
    icon: '🌴',
    description: 'A private outdoor space for relaxation.',
    furnitureSlots: 2,
  },
];

const STARTER_FURNITURE = [
  'basic-sofa',
  'luxury-bed',
  'modern-kitchen',
];

export default function MyHousePage() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [ownedHouse, setOwnedHouse] = useState<OwnedHouse | null>(null);
  const [cash, setCash] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>(
    'success'
  );

  useEffect(() => {
    const savedHouse = localStorage.getItem('abujaLifeOwnedHouse');
    const savedCash = localStorage.getItem('abujaLifeCash');

    if (savedHouse) {
      try {
        setOwnedHouse(JSON.parse(savedHouse));
      } catch {
        localStorage.removeItem('abujaLifeOwnedHouse');
      }
    }

    if (savedCash) {
      setCash(Number(savedCash));
    } else {
      setCash(10000);
    }
  }, []);

  const house = useMemo(() => {
    if (!ownedHouse) return null;
    return getHouseById(ownedHouse.houseId) ?? null;
  }, [ownedHouse]);

  const furniture = useMemo(() => {
    if (!ownedHouse) return [];

    return ownedHouse.furniture
      .map((id) => getFurnitureById(id))
      .filter(Boolean);
  }, [ownedHouse]);

  const furniturePrestige = useMemo(() => {
  if (!ownedHouse) return 0;

  return calculateFurniturePrestige(ownedHouse.furniture);
}, [ownedHouse]);

const furnitureComfort = useMemo(() => {
  if (!ownedHouse) return 0;

  return calculateFurnitureComfort(ownedHouse.furniture);
}, [ownedHouse]);

  const currentPropertyValue = useMemo(() => {
    if (!house || !ownedHouse) return 0;

    return calculateHouseValue(
      house,
      ownedHouse.furniture,
      ownedHouse.interiorLevel
    );
  }, [house, ownedHouse]);

  const prestige = useMemo(() => {
    if (!house || !ownedHouse) return 0;

    return getHousePrestige(
  house,
  ownedHouse.furniture,
  ownedHouse.interiorLevel
);
  }, [house, ownedHouse]);

  const showMessage = (
    text: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage('');
    }, 3500);
  };

  const saveHouse = (updatedHouse: OwnedHouse) => {
    setOwnedHouse(updatedHouse);
    localStorage.setItem(
      'abujaLifeOwnedHouse',
      JSON.stringify(updatedHouse)
    );
  };

  const upgradeInterior = () => {
    if (!house || !ownedHouse) return;

    const nextLevel = ownedHouse.interiorLevel + 1;

    if (nextLevel > house.maxInteriorLevel) {
      showMessage(
        'Your interior is already at the maximum level.',
        'error'
      );
      return;
    }

    const cost = nextLevel * 75000;

    if (cash < cost) {
      showMessage(
        `You need ₦${cost.toLocaleString()} for this upgrade.`,
        'error'
      );
      return;
    }

    const updatedHouse: OwnedHouse = {
      ...ownedHouse,
      interiorLevel: nextLevel,
      propertyValue: calculateHouseValue(
        house,
        ownedHouse.furniture,
        nextLevel
      ),
    };

    const newCash = cash - cost;

    setCash(newCash);
    localStorage.setItem('abujaLifeCash', String(newCash));
    saveHouse(updatedHouse);

    showMessage(
      `Interior upgraded to Level ${nextLevel}! 🏠✨`
    );
  };

  const upgradeSecurity = () => {
    if (!house || !ownedHouse) return;

    if (ownedHouse.securityLevel >= house.features.securityLevel) {
      showMessage(
        'Your house security is already at the maximum level.',
        'error'
      );
      return;
    }

    const cost = (ownedHouse.securityLevel + 1) * 50000;

    if (cash < cost) {
      showMessage(
        `You need ₦${cost.toLocaleString()} for this security upgrade.`,
        'error'
      );
      return;
    }

    const updatedHouse: OwnedHouse = {
      ...ownedHouse,
      securityLevel: ownedHouse.securityLevel + 1,
      propertyValue: calculateHouseValue(
        house,
        ownedHouse.furniture,
        ownedHouse.interiorLevel
      ),
    };

    const newCash = cash - cost;

    setCash(newCash);
    localStorage.setItem('abujaLifeCash', String(newCash));
    saveHouse(updatedHouse);

    showMessage('Home security upgraded 🔐');
  };

  const addStarterFurniture = () => {
    if (!ownedHouse) return;

    const available = STARTER_FURNITURE.find(
      (id) => !ownedHouse.furniture.includes(id)
    );

    if (!available) {
      showMessage(
        'You already own the starter furniture collection.',
        'error'
      );
      return;
    }

    const item = getFurnitureById(available);

    if (!item) return;

    const cost = item.price;

    if (cash < cost) {
      showMessage(
        `You need ₦${cost.toLocaleString()} to buy this furniture.`,
        'error'
      );
      return;
    }

    const updatedFurniture = [
      ...ownedHouse.furniture,
      available,
    ];

    const updatedHouse: OwnedHouse = {
      ...ownedHouse,
      furniture: updatedFurniture,
      furnitureValue: ownedHouse.furnitureValue + cost,
      propertyValue: house
        ? calculateHouseValue(
            house,
            updatedFurniture,
            ownedHouse.interiorLevel
          )
        : ownedHouse.propertyValue,
    };

    const newCash = cash - cost;

    setCash(newCash);
    localStorage.setItem('abujaLifeCash', String(newCash));
    saveHouse(updatedHouse);

    showMessage(`${item.name} added to your house 🛋️`);
  };

  if (!ownedHouse || !house) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-6xl mb-5">🏠</div>

          <h1 className="text-3xl font-black mb-3">
            You don't own a house yet
          </h1>

          <p className="text-slate-400 mb-7">
            Buy your first property in Abuja before entering your private
            home.
          </p>

          <Link
            href="/houses"
            className="inline-flex rounded-2xl bg-red-600 px-6 py-3 font-bold hover:bg-red-500 transition"
          >
            🏘️ Visit House Market
          </Link>
        </div>
      </main>
    );
  }

  const selectedRoomData =
    ROOMS.find((room) => room.id === selectedRoom) ?? ROOMS[0];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-red-400 font-bold">
              Abuja Life
            </p>

            <h1 className="text-2xl md:text-3xl font-black">
              🏠 My House
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/game"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10 transition"
            >
              ← City
            </Link>

            <Link
              href="/houses"
              className="hidden sm:block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10 transition"
            >
              🏘️ House Market
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        {/* NOTIFICATION */}
        {message && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 font-semibold ${
              messageType === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            {message}
          </div>
        )}

        {/* HOUSE HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 p-6 md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-red-300">
                  {house.tier}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                  📍 {house.neighborhood}
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                {house.name}
              </h2>

              <p className="mt-4 max-w-2xl text-slate-300 leading-7">
                {house.description}
              </p>

              <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat
                  icon="💰"
                  label="Property Value"
                  value={`₦${currentPropertyValue.toLocaleString()}`}
                />

                <Stat
                  icon="⭐"
                  label="Prestige"
                  value={prestige.toLocaleString()}
                />

                <Stat
                  icon="🛋️"
                  label="Comfort"
                  value={furnitureComfort.toLocaleString()}
                />

                <Stat
                  icon="🏆"
                  label="Furniture XP"
                  value={furniturePrestige.toLocaleString()}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">
                  Wallet
                </span>

                <span className="text-emerald-400 font-black">
                  ₦{cash.toLocaleString()}
                </span>
              </div>

              <div className="my-5 h-px bg-white/10" />

              <div className="space-y-3 text-sm">
                <InfoRow
                  label="Interior Level"
                  value={`Level ${ownedHouse.interiorLevel}`}
                />

                <InfoRow
                  label="Security"
                  value={`Level ${ownedHouse.securityLevel}`}
                />

                <InfoRow
                  label="Furniture"
                  value={`${ownedHouse.furniture.length} items`}
                />

                <InfoRow
                  label="Style"
                  value={ownedHouse.interiorStyle}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ROOMS */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-sm font-bold text-red-400">
              YOUR PROPERTY
            </p>

            <h2 className="text-2xl md:text-3xl font-black">
              Explore your house
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {ROOMS.map((room) => {
              const active = room.id === selectedRoom;

              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-red-500 bg-red-500/15 shadow-lg shadow-red-950/30'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl mb-3">
                    {room.icon}
                  </div>

                  <div className="font-black text-sm">
                    {room.name}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {room.furnitureSlots} furniture slots
                  </div>
                </button>
              );
            })}
          </div>
          {selectedRoom && (
  <RoomInteractionPanel
    roomId={selectedRoom}
    roomName={
      ROOMS.find((room) => room.id === selectedRoom)?.name ??
      "Your Room"
    }
  />
)}
        </section>

        {/* SELECTED ROOM */}
        <section className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-4xl mb-3">
                  {selectedRoomData.icon}
                </div>

                <h3 className="text-2xl font-black">
                  {selectedRoomData.name}
                </h3>

                <p className="mt-2 text-slate-400">
                  {selectedRoomData.description}
                </p>
              </div>

              <span className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-slate-400">
                {selectedRoomData.furnitureSlots} slots
              </span>
            </div>

            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {furniture.length > 0 ? (
                furniture.map((item) =>
                  item ? (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-black">
                            {item.name}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {item.category}
                          </div>
                        </div>

                        <div className="text-2xl">
                          {item.icon}
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 text-xs">
                        <span className="rounded-lg bg-yellow-500/10 px-2 py-1 text-yellow-300">
  ⭐ {calculateFurniturePrestige([item.id])}
</span>

<span className="rounded-lg bg-blue-500/10 px-2 py-1 text-blue-300">
  ❤️ {calculateFurnitureComfort([item.id])}
</span>
                      </div>
                    </div>
                  ) : null
                )
              ) : (
                <div className="sm:col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">
                  This room is empty. Start furnishing your home.
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-black">
              Home Management
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Improve your property and make it more valuable.
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={addStarterFurniture}
                className="w-full rounded-2xl bg-white/10 px-4 py-4 text-left font-bold hover:bg-white/15 transition"
              >
                <div>🛋️ Furnish Home</div>
                <div className="mt-1 text-xs font-normal text-slate-500">
                  Add furniture to your collection
                </div>
              </button>

              <button
                onClick={upgradeInterior}
                className="w-full rounded-2xl bg-red-600 px-4 py-4 text-left font-bold hover:bg-red-500 transition"
              >
                <div>✨ Upgrade Interior</div>
                <div className="mt-1 text-xs font-normal text-red-100">
                  Improve your home's interior level
                </div>
              </button>

              <button
                onClick={upgradeSecurity}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-4 text-left font-bold hover:bg-emerald-500 transition"
              >
                <div>🔐 Upgrade Security</div>
                <div className="mt-1 text-xs font-normal text-emerald-100">
                  Protect your property
                </div>
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                Property Progress
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (prestige / 1000) * 100
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Prestige</span>
                <span>{prestige}/1000</span>
              </div>
            </div>
          </div>
        </section>

        {/* PREMIUM ROADMAP */}
        <section className="mt-8 rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-white/5 to-transparent p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                Premium Living
              </div>

              <h2 className="mt-2 text-2xl font-black">
                Luxury upgrades are coming
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Exclusive interiors, VIP furniture collections, mansion
                themes, premium garages, designer décor and seasonal
                properties will become available here.
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-center">
              <div className="text-2xl">💎</div>
              <div className="mt-1 text-xs font-black text-yellow-300">
                VIP HOME
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xl">{icon}</div>

      <div className="mt-2 text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-black">
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold capitalize">{value}</span>
    </div>
  );
}