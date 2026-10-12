"use client";

import { useEffect, useMemo, useState } from "react";

import { getHouseById } from '@/lib/game/houses';
import { getLocationById } from '@/lib/game/locations';

import TravelPanel from "@/components/game/TravelPanel";
import LocationWorldPanel from "@/components/game/LocationWorldPanel";

import PublicTransportPanel from "@/components/game/PublicTransportPanel";

import NearbyPlayersPanel from "@/components/game/NearbyPlayersPanel";

import LocationChatPanel from "@/components/game/LocationChatPanel";

import DailyRewardPanel from "@/components/game/DailyRewardPanel";

import NPCInteractionPanel from "@/components/game/NPCInteractionPanel";

import { updatePlayerLocation } from "@/lib/multiplayer/presence";
import { ensureMyProfile } from "@/lib/multiplayer/profile";

import {
  getVehicleById,
  type OwnedVehicle,
  type Vehicle,
} from "@/lib/game/vehicles";

import {
  loadOwnedVehicles,
  updateOwnedVehicle,
} from "@/lib/game/garage";

import {
  DRIVING_DESTINATIONS,
  type DrivingResult,
} from "@/lib/game/vehicleDriving";

import {
  DEFAULT_PLAYER_STATE,
  loadPlayerState,
  savePlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

import VehicleDrivingGame from "@/components/game/VehicleDrivingGame";

import Link from "next/link";
import NotificationBell from "@/components/game/NotificationBell";
import AnnouncementBanner from "@/components/announcements/AnnouncementBanner";

import {
  DEFAULT_CITY_STATE,
  generateCityState,
  getCityStatusText,
  type CityState,
} from "@/lib/game/city";

interface CharacterData {
  name: string;
  gender: string;
  skin: string;
  style: string;
  createdAt?: string;
}

const locations = [
  {
    name: "Wuse",
    icon: "🏙️",
    description: "Busy streets, shops, food and nightlife.",
    activity: "High",
  },
  {
    name: "Maitama",
    icon: "🏡",
    description: "Luxury homes, quiet streets and high society.",
    activity: "Calm",
  },
  {
    name: "Jabi",
    icon: "🌊",
    description: "Lake views, restaurants and entertainment.",
    activity: "High",
  },
  {
    name: "Garki",
    icon: "🏢",
    description: "Business district with shops and offices.",
    activity: "Busy",
  },
  {
    name: "Wuse 2",
    icon: "🍸",
    description: "Restaurants, clubs and Abuja nightlife.",
    activity: "Hot",
  },
  {
    name: "CBD",
    icon: "🏛️",
    description: "The heart of Abuja's business district.",
    activity: "Busy",
  },
];

const events = [
  {
    title: "Jabi Night Vibes",
    time: "Tonight • 8:00 PM",
    icon: "🌃",
  },
  {
    title: "Mystery Delivery",
    time: "Available now",
    icon: "📦",
  },
  {
    title: "Abuja Street Race",
    time: "Saturday • 7:00 PM",
    icon: "🏎️",
  },
];

const news = [
  "New players have arrived in Abuja.",
  "A luxury apartment is now available in Maitama.",
  "The Jabi Night Vibes event starts tonight.",
];

function getStyleEmoji(style: string) {
  switch (style) {
    case "Smart":
      return "👔";
    case "Casual":
      return "👕";
    case "Luxury":
      return "🕶️";
    case "Street":
    default:
      return "🧢";
  }
}

function activityWidth(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function getActivityLabel(value: number) {
  if (value >= 80) return "Very High";
  if (value >= 60) return "High";
  if (value >= 40) return "Moderate";
  if (value >= 20) return "Low";
  return "Quiet";
}

function getWeatherIcon(weather: string) {
  const value = weather.toLowerCase();

  if (value.includes("rain")) return "🌧️";
  if (value.includes("storm")) return "⛈️";
  if (value.includes("cloud")) return "☁️";
  if (value.includes("haze")) return "🌫️";
  if (value.includes("wind")) return "💨";
  if (value.includes("sun")) return "☀️";

  return "🌤️";
}

function getTrafficIcon(traffic: string) {
  const value = traffic.toLowerCase();

  if (value.includes("heavy")) return "🚨";
  if (value.includes("busy")) return "🚗";
  if (value.includes("moderate")) return "🚦";

  return "🛣️";
}

export default function GamePage() {
  const [ownedHouse, setOwnedHouse] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownedVehicles, setOwnedVehicles] = useState<OwnedVehicle[]>([]);
const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
const [playerState, setPlayerState] =
  useState<PlayerGameState>(DEFAULT_PLAYER_STATE);
const [drivingVehicle, setDrivingVehicle] = useState<{
  vehicle: Vehicle;
  ownedVehicle: OwnedVehicle;
} | null>(null);

const [drivingDestination, setDrivingDestination] =
  useState(
    DRIVING_DESTINATIONS[0]
  );

const [driveResult, setDriveResult] =
  useState<DrivingResult | null>(null);

  const [character, setCharacter] = useState<CharacterData>({
    name: "New Citizen",
    gender: "Male",
    skin: "🧑🏾",
    style: "Street",
  });

  const [city, setCity] = useState<CityState>(DEFAULT_CITY_STATE);

  /*
   * LIVE CITY CLOCK
   *
   * The city is refreshed every minute so Abuja feels alive.
   * We use the existing city engine rather than creating another
   * separate time/weather system.
   */
  useEffect(() => {
  try {
    const savedCharacter = localStorage.getItem(
      "abujaLifeCharacter"
    );

    if (savedCharacter) {
      const parsedCharacter = JSON.parse(savedCharacter);

      setCharacter({
        name: parsedCharacter.name || "New Citizen",
        gender: parsedCharacter.gender || "Male",
        skin: parsedCharacter.skin || "🧑🏾",
        style: parsedCharacter.style || "Street",
        createdAt: parsedCharacter.createdAt,
      });
    }

    const savedHouse = localStorage.getItem(
      "abujaLifeOwnedHouse"
    );

    if (savedHouse) {
      try {
        setOwnedHouse(JSON.parse(savedHouse));
      } catch {
        localStorage.removeItem(
          "abujaLifeOwnedHouse"
        );
      }
    }

    const savedVehicles = loadOwnedVehicles();
setOwnedVehicles(savedVehicles);

const savedPlayerState = loadPlayerState();
setPlayerState(savedPlayerState);

  } catch (error) {
    console.error(
      "Could not load character:",
      error
    );
  }
}, []);

useEffect(() => {
  async function syncMultiplayerLocation() {
    try {
      const profile = await ensureMyProfile(
        playerState.currentLocationId
      );

      if (!profile) {
        return;
      }

      await updatePlayerLocation(
        profile.id,
        playerState.currentLocationId
      );
    } catch (error) {
      console.error(
        "Multiplayer profile/location sync error:",
        error
      );
    }
  }

  syncMultiplayerLocation();
}, [playerState.currentLocationId]);

useEffect(() => {
  const handlePlayerUpdated = () => {
    setPlayerState(loadPlayerState());
  };

  window.addEventListener(
    "abujaLifePlayerUpdated",
    handlePlayerUpdated
  );

  return () => {
    window.removeEventListener(
      "abujaLifePlayerUpdated",
      handlePlayerUpdated
    );
  };
}, []);

  useEffect(() => {
    const updateCity = () => {
      try {
        const now = new Date();

        const generated = generateCityState(
          now.getHours(),
          now.getMinutes()
        );

        setCity(generated);
      } catch (error) {
        console.error(
          "Could not generate city state:",
          error
        );
      }
    };

    // Generate city state immediately.
    updateCity();

    // Keep the city clock/conditions updated every minute.
    const interval = window.setInterval(
      updateCity,
      60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const currentLocation = useMemo(() => {
    const gameLocation = getLocationById(
      playerState.currentLocationId
    );

    if (gameLocation) {
      const matchingLocation = locations.find(
        (location) =>
          location.name === gameLocation.name
      );

      if (matchingLocation) {
        return matchingLocation;
      }
    }

    return locations[0];
  }, [playerState.currentLocationId]);

  const activeLocation = currentLocation.name;

  const handleLocationSelect = (
    locationName: string
  ) => {
    const selectedLocation = locations.find(
      (location) =>
        location.name === locationName
    );

    if (!selectedLocation) return;

    const locationId = locationName
      .toLowerCase()
      .replace(/\s+/g, "-");

    const gameLocation = getLocationById(
      locationId
    );

    if (!gameLocation) {
      console.warn(
        `Could not find game location for ${locationName}`
      );
      return;
    }

    const updatedPlayerState: PlayerGameState = {
      ...playerState,
      currentLocationId: gameLocation.id,
    };

    savePlayerState(updatedPlayerState);
    setPlayerState(updatedPlayerState);
  };

  const cityStatus = useMemo(() => {
    try {
      return getCityStatusText(city);
    } catch {
      return "Abuja is alive and waiting for you.";
    }
  }, [city]);

  const weatherIcon = getWeatherIcon(city.weather);
  const trafficIcon = getTrafficIcon(city.traffic);

  const cityTime = useMemo(() => {
  const hour = Number(city.hour) || 0;
  const minute = Number(city.minute) || 0;

  const normalizedHour = ((hour % 24) + 24) % 24;
  const displayHour = normalizedHour % 12 || 12;
  const period = normalizedHour >= 12 ? "PM" : "AM";

  return `${displayHour}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
}, [city.hour, city.minute]);

const cityActivities = [
  {
    icon: "👮",
    label: "Police",
    value: `${city.policeActivity}%`,
  },
  {
    icon: "🌙",
    label: "Nightlife",
    value: `${city.nightlifeActivity}%`,
  },
  {
    icon: "🛍️",
    label: "Shopping",
    value: `${city.shoppingActivity}%`,
  },
  {
    icon: "💼",
    label: "Business",
    value: `${city.businessActivity}%`,
  },
];

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      {/* TOP NAVIGATION */}
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

          <div className="hidden items-center gap-6 md:flex">
            <button className="text-sm text-emerald-300">
              World
            </button>

            <button className="text-sm text-white/60 transition hover:text-white">
              Events
            </button>

            <button className="text-sm text-white/60 transition hover:text-white">
              Players
            </button>

            <button className="text-sm text-white/60 transition hover:text-white">
              Businesses
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm md:hidden"
          >
            ☰
          </button>

          <div className="hidden items-center gap-3 md:flex">
  <NotificationBell />

  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2">
              <div className="text-[10px] text-white/40">
                BALANCE
              </div>

              <div className="font-bold text-emerald-300">
                ₦{playerState.cash.toLocaleString()}
              </div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg">
              {character.skin}
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 px-4 py-4 md:hidden">
            <div className="grid gap-2">
              <div className="mb-2 flex justify-end">
  <NotificationBell />
</div>
              <button className="rounded-lg bg-white/5 p-3 text-left">
                🌍 World
              </button>

              <button className="rounded-lg bg-white/5 p-3 text-left">
                🎉 Events
              </button>

              <button className="rounded-lg bg-white/5 p-3 text-left">
                👥 Players
              </button>

              <button className="rounded-lg bg-white/5 p-3 text-left">
                🏪 Businesses
              </button>
            </div>
          </div>
        )}
       </nav>

{/* ADMIN ANNOUNCEMENTS */}
<AnnouncementBanner />

{/* LIVE CITY HUD */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-[#10241e] via-[#0b1916] to-[#07110f] shadow-2xl">
          <div className="border-b border-white/10 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                  Abuja Live
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black md:text-3xl">
                    {cityTime}
                  </h2>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/60">
                    {city.timeOfDay}
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/60">
                    📍 {activeLocation}
                  </span>
                </div>

                <p className="mt-2 max-w-2xl text-sm text-white/50">
                  {cityStatus}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center">
                <div className="text-3xl">
                  {weatherIcon}
                </div>

                <div className="mt-1 text-sm font-bold">
                  {city.weather}
                </div>

                <div className="text-xs text-white/40">
                  {city.temperature}°C
                </div>
              </div>
            </div>
          </div>

          {/* CITY CONDITIONS */}
          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
            <div className="bg-[#0b1916] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/30">
                Traffic
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span>{trafficIcon}</span>
                <span className="text-sm font-black">
                  {city.traffic}
                </span>
              </div>
            </div>

            <div className="bg-[#0b1916] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/30">
                City Mood
              </div>

              <div className="mt-2 text-sm font-black">
                {city.mood}
              </div>
            </div>

            <div className="bg-[#0b1916] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/30">
                Police
              </div>

              <div className="mt-2 text-sm font-black">
                {getActivityLabel(city.policeActivity)}
              </div>
            </div>

            <div className="bg-[#0b1916] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/30">
                Nightlife
              </div>

              <div className="mt-2 text-sm font-black">
                {getActivityLabel(city.nightlifeActivity)}
              </div>
            </div>

            <div className="bg-[#0b1916] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/30">
                Shopping
              </div>

              <div className="mt-2 text-sm font-black">
                {getActivityLabel(city.shoppingActivity)}
              </div>
            </div>

            <div className="bg-[#0b1916] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/30">
                Business
              </div>

              <div className="mt-2 text-sm font-black">
                {getActivityLabel(city.businessActivity)}
              </div>
            </div>
          </div>

          {/* ACTIVITY BARS */}
          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-white/50">
                  🌃 Nightlife activity
                </span>

                <span className="font-bold text-emerald-300">
                  {city.nightlifeActivity}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
                  style={{
                    width: activityWidth(city.nightlifeActivity),
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-white/50">
                  💼 Business activity
                </span>

                <span className="font-bold text-cyan-300">
                  {city.businessActivity}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
                  style={{
                    width: activityWidth(city.businessActivity),
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-white/50">
                  🛍️ Shopping activity
                </span>

                <span className="font-bold text-emerald-300">
                  {city.shoppingActivity}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all"
                  style={{
                    width: activityWidth(city.shoppingActivity),
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-white/50">
                  ⚡ Overall city energy
                </span>

                <span className="font-bold text-yellow-300">
                  {city.cityEnergy}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-400 transition-all"
                  style={{
                    width: activityWidth(city.cityEnergy),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLAYER HEADER */}
      <section className="mx-auto max-w-7xl px-4 pt-8">
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* WELCOME CARD */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-[#10201c] to-cyan-500/10 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                  Welcome to Abuja
                </div>

                <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                  Your Life.
                  <br />
                  <span className="text-emerald-400">
                    Your Abuja.
                  </span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
                  Build your character, find a home, get a job, meet
                  players, explore the city and create your own story.
                </p>
              </div>

              <div className="hidden text-6xl md:block">
                🇳🇬
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/40">
                  CASH
                </div>

                <div className="mt-1 text-xl font-black text-emerald-300">
                  ₦{playerState.cash.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/40">
                  JOB
                </div>

                <div className="mt-1 font-bold">
                  {playerState.currentJobId
  ? playerState.currentJobId
  : "Unemployed"}
                </div>
              </div>

            <Link
  href="/house"
  className="group block rounded-2xl border border-white/10 bg-black/20 p-4 transition-all duration-200 hover:border-emerald-400/30 hover:bg-white/[0.04]"
>
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        HOME
      </div>

      <div className="mt-1 font-bold text-white">
        {ownedHouse
          ? getHouseById(ownedHouse.houseId)?.name ?? 'Starter Room'
          : 'Starter Room'}
      </div>

      <div className="mt-1 text-xs text-white/40">
        {ownedHouse
          ? 'Your current property'
          : 'No property owned yet'}
      </div>
    </div>

    <div
      className={`rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
        ownedHouse
          ? 'bg-emerald-400/10 text-emerald-300'
          : 'bg-white/5 text-white/40'
      }`}
    >
      {ownedHouse ? 'Owned' : 'Starter'}
    </div>
  </div>

  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
    <span className="text-xs text-white/40">
      {ownedHouse
        ? 'Manage your property'
        : 'Visit the property market'}
    </span>

    <span className="text-xs font-semibold text-white/60 transition-colors group-hover:text-white">
      Open →
    </span>
  </div>
</Link>

<Link
  href="/admin/player-actions"
  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-500/30 hover:bg-orange-500/[0.05]"
>
  <div className="text-2xl">🧾</div>

  <h3 className="mt-4 font-black">
    Player Action History
  </h3>

  <p className="mt-1 text-xs leading-5 text-slate-500">
    Audit freezes, cash changes, XP,
    reputation, location moves and resets.
  </p>

  <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-orange-400">
    View Audit Log →
  </div>
</Link>
            </div>
          </div>

          {/* CHARACTER CARD */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40">
                  Your Character
                </div>

                <h2 className="mt-1 text-2xl font-black">
                  {character.name}
                </h2>
              </div>

              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                ONLINE
              </span>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/20">
                <div className="text-7xl">
                  {character.skin}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-white/40">
                    Location:
                  </span>{" "}
                  <span className="font-bold">
                    {activeLocation}
                  </span>
                </div>

                <div>
                  <span className="text-white/40">
                    Gender:
                  </span>{" "}
                  <span className="font-bold">
                    {character.gender}
                  </span>
                </div>

                <div>
                  <span className="text-white/40">
                    Style:
                  </span>{" "}
                  <span className="font-bold">
                    {getStyleEmoji(character.style)}{" "}
                    {character.style}
                  </span>
                </div>

                <div>
                  <span className="text-white/40">
                    Level:
                  </span>{" "}
                  <span className="font-bold">
                    {Math.max(
  1,
  Math.floor(playerState.jobExperience / 100) + 1
)}
                  </span>
                </div>

                <div>
                  <span className="text-white/40">
                    Reputation:
                  </span>{" "}
                  <span className="font-bold">
                    {playerState.reputation} REP
                  </span>
                </div>
              </div>
            </div>

            <a
              href="/create-character"
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black transition hover:bg-emerald-300"
            >
              🧑‍🎨 Customize Character
            </a>
          </div>
        </div>
      </section>

      {/* LIVE ABUJA CITY STATUS */}
<section className="mx-auto max-w-7xl px-4 pt-2">
  <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-[#10251f] via-[#0b1714] to-[#07110f] shadow-2xl">

    <div className="border-b border-white/10 px-5 py-4 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
            LIVE CITY
          </div>

          <h2 className="mt-1 text-xl font-black">
            Abuja is alive
          </h2>

          <p className="mt-1 text-xs text-white/40">
            {getCityStatusText(city)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            LIVE
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70">
            📍 {activeLocation}
          </span>
        </div>

      </div>
    </div>

    <div className="grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-3 lg:grid-cols-6">

      <div className="bg-black/20 p-4">
        <div className="text-2xl">🕐</div>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-white/40">
          Time
        </div>
        <div className="mt-1 font-black text-white">
          {cityTime}
        </div>
      </div>

      <div className="bg-black/20 p-4">
        <div className="text-2xl">
          {weatherIcon}
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-white/40">
          Weather
        </div>
        <div className="mt-1 font-black capitalize">
          {city.weather}
        </div>
      </div>

      <div className="bg-black/20 p-4">
        <div className="text-2xl">🌡️</div>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-white/40">
          Temperature
        </div>
        <div className="mt-1 font-black">
          {city.temperature}°C
        </div>
      </div>

      <div className="bg-black/20 p-4">
        <div className="text-2xl">
          {trafficIcon}
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-white/40">
          Traffic
        </div>
        <div className="mt-1 font-black capitalize">
          {city.traffic}
        </div>
      </div>

      <div className="bg-black/20 p-4">
        <div className="text-2xl">🌆</div>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-white/40">
          City Mood
        </div>
        <div className="mt-1 font-black capitalize">
          {city.mood}
        </div>
      </div>

      <div className="bg-black/20 p-4">
        <div className="text-2xl">⚡</div>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-white/40">
          City Energy
        </div>
        <div className="mt-1 font-black text-emerald-300">
          {city.cityEnergy}%
        </div>
      </div>

    </div>

    <div className="border-t border-white/10 p-4 md:p-5">
      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
        What's active across Abuja
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cityActivities.map((activity) => (
          <div
            key={activity.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">
                {activity.icon}
              </span>

              <span className="text-sm font-black text-emerald-300">
                {activity.value}
              </span>
            </div>

            <div className="mt-2 text-xs font-bold text-white/60">
              {activity.label}
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                style={{
                  width: activity.value,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>

  </div>
</section>

      {/* CITY */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
              Explore Abuja
            </div>

            <h2 className="mt-1 text-3xl font-black">
              Where do you want to go?
            </h2>
          </div>

          <div className="hidden text-sm text-white/40 sm:block">
            📍 Currently in {activeLocation}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <button
              key={location.name}
              onClick={() =>
  handleLocationSelect(location.name)
}
              className={`group rounded-3xl border p-5 text-left transition ${
                activeLocation === location.name
                  ? "border-emerald-400/50 bg-emerald-400/10"
                  : "border-white/10 bg-white/[0.04] hover:border-emerald-400/30 hover:bg-white/[0.07]"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-4xl">
                  {location.icon}
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-white/40">
                    {location.activity}
                  </span>

                  {activeLocation === location.name && (
                    <span className="rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-black text-black">
                      HERE
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-black">
                {location.name}
              </h3>

              <p className="mt-2 text-sm leading-5 text-white/50">
                {location.description}
              </p>

              <Link
                href={`/location?name=${encodeURIComponent(
                  location.name
                )}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-4 inline-block text-xs font-bold text-emerald-300 transition hover:text-emerald-200"
              >
                ENTER LOCATION →
              </Link>
            </button>
          ))}
        </div>
      </section>

      {/* LIVE CITY FEED */}
      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-white/[0.03] to-cyan-500/10 p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                Live City Feed
              </div>

              <h2 className="mt-1 text-3xl font-black">
                Abuja is moving
              </h2>
            </div>

            <div className="text-xs text-white/40">
              Conditions update automatically
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">🚦</div>

              <div className="mt-3 font-black">
                Traffic report
              </div>

              <p className="mt-1 text-xs leading-5 text-white/40">
                Traffic is currently {city.traffic.toLowerCase()}.
                This will affect future transport gameplay.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">🌃</div>

              <div className="mt-3 font-black">
                Social scene
              </div>

              <p className="mt-1 text-xs leading-5 text-white/40">
                Nightlife activity is currently{" "}
                {getActivityLabel(city.nightlifeActivity).toLowerCase()}.
                Different hours will unlock different city activities.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">💼</div>

              <div className="mt-3 font-black">
                Economy
              </div>

              <p className="mt-1 text-xs leading-5 text-white/40">
                Business activity is{" "}
                {getActivityLabel(city.businessActivity).toLowerCase()}.
                This will eventually influence businesses and jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS + NEWS */}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 lg:grid-cols-[1.5fr_1fr]">
        {/* EVENTS */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
              City Activity
            </div>

            <h2 className="mt-1 text-3xl font-black">
              What's happening?
            </h2>
          </div>

          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.title}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl">
                  {event.icon}
                </div>

                <div className="flex-1">
                  <div className="font-bold">
                    {event.title}
                  </div>

                  <div className="mt-1 text-xs text-white/40">
                    {event.time}
                  </div>
                </div>

                <button className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-emerald-400 hover:text-black">
                  VIEW
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* NEWS */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-white/[0.03] p-6">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              Abuja Daily
            </div>

            <h2 className="mt-1 text-3xl font-black">
              City News
            </h2>
          </div>

          <div className="space-y-3">
            {news.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  STORY 0{index + 1}
                </div>

                <p className="text-sm leading-6 text-white/70">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <button className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold transition hover:bg-white/10">
            Read Abuja Daily →
          </button>
        </div>
      </section>

{/* QUICK ACTIONS */}
<section className="mx-auto max-w-7xl px-4 pb-10">
  <div className="mb-5">
    <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
      Your Life
    </div>

    <h2 className="mt-1 text-3xl font-black">
      Quick Actions
    </h2>
  </div>

  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {[
      ["💼", "Find a Job", "Start earning virtual ₦"],
      ["🏠", "My Home", "View and upgrade your house"],
      ["🎒", "Inventory", "Check your belongings"],
      ["🚗", "Drive", "Take your own vehicle into Abuja"],
    ].map(([icon, title, text]) => (
      <button
        key={title}
        type="button"
        onClick={() => {
          if (title === "Find a Job") {
            window.location.href = "/jobs";
            return;
          }

          if (title === "My Home") {
            window.location.href = "/house";
            return;
          }

          if (title === "Inventory") {
            window.location.href = "/inventory";
            return;
          }

          if (title === "Drive") {
            if (ownedVehicles.length > 0) {
              document
                .getElementById("personal-transport")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
            } else {
              window.location.href = "/dealership";
            }
          }
        }}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:-translate-y-1 hover:border-emerald-400/30"
      >
        <div className="text-3xl">
          {icon}
        </div>

        <div className="mt-4 font-black">
          {title}
        </div>

        <div className="mt-1 text-xs text-white/40">
          {text}
        </div>
      </button>
    ))}
  </div>

  <div className="mt-6">
  <DailyRewardPanel />
</div>

  <div
    id="travel-panel"
    className="mt-6"
  >
    <TravelPanel />
  </div>

  <div className="mt-6">
  <NPCInteractionPanel
    locationId={playerState.currentLocationId}
  />
</div>

  <div className="mt-6">
  <LocationWorldPanel
    locationId={playerState.currentLocationId}
  />
</div>

  <div className="mt-6">
  <NearbyPlayersPanel
    locationId={playerState.currentLocationId}
  />
</div>

<div className="mt-6">
  <LocationChatPanel
    locationId={playerState.currentLocationId}
  />
</div>

  <div className="mt-6">
  <PublicTransportPanel />
</div>

  {ownedVehicles.length > 0 && (
  <section
    id="personal-transport"
    className="mx-auto max-w-7xl px-4 pb-8"
  >
    <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-cyan-500/10 p-6">
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
          Personal Transport
        </div>

        <h2 className="mt-1 text-3xl font-black">
          Take your car into Abuja
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Choose your vehicle and destination. Traffic, weather and
          distance affect the journey.
        </p>
      </div>

      {/* VEHICLE SELECTION */}
      <div>
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-white/40">
          Select Vehicle
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ownedVehicles.map((owned) => {
            const vehicle = getVehicleById(owned.vehicleId);

            if (!vehicle) return null;

            const isSelected =
              selectedVehicleId === owned.vehicleId;

            return (
              <button
                key={`${owned.vehicleId}-${owned.purchasedAt}`}
                type="button"
                onClick={() =>
                  setSelectedVehicleId(owned.vehicleId)
                }
                className={`overflow-hidden rounded-2xl border text-left transition ${
                  isSelected
                    ? "border-emerald-400/60 bg-emerald-400/10"
                    : "border-white/10 bg-black/20 hover:border-emerald-400/30"
                }`}
              >
                <div className="h-32 overflow-hidden bg-black/30">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black">
                        {vehicle.name}
                      </div>

                      <div className="mt-1 text-xs text-white/40">
                        {vehicle.brand} • {vehicle.class}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="rounded-full bg-emerald-400 px-2 py-1 text-[9px] font-black text-black">
                        SELECTED
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="rounded-lg bg-white/5 p-2">
                      <div className="text-white/30">
                        SPEED
                      </div>
                      <div className="mt-1 font-bold">
                        {vehicle.speed}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/5 p-2">
                      <div className="text-white/30">
                        HANDLING
                      </div>
                      <div className="mt-1 font-bold">
                        {vehicle.handling}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/5 p-2">
                      <div className="text-white/30">
                        FUEL
                      </div>
                      <div className="mt-1 font-bold">
                        {owned.fuel}%
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DESTINATION SELECTION */}
      <div className="mt-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-white/40">
          Choose Destination
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DRIVING_DESTINATIONS.map((destination) => (
            <button
              key={destination.id}
              type="button"
              onClick={() =>
                setDrivingDestination(destination)
              }
              className={`rounded-2xl border p-4 text-left transition ${
                drivingDestination.id === destination.id
                  ? "border-emerald-400/50 bg-emerald-400/10"
                  : "border-white/10 bg-black/20 hover:border-emerald-400/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-black">
                    📍 {destination.name}
                  </div>

                  <div className="mt-1 text-xs text-white/40">
                    {destination.neighborhood}
                  </div>
                </div>

                <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-white/40">
                  {destination.difficulty}
                </span>
              </div>

              <div className="mt-4 flex justify-between text-xs text-white/50">
                <span>
                  🛣️ {destination.distanceKm} km
                </span>

                <span>
                  🚦 {destination.trafficLevel}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DRIVE BUTTON */}
      <button
        type="button"
        onClick={() => {
          if (!selectedVehicleId) return;

          const owned = ownedVehicles.find(
            (item) =>
              item.vehicleId === selectedVehicleId
          );

          if (!owned) return;

          const vehicle = getVehicleById(
            owned.vehicleId
          );

          if (!vehicle) return;

          setDriveResult(null);

          setDrivingVehicle({
            vehicle,
            ownedVehicle: owned,
          });
        }}
        disabled={!selectedVehicleId}
        className={`mt-5 w-full rounded-2xl px-5 py-4 font-black transition ${
          selectedVehicleId
            ? "bg-emerald-400 text-black hover:bg-emerald-300"
            : "cursor-not-allowed bg-white/10 text-white/30"
        }`}
      >
        🚗 DRIVE TO{" "}
        {drivingDestination.name.toUpperCase()}
      </button>
    </div>
  </section>
)}

</section>
      {/* FOOTER */}
      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-white/40 sm:flex-row">
          <div>
            ©️ {new Date().getFullYear()} Abuja Life. Your city. Your story.
          </div>

          <div className="flex gap-5">
            <span>Abuja</span>
            <span>Virtual World</span>
            <span>Built for Nigeria 🇳🇬</span>
          </div>
        </div>
      </footer>
      {drivingVehicle && (
  <VehicleDrivingGame
    vehicle={drivingVehicle.vehicle}
    ownedVehicle={drivingVehicle.ownedVehicle}
    destination={drivingDestination}
    city={city}
    onCancel={() => {
      setDrivingVehicle(null);
      setDriveResult(null);
    }}
    onComplete={(result) => {
  setDriveResult(result);

  const updatedCondition = Math.max(
    0,
    drivingVehicle.ownedVehicle.condition - result.conditionLoss
  );

  const updatedFuel = Math.max(
    0,
    drivingVehicle.ownedVehicle.fuel - result.fuelUsed
  );

  const updatedMileage =
    drivingVehicle.ownedVehicle.mileage + result.distanceKm;

  const updatedVehicle: OwnedVehicle = {
    ...drivingVehicle.ownedVehicle,
    condition: updatedCondition,
    fuel: updatedFuel,
    mileage: updatedMileage,
  };

  updateOwnedVehicle(updatedVehicle);

  setOwnedVehicles(loadOwnedVehicles());

  const updatedPlayerState: PlayerGameState = {
    ...playerState,
    currentLocationId: drivingDestination.locationId,
  };

  savePlayerState(updatedPlayerState);
  setPlayerState(updatedPlayerState);
}}
/>
)}
  
    </main>
  );
}
