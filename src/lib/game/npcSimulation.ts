import {
  NPC,
  NPCActivity,
} from "@/lib/game/npcs";

import {
  runNPCWorldRoutine,
  NPCRoutineResult,
  NPCRoutineSummary,
} from "@/lib/game/npcRoutine";

export interface NPCSimulationState {
  npcs: NPC[];
  currentHour: number;
  lastUpdatedAt: number;
  simulationTick: number;
}

export interface NPCSimulationResult {
  state: NPCSimulationState;
  results: NPCRoutineResult[];
  summary: NPCRoutineSummary;
}

/**
 * Create a fresh simulation state.
 */
export function createNPCSimulation(
  npcs: NPC[],
  hour = new Date().getHours()
): NPCSimulationState {
  return {
    npcs: [...npcs],
    currentHour: hour,
    lastUpdatedAt: Date.now(),
    simulationTick: 0,
  };
}

/**
 * Advance the NPC simulation by one city tick.
 */
export function runNPCSimulationTick(
  state: NPCSimulationState,
  hour = new Date().getHours()
): NPCSimulationResult {
  const routine = runNPCWorldRoutine(
    state.npcs,
    hour
  );

  const nextState: NPCSimulationState = {
    npcs: routine.npcs,
    currentHour: hour,
    lastUpdatedAt: Date.now(),
    simulationTick:
      state.simulationTick + 1,
  };

  return {
    state: nextState,
    results: routine.results,
    summary: routine.summary,
  };
}

/**
 * Run several simulation ticks.
 */
export function runNPCSimulationTicks(
  state: NPCSimulationState,
  hours: number[]
): NPCSimulationResult {
  let currentState = state;
  let allResults: NPCRoutineResult[] = [];

  for (const hour of hours) {
    const result = runNPCSimulationTick(
      currentState,
      hour
    );

    currentState = result.state;
    allResults = [
      ...allResults,
      ...result.results,
    ];
  }

  return {
    state: currentState,
    results: allResults,
    summary: createCombinedSummary(
      allResults
    ),
  };
}

/**
 * Combine multiple routine results into one
 * simulation summary.
 */
export function createCombinedSummary(
  results: NPCRoutineResult[]
): NPCRoutineSummary {
  return {
    processed: results.length,

    moved: results.filter(
      (result) => result.moved
    ).length,

    changedActivity: results.filter(
      (result) =>
        result.previousActivity !==
        result.newActivity
    ).length,

    sleeping: results.filter(
      (result) =>
        result.newActivity === "sleeping"
    ).length,

    working: results.filter(
      (result) =>
        result.newActivity === "working"
    ).length,

    socializing: results.filter(
      (result) =>
        result.newActivity ===
        "socializing"
    ).length,

    travelling: results.filter(
      (result) =>
        result.newActivity ===
        "travelling"
    ).length,
  };
}

/**
 * Get NPCs currently doing a specific activity.
 */
export function getSimulationNPCsByActivity(
  npcs: NPC[],
  activity: NPCActivity
): NPC[] {
  return npcs.filter(
    (npc) => npc.activity === activity
  );
}

/**
 * Get NPCs currently located in an area.
 */
export function getSimulationNPCsByLocation(
  npcs: NPC[],
  locationId: string
): NPC[] {
  return npcs.filter(
    (npc) =>
      npc.currentLocationId === locationId
  );
}

/**
 * Get a population count for every location.
 */
export function getSimulationLocationCounts(
  npcs: NPC[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const npc of npcs) {
    const locationId =
      npc.currentLocationId;

    counts[locationId] =
      (counts[locationId] || 0) + 1;
  }

  return counts;
}

/**
 * Get activity counts across the whole city.
 */
export function getSimulationActivityCounts(
  npcs: NPC[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const npc of npcs) {
    const activity =
      npc.activity;

    counts[activity] =
      (counts[activity] || 0) + 1;
  }

  return counts;
}

/**
 * Get NPCs that are currently visible/active
 * in the simulated city.
 */
export function getActiveSimulationNPCs(
  npcs: NPC[]
): NPC[] {
  return npcs.filter(
    (npc) =>
      npc.activity !== "sleeping"
  );
}

/**
 * Get NPCs currently sleeping.
 */
export function getSleepingSimulationNPCs(
  npcs: NPC[]
): NPC[] {
  return npcs.filter(
    (npc) =>
      npc.activity === "sleeping"
  );
}

/**
 * Get NPCs currently working.
 */
export function getWorkingSimulationNPCs(
  npcs: NPC[]
): NPC[] {
  return npcs.filter(
    (npc) =>
      npc.activity === "working"
  );
}

/**
 * Get NPCs currently travelling.
 */
export function getTravellingSimulationNPCs(
  npcs: NPC[]
): NPC[] {
  return npcs.filter(
    (npc) =>
      npc.activity === "travelling"
  );
}

/**
 * Get NPCs currently socializing.
 */
export function getSocialSimulationNPCs(
  npcs: NPC[]
): NPC[] {
  return npcs.filter(
    (npc) =>
      npc.activity ===
      "socializing"
  );
}

/**
 * Determine whether the simulation needs an update.
 */
export function shouldUpdateNPCSimulation(
  state: NPCSimulationState,
  hour: number
): boolean {
  return (
    state.currentHour !== hour ||
    Date.now() - state.lastUpdatedAt >=
      60_000
  );
}

/**
 * Return a simple city-life summary.
 */
export function getNPCSimulationSummary(
  state: NPCSimulationState
): {
  totalNPCs: number;
  activeNPCs: number;
  sleepingNPCs: number;
  workingNPCs: number;
  travellingNPCs: number;
  socializingNPCs: number;
  locations: number;
  simulationTick: number;
} {
  const active =
    getActiveSimulationNPCs(
      state.npcs
    );

  const sleeping =
    getSleepingSimulationNPCs(
      state.npcs
    );

  const working =
    getWorkingSimulationNPCs(
      state.npcs
    );

  const travelling =
    getTravellingSimulationNPCs(
      state.npcs
    );

  const socializing =
    getSocialSimulationNPCs(
      state.npcs
    );

  const locationIds =
    new Set(
      state.npcs.map(
        (npc) =>
          npc.currentLocationId
      )
    );

  return {
    totalNPCs: state.npcs.length,
    activeNPCs: active.length,
    sleepingNPCs: sleeping.length,
    workingNPCs: working.length,
    travellingNPCs: travelling.length,
    socializingNPCs: socializing.length,
    locations: locationIds.size,
    simulationTick:
      state.simulationTick,
  };
}