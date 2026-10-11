// src/lib/game/npcWorld.ts

import {
  NPC,
  NPCActivity,
  NPCRole,
  NPC_SPAWN_RULES,
  createNPC,
  getNPCSpawnRule,
  moveNPC,
  updateNPCActivity,
} from "@/lib/game/npcs";

export interface NPCWorldState {
  npcs: NPC[];
  lastUpdatedAt: number;
  worldStartedAt: number;
  currentHour: number;
}

export interface NPCWorldSummary {
  totalNPCs: number;
  locations: Record<string, number>;
  activities: Record<NPCActivity, number>;
  roles: Record<NPCRole, number>;
}

const STORAGE_KEY = "abujaLifeNPCWorld";

const LOCATION_IDS = NPC_SPAWN_RULES.map(
  (rule) => rule.locationId
);

function getCurrentHour(): number {
  return new Date().getHours();
}

function randomInt(
  min: number,
  max: number
): number {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function createWorldNPC(
  locationId: string,
  hour: number
): NPC {
  return createNPC(locationId, hour);
}

function createInitialWorld(): NPCWorldState {
  const hour = getCurrentHour();

  const npcs: NPC[] = [];

  for (const rule of NPC_SPAWN_RULES) {
    const count = randomInt(
      rule.minNPCs,
      rule.maxNPCs
    );

    for (let i = 0; i < count; i += 1) {
      npcs.push(
        createWorldNPC(
          rule.locationId,
          hour
        )
      );
    }
  }

  return {
    npcs,
    lastUpdatedAt: Date.now(),
    worldStartedAt: Date.now(),
    currentHour: hour,
  };
}

export function createEmptyNPCWorld(): NPCWorldState {
  return {
    npcs: [],
    lastUpdatedAt: Date.now(),
    worldStartedAt: Date.now(),
    currentHour: getCurrentHour(),
  };
}

export function loadNPCWorld(): NPCWorldState {
  if (typeof window === "undefined") {
    return createEmptyNPCWorld();
  }

  try {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      const world =
        createInitialWorld();

      saveNPCWorld(world);

      return world;
    }

    const parsed =
      JSON.parse(stored) as NPCWorldState;

    if (
      !parsed ||
      !Array.isArray(parsed.npcs)
    ) {
      const world =
        createInitialWorld();

      saveNPCWorld(world);

      return world;
    }

    return {
      npcs: parsed.npcs,
      lastUpdatedAt:
        parsed.lastUpdatedAt ??
        Date.now(),
      worldStartedAt:
        parsed.worldStartedAt ??
        Date.now(),
      currentHour:
        parsed.currentHour ??
        getCurrentHour(),
    };
  } catch {
    const world =
      createInitialWorld();

    saveNPCWorld(world);

    return world;
  }
}

export function saveNPCWorld(
  world: NPCWorldState
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(world)
  );
}

export function getNPCWorld(): NPCWorldState {
  return loadNPCWorld();
}

export function getNPCsAtLocation(
  locationId: string
): NPC[] {
  const world = loadNPCWorld();

  return world.npcs.filter(
    (npc) =>
      npc.currentLocationId ===
      locationId
  );
}

export function getNPCById(
  npcId: string
): NPC | undefined {
  const world = loadNPCWorld();

  return world.npcs.find(
    (npc) => npc.id === npcId
  );
}

export function addNPCToWorld(
  npc: NPC
): NPCWorldState {
  const world = loadNPCWorld();

  const exists = world.npcs.some(
    (item) => item.id === npc.id
  );

  if (exists) {
    return world;
  }

  const updated: NPCWorldState = {
    ...world,
    npcs: [...world.npcs, npc],
    lastUpdatedAt: Date.now(),
  };

  saveNPCWorld(updated);

  return updated;
}

export function removeNPCFromWorld(
  npcId: string
): NPCWorldState {
  const world = loadNPCWorld();

  const updated: NPCWorldState = {
    ...world,
    npcs: world.npcs.filter(
      (npc) => npc.id !== npcId
    ),
    lastUpdatedAt: Date.now(),
  };

  saveNPCWorld(updated);

  return updated;
}

export function moveNPCInWorld(
  npcId: string,
  destinationLocationId: string
): NPC | undefined {
  const world = loadNPCWorld();

  const npcIndex =
    world.npcs.findIndex(
      (npc) => npc.id === npcId
    );

  if (npcIndex === -1) {
    return undefined;
  }

  const npc =
    world.npcs[npcIndex];

  if (
    npc.currentLocationId ===
    destinationLocationId
  ) {
    return npc;
  }

  const updatedNPC =
    moveNPC(
      npc,
      destinationLocationId,
      getCurrentHour()
    );

  const updatedNPCs = [
    ...world.npcs,
  ];

  updatedNPCs[npcIndex] =
    updatedNPC;

  saveNPCWorld({
    ...world,
    npcs: updatedNPCs,
    lastUpdatedAt: Date.now(),
    currentHour: getCurrentHour(),
  });

  return updatedNPC;
}

function maintainLocationPopulation(
  npcs: NPC[],
  locationId: string,
  hour: number
): NPC[] {
  const rule =
    getNPCSpawnRule(locationId);

  if (!rule) {
    return npcs;
  }

  const currentCount =
    npcs.filter(
      (npc) =>
        npc.currentLocationId ===
        locationId
    ).length;

  if (
    currentCount <
    rule.minNPCs
  ) {
    const missing =
      rule.minNPCs -
      currentCount;

    const additions: NPC[] =
      Array.from(
        { length: missing },
        () =>
          createWorldNPC(
            locationId,
            hour
          )
      );

    return [
      ...npcs,
      ...additions,
    ];
  }

  return npcs;
}

function removeExcessNPCs(
  npcs: NPC[],
  locationId: string
): NPC[] {
  const rule =
    getNPCSpawnRule(locationId);

  if (!rule) {
    return npcs;
  }

  const locationNPCs =
    npcs.filter(
      (npc) =>
        npc.currentLocationId ===
        locationId
    );

  if (
    locationNPCs.length <=
    rule.maxNPCs
  ) {
    return npcs;
  }

  const excess =
    locationNPCs.length -
    rule.maxNPCs;

  const removeIds = new Set(
    locationNPCs
      .slice(0, excess)
      .map((npc) => npc.id)
  );

  return npcs.filter(
    (npc) =>
      !removeIds.has(npc.id)
  );
}

function processNPCMovement(
  npc: NPC,
  hour: number
): NPC {
  const elapsedMinutes =
    (Date.now() -
      npc.activityStartedAt) /
    60000;

  if (
    elapsedMinutes <
    npc.activityDurationMinutes
  ) {
    return npc;
  }

  const updated =
    updateNPCActivity(
      npc,
      hour
    );

  if (
    updated.destinationLocationId &&
    (
      updated.activity ===
        "travelling" ||
      updated.activity ===
        "driving"
    )
  ) {
    return moveNPC(
      updated,
      updated.destinationLocationId,
      hour
    );
  }

  return updated;
}

export function updateNPCWorld(): NPCWorldState {
  const world = loadNPCWorld();

  const hour =
    getCurrentHour();

  let npcs = world.npcs.map(
    (npc) =>
      processNPCMovement(
        npc,
        hour
      )
  );

  for (const locationId of LOCATION_IDS) {
    npcs =
      maintainLocationPopulation(
        npcs,
        locationId,
        hour
      );

    npcs =
      removeExcessNPCs(
        npcs,
        locationId
      );
  }

  const updated: NPCWorldState = {
    ...world,
    npcs,
    lastUpdatedAt: Date.now(),
    currentHour: hour,
  };

  saveNPCWorld(updated);

  return updated;
}

export function refreshNPCWorld(): NPCWorldState {
  return updateNPCWorld();
}

export function getNPCsByRole(
  role: NPCRole
): NPC[] {
  const world = loadNPCWorld();

  return world.npcs.filter(
    (npc) => npc.role === role
  );
}

export function getNPCsByActivity(
  activity: NPCActivity
): NPC[] {
  const world = loadNPCWorld();

  return world.npcs.filter(
    (npc) =>
      npc.activity === activity
  );
}

export function getNPCsByLocation(
  locationId: string
): NPC[] {
  return getNPCsAtLocation(
    locationId
  );
}

export function getNPCWorldSummary(): NPCWorldSummary {
  const world = loadNPCWorld();

  const locations: Record<
    string,
    number
  > = {};

  const activities = {} as Record<
    NPCActivity,
    number
  >;

  const roles = {} as Record<
    NPCRole,
    number
  >;

  for (const locationId of LOCATION_IDS) {
    locations[locationId] = 0;
  }

  for (const npc of world.npcs) {
    locations[
      npc.currentLocationId
    ] =
      (locations[
        npc.currentLocationId
      ] ?? 0) + 1;

    activities[npc.activity] =
      (activities[npc.activity] ??
        0) + 1;

    roles[npc.role] =
      (roles[npc.role] ?? 0) + 1;
  }

  return {
    totalNPCs:
      world.npcs.length,
    locations,
    activities,
    roles,
  };
}

export function getLocationPopulation(
  locationId: string
): number {
  return getNPCsAtLocation(
    locationId
  ).length;
}

export function getLocationPopulationStatus(
  locationId: string
): {
  population: number;
  minimum: number;
  maximum: number;
  status:
    | "quiet"
    | "normal"
    | "busy"
    | "crowded";
} {
  const rule =
    getNPCSpawnRule(locationId);

  const population =
    getLocationPopulation(
      locationId
    );

  if (!rule) {
    return {
      population,
      minimum: 0,
      maximum: 0,
      status:
        population === 0
          ? "quiet"
          : "normal",
    };
  }

  const range =
    rule.maxNPCs -
    rule.minNPCs;

  const busyThreshold =
    rule.minNPCs +
    Math.floor(range * 0.5);

  const crowdedThreshold =
    rule.minNPCs +
    Math.floor(range * 0.8);

  let status:
    | "quiet"
    | "normal"
    | "busy"
    | "crowded";

  if (
    population <
    rule.minNPCs
  ) {
    status = "quiet";
  } else if (
    population >=
    crowdedThreshold
  ) {
    status = "crowded";
  } else if (
    population >=
    busyThreshold
  ) {
    status = "busy";
  } else {
    status = "normal";
  }

  return {
    population,
    minimum: rule.minNPCs,
    maximum: rule.maxNPCs,
    status,
  };
}

export function getNPCsNearPlayer(
  locationId: string,
  limit = 10
): NPC[] {
  return getNPCsAtLocation(
    locationId
  ).slice(0, limit);
}

export function getActiveNPCs(
  locationId?: string
): NPC[] {
  const world = loadNPCWorld();

  const npcs = locationId
    ? world.npcs.filter(
        (npc) =>
          npc.currentLocationId ===
          locationId
      )
    : world.npcs;

  return npcs.filter(
    (npc) =>
      npc.activity !==
      "sleeping"
  );
}

export function getWorkingNPCs(
  locationId?: string
): NPC[] {
  const npcs = locationId
    ? getNPCsAtLocation(
        locationId
      )
    : loadNPCWorld().npcs;

  return npcs.filter(
    (npc) =>
      npc.activity ===
        "working" ||
      npc.role ===
        "business_owner" ||
      npc.role ===
        "vendor"
  );
}

export function getSocialNPCs(
  locationId?: string
): NPC[] {
  const npcs = locationId
    ? getNPCsAtLocation(
        locationId
      )
    : loadNPCWorld().npcs;

  return npcs.filter(
    (npc) =>
      npc.activity ===
        "socializing" ||
      npc.activity ===
        "attending_event" ||
      npc.activity ===
        "relaxing"
  );
}

export function getNPCDestination(
  npcId: string
): string | undefined {
  return getNPCById(
    npcId
  )?.destinationLocationId;
}

export function resetNPCWorld(): NPCWorldState {
  const world =
    createInitialWorld();

  saveNPCWorld(world);

  return world;
}

export function clearNPCWorld(): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );
}