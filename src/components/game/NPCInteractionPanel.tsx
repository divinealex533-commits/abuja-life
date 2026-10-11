"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  canInteractWithNPC,
  getNPCInteractions,
  performNPCInteraction,
  NPCInteractionOption,
  NPCInteractionType,
} from "@/lib/game/npcInteraction";
import {
  getNearbyInteractableNPCs,
} from "@/lib/game/npcInteraction";
import {
  getNPCIcon,
} from "@/lib/game/npcs";
import {
  loadPlayerState,
  PlayerGameState,
} from "@/lib/game/player";

interface NPCInteractionPanelProps {
  locationId?: string;
  maxNPCs?: number;
}

export default function NPCInteractionPanel({
  locationId,
  maxNPCs = 8,
}: NPCInteractionPanelProps) {
  const [player, setPlayer] =
    useState<PlayerGameState>(() => loadPlayerState());

  const [selectedNPCId, setSelectedNPCId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  const [busy, setBusy] = useState(false);

  const refreshPlayer = () => {
    setPlayer(loadPlayerState());
  };

  useEffect(() => {
    refreshPlayer();

    const handlePlayerUpdate = () => {
      refreshPlayer();
    };

    window.addEventListener(
      "abujaLifePlayerUpdated",
      handlePlayerUpdate
    );

    return () => {
      window.removeEventListener(
        "abujaLifePlayerUpdated",
        handlePlayerUpdate
      );
    };
  }, []);

  const currentLocationId =
    locationId ?? player.currentLocationId;

  const nearbyNPCs = useMemo(() => {
    if (!currentLocationId) return [];

    return getNearbyInteractableNPCs(
      currentLocationId
    ).slice(0, maxNPCs);
  }, [currentLocationId, maxNPCs, player.currentLocationId]);

  const selectedNPC = useMemo(() => {
    if (!selectedNPCId) return null;

    return (
      nearbyNPCs.find(
        (npc) => npc.id === selectedNPCId
      ) ?? null
    );
  }, [nearbyNPCs, selectedNPCId]);

  const interactionOptions = useMemo(() => {
    if (!selectedNPC) return [];

    return getNPCInteractions(selectedNPC.id);
  }, [selectedNPC]);

  const runInteraction = (
    interaction: NPCInteractionOption
  ) => {
    if (!selectedNPC || busy) return;

    const permission = canInteractWithNPC(
      selectedNPC.id,
      interaction.id
    );

    if (!permission.allowed) {
      setMessage(
        permission.reason ??
          "You cannot do that right now."
      );
      setMessageType("error");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = performNPCInteraction(
        selectedNPC.id,
        interaction.id
      );

      if (result.success) {
        setMessage(result.message);
        setMessageType("success");
        setPlayer(result.player);

        if (interaction.id === "leave") {
          setSelectedNPCId(null);
        }
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      console.error(
        "NPC interaction error:",
        error
      );

      setMessage(
        "Something went wrong with the interaction."
      );
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  };

  const getInteractionStatus = (
    interaction: NPCInteractionOption
  ) => {
    return canInteractWithNPC(
      selectedNPC?.id ?? "",
      interaction.id
    );
  };

  if (!currentLocationId) {
    return (
      <section className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 text-white shadow-xl">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">👥</span>
          <h2 className="text-lg font-bold">
            People Nearby
          </h2>
        </div>

        <p className="text-sm text-slate-400">
          No current location is available.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 text-white shadow-xl">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>

            <h2 className="text-lg font-bold">
              People Nearby
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Meet and interact with people around you.
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-slate-400">
              Energy
            </span>
            <div className="font-bold">
              ⚡ {player.energy}/{player.maxEnergy}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-slate-400">
              Cash
            </span>
            <div className="font-bold">
              ₦{player.cash.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Result message */}
      {message && (
        <div
          className={`mb-5 rounded-xl border p-4 text-sm ${
            messageType === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* No NPCs */}
      {nearbyNPCs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mb-3 text-5xl">
            🌆
          </div>

          <h3 className="font-semibold">
            Nobody is nearby right now
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            The city is still moving. Try another
            location or come back later.
          </p>
        </div>
      )}

      {/* NPC list */}
      {nearbyNPCs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {nearbyNPCs.map((npc) => {
            const selected =
              selectedNPCId === npc.id;

            return (
              <button
                key={npc.id}
                type="button"
                onClick={() =>
                  setSelectedNPCId(npc.id)
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-orange-400/60 bg-orange-500/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                    {getNPCIcon(npc)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-bold">
                        {npc.name}
                      </h3>

                      <span className="text-xs text-slate-500">
                        {npc.age}
                      </span>
                    </div>

                    <p className="mt-1 text-xs capitalize text-orange-300">
                      {npc.role.replace(
                        /_/g,
                        " "
                      )}
                    </p>

                    <p className="mt-1 text-xs capitalize text-slate-400">
                      {npc.activity.replace(
                        /_/g,
                        " "
                      )}
                    </p>

                    {npc.occupation && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {npc.occupation}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected NPC */}
      {selectedNPC && (
        <div className="mt-5 rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-4xl">
                {getNPCIcon(selectedNPC)}
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  {selectedNPC.name}
                </h3>

                <p className="text-sm capitalize text-orange-300">
                  {selectedNPC.role.replace(
                    /_/g,
                    " "
                  )}
                </p>

                <p className="mt-1 text-xs capitalize text-slate-400">
                  Currently{" "}
                  {selectedNPC.activity.replace(
                    /_/g,
                    " "
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedNPCId(null)
              }
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Close
            </button>
          </div>

          {/* Personality */}
          <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Personality
            </p>

            <p className="mt-1 text-sm text-slate-300">
              {selectedNPC.personality}
            </p>
          </div>

          {/* Interactions */}
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">
                What do you want to do?
              </h4>

              <span className="text-xs text-slate-500">
                {interactionOptions.length} options
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {interactionOptions.map(
                (interaction) => {
                  const status =
                    getInteractionStatus(
                      interaction
                    );

                  const disabled =
                    busy ||
                    !status.allowed;

                  return (
                    <button
                      key={interaction.id}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        runInteraction(
                          interaction
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition ${
                        disabled
                          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50"
                          : "border-white/10 bg-white/[0.03] hover:border-orange-400/40 hover:bg-orange-500/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {interaction.icon}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">
                            {interaction.name}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {interaction.description}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                            {interaction.energyCost >
                              0 && (
                              <span className="rounded-md bg-blue-500/10 px-2 py-1 text-blue-300">
                                ⚡{" "}
                                {
                                  interaction.energyCost
                                }
                              </span>
                            )}

                            {interaction.cashCost >
                              0 && (
                              <span className="rounded-md bg-yellow-500/10 px-2 py-1 text-yellow-300">
                                ₦
                                {interaction.cashCost.toLocaleString()}
                              </span>
                            )}

                            {interaction.reputationGain >
                              0 && (
                              <span className="rounded-md bg-purple-500/10 px-2 py-1 text-purple-300">
                                ⭐ +
                                {
                                  interaction.reputationGain
                                }
                              </span>
                            )}

                            {interaction.experienceGain >
                              0 && (
                              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-300">
                                XP +
                                {
                                  interaction.experienceGain
                                }
                              </span>
                            )}
                          </div>

                          {!status.allowed && (
                            <p className="mt-2 text-[11px] text-red-300">
                              {status.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* NPC details */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Gender
              </p>

              <p className="mt-1 text-sm capitalize">
                {selectedNPC.gender}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Activity
              </p>

              <p className="mt-1 text-sm capitalize">
                {selectedNPC.activity.replace(
                  /_/g,
                  " "
                )}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Location
              </p>

              <p className="mt-1 truncate text-sm">
                {selectedNPC.currentLocationId}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500">
        <span>
          👥 {nearbyNPCs.length} people nearby
        </span>

        <span>
          📍 {currentLocationId}
        </span>
      </div>
    </section>
  );
}