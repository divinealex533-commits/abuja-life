"use client";

import React, { useMemo, useState } from "react";
import {
  ABUJA_LOCATIONS,
  LOCATION_CONNECTIONS,
  getLocationById,
} from "@/lib/game/locations";
import {
  TRAVEL_OPTIONS,
  calculateTravel,
  canTravel,
  completeTravel,
  type TransportType,
} from "@/lib/game/travel";
import {
  loadPlayerState,
  savePlayerState,
} from "@/lib/game/player";

export default function TravelPanel() {
  const [player, setPlayer] = useState(() => loadPlayerState());
  const [transport, setTransport] =
    useState<TransportType>("taxi");
  const [selectedDestination, setSelectedDestination] =
    useState("");
  const [message, setMessage] = useState("");
  const [traveling, setTraveling] = useState(false);

  const currentLocation =
    getLocationById(player.currentLocationId);

  const destinations = useMemo(() => {
    if (!currentLocation) {
      return [];
    }

    const connectedIds = LOCATION_CONNECTIONS
      .filter(
        (connection) =>
          connection.from === currentLocation.id ||
          connection.to === currentLocation.id
      )
      .map((connection) =>
        connection.from === currentLocation.id
          ? connection.to
          : connection.from
      );

    return ABUJA_LOCATIONS.filter((location) =>
      connectedIds.includes(location.id)
    );
  }, [currentLocation]);

  const destination =
    getLocationById(selectedDestination);

  const connection =
    currentLocation && destination
      ? LOCATION_CONNECTIONS.find(
          (item) =>
            (item.from === currentLocation.id &&
              item.to === destination.id) ||
            (item.from === destination.id &&
              item.to === currentLocation.id)
        )
      : undefined;

  const travelResult =
    currentLocation &&
    destination &&
    connection
      ? calculateTravel(
          currentLocation,
          destination,
          transport,
          connection.distanceKm
        )
      : null;

  function handleTravel() {
    if (
      !currentLocation ||
      !destination ||
      !travelResult
    ) {
      setMessage(
        "📍 Choose a destination first."
      );
      return;
    }

    if (
      !canTravel(
        player.cash,
        player.energy,
        travelResult
      )
    ) {
      if (player.cash < travelResult.cost) {
        setMessage(
          `💰 You need ₦${travelResult.cost.toLocaleString()} for this trip.`
        );
        return;
      }

      setMessage(
        `⚡ You need ${travelResult.energyCost} energy for this trip.`
      );
      return;
    }

    setTraveling(true);
    setMessage(
      `🚦 Leaving ${currentLocation.name}...`
    );

    window.setTimeout(() => {
      const updatedPlayer = completeTravel(
        player.cash,
        player.energy,
        travelResult
      );

      savePlayerState({
        ...player,
        ...updatedPlayer,
      });

      setPlayer({
        ...player,
        ...updatedPlayer,
      });

      setMessage(
        `📍 You arrived at ${destination.name}!`
      );

      setTraveling(false);
      setSelectedDestination("");
    }, 1200);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-white/40">
          Current Location
        </p>

        <h3 className="mt-1 text-xl font-black text-white">
          {currentLocation?.icon}{" "}
          {currentLocation?.name ?? "Unknown Location"}
        </h3>

        <p className="mt-1 text-sm text-white/60">
          {currentLocation?.description}
        </p>
      </div>

      <div className="mb-5">
        <p className="mb-3 text-sm font-bold text-white">
          Where do you want to go?
        </p>

        {destinations.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
            No connected locations available.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {destinations.map((location) => {
              const active =
                selectedDestination === location.id;

              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() =>
                    setSelectedDestination(location.id)
                  }
                  disabled={traveling}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-red-400/50 bg-red-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {location.icon}
                    </span>

                    <div>
                      <div className="font-bold text-white">
                        {location.name}
                      </div>

                      <div className="text-xs text-white/50">
                        {location.neighborhood}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedDestination && (
        <div className="mb-5">
          <p className="mb-3 text-sm font-bold text-white">
            Choose transport
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRAVEL_OPTIONS.map((option) => {
              const active =
                transport === option.type;

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() =>
                    setTransport(option.type)
                  }
                  disabled={traveling}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-emerald-400/50 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {option.icon}
                    </span>

                    <span className="font-bold text-white">
                      {option.name}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-white/50">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {travelResult && destination && (
        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 font-bold text-white">
            Trip to {destination.name}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-white/40">
                Distance
              </p>
              <p className="font-bold text-white">
                {travelResult.distanceKm} km
              </p>
            </div>

            <div>
              <p className="text-white/40">
                Travel Time
              </p>
              <p className="font-bold text-white">
                {travelResult.travelMinutes} min
              </p>
            </div>

            <div>
              <p className="text-white/40">
                Cost
              </p>
              <p className="font-bold text-emerald-300">
                ₦{travelResult.cost.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-white/40">
                Energy
              </p>
              <p className="font-bold text-yellow-300">
                -{travelResult.energyCost}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTravel}
            disabled={traveling}
            className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {traveling
              ? "🚦 Traveling..."
              : `🚗 Travel to ${destination.name}`}
          </button>
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm">
        <span className="text-white/70">
          💰 Cash:{" "}
          <strong className="text-white">
            ₦{player.cash.toLocaleString()}
          </strong>
        </span>

        <span className="text-white/70">
          ⚡ Energy:{" "}
          <strong className="text-white">
            {player.energy}/{player.maxEnergy}
          </strong>
        </span>
      </div>
    </div>
  );
}