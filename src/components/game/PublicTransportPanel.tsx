"use client";

import { useState } from "react";
import {
  loadPlayerState,
  savePlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

interface TransportDestination {
  id: string;
  name: string;
  neighborhood: string;
  locationId: string;
}

interface TransportOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  price: number;
  energyCost: number;
  time: string;
}

const DESTINATIONS: TransportDestination[] = [
  {
    id: "wuse",
    name: "Wuse",
    neighborhood: "Wuse",
    locationId: "wuse",
  },
  {
    id: "garki",
    name: "Garki",
    neighborhood: "Garki",
    locationId: "garki",
  },
  {
    id: "jabi",
    name: "Jabi",
    neighborhood: "Jabi",
    locationId: "jabi",
  },
  {
    id: "maitama",
    name: "Maitama",
    neighborhood: "Maitama",
    locationId: "maitama",
  },
  {
    id: "wuse-2",
    name: "Wuse 2",
    neighborhood: "Wuse 2",
    locationId: "wuse-2",
  },
  {
    id: "cbd",
    name: "CBD",
    neighborhood: "Central Business District",
    locationId: "cbd",
  },
];

const TRANSPORT_OPTIONS: TransportOption[] = [
  {
    id: "walk",
    name: "Walk",
    icon: "🚶",
    description: "Take a walk through Abuja. Free but slower.",
    price: 0,
    energyCost: 5,
    time: "15–25 min",
  },
  {
    id: "bus",
    name: "Abuja Bus",
    icon: "🚌",
    description: "Affordable public transport around the city.",
    price: 300,
    energyCost: 2,
    time: "8–15 min",
  },
  {
    id: "taxi",
    name: "Taxi",
    icon: "🚕",
    description: "Get there faster with a private taxi.",
    price: 800,
    energyCost: 1,
    time: "5–10 min",
  },
];

export default function PublicTransportPanel() {
  const [destinationId, setDestinationId] =
    useState("wuse");

  const [transportId, setTransportId] =
    useState("bus");

  const [message, setMessage] = useState("");

  const destination =
    DESTINATIONS.find(
      (item) => item.id === destinationId
    ) ?? DESTINATIONS[0];

  const transport =
    TRANSPORT_OPTIONS.find(
      (item) => item.id === transportId
    ) ?? TRANSPORT_OPTIONS[1];

  const handleTravel = () => {
    setMessage("");

    const player: PlayerGameState =
      loadPlayerState();

    if (
      player.currentLocationId ===
      destination.locationId
    ) {
      setMessage(
        `You are already in ${destination.name}.`
      );
      return;
    }

    if (player.cash < transport.price) {
      setMessage(
        `You need ₦${transport.price.toLocaleString()} for this trip.`
      );
      return;
    }

    if (
      player.energy < transport.energyCost
    ) {
      setMessage(
        "You are too tired to travel right now. Restore your energy first."
      );
      return;
    }

    const updatedPlayer: PlayerGameState = {
      ...player,
      cash: player.cash - transport.price,
      energy: Math.max(
        0,
        player.energy - transport.energyCost
      ),
      currentLocationId:
        destination.locationId,
    };

    savePlayerState(updatedPlayer);

    setMessage(
      `You arrived in ${destination.name}. ₦${transport.price.toLocaleString()} spent.`
    );

    window.dispatchEvent(
      new CustomEvent("abujaLifePlayerUpdated")
    );
  };

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-emerald-500/10 p-6">
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
          Public Transport
        </div>

        <h2 className="mt-1 text-3xl font-black">
          Move around Abuja
        </h2>

        <p className="mt-2 text-sm text-white/40">
          You don't need your own car to explore the
          city. Walk, take a bus or call a taxi.
        </p>
      </div>

      {/* TRANSPORT */}
      <div className="mb-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-white/40">
          Choose Transport
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {TRANSPORT_OPTIONS.map((option) => {
            const selected =
              transport.id === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setTransportId(option.id)
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-cyan-400/50 bg-cyan-400/10"
                    : "border-white/10 bg-black/20 hover:border-cyan-400/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">
                    {option.icon}
                  </span>

                  {selected && (
                    <span className="rounded-full bg-cyan-400 px-2 py-1 text-[9px] font-black text-black">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="mt-3 font-black">
                  {option.name}
                </div>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  {option.description}
                </p>

                <div className="mt-3 flex justify-between text-xs">
                  <span className="font-bold text-cyan-300">
                    {option.price === 0
                      ? "FREE"
                      : `₦${option.price.toLocaleString()}`}
                  </span>

                  <span className="text-white/40">
                    ⚡ {option.energyCost} energy
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DESTINATION */}
      <div>
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-white/40">
          Choose Destination
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((item) => {
            const selected =
              destination.id === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setDestinationId(item.id)
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-emerald-400/50 bg-emerald-400/10"
                    : "border-white/10 bg-black/20 hover:border-emerald-400/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-black">
                      📍 {item.name}
                    </div>

                    <div className="mt-1 text-xs text-white/40">
                      {item.neighborhood}
                    </div>
                  </div>

                  {selected && (
                    <span className="rounded-full bg-emerald-400 px-2 py-1 text-[9px] font-black text-black">
                      HERE
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TRAVEL */}
      <button
        type="button"
        onClick={handleTravel}
        className="mt-5 w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black transition hover:bg-cyan-300"
      >
        {transport.icon} TRAVEL TO{" "}
        {destination.name.toUpperCase()}
      </button>

      <div className="mt-3 text-center text-xs text-white/30">
        Estimated journey: {transport.time}
      </div>

      {message && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-center text-sm font-bold text-emerald-300">
          {message}
        </div>
      )}
    </section>
  );
}