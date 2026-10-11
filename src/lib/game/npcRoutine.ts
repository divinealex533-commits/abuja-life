import {
  NPC,
  NPCActivity,
} from "@/lib/game/npcs";
import {
  getNPCScheduleDecision,
} from "@/lib/game/npcSchedule";

export interface NPCRoutineResult {
  npc: NPC;
  previousActivity: NPCActivity;
  newActivity: NPCActivity;
  previousLocationId: string;
  newLocationId: string;
  moved: boolean;
  reason: string;
}

export interface NPCRoutineSummary {
  processed: number;
  moved: number;
  changedActivity: number;
  sleeping: number;
  working: number;
  socializing: number;
  travelling: number;
}

/**
 * Apply the daily schedule decision to one NPC.
 */
export function runNPCRoutine(
  npc: NPC,
  hour: number
): NPCRoutineResult {
  const previousActivity = npc.activity;
  const previousLocationId = npc.currentLocationId;

  const decision = getNPCScheduleDecision(
    npc,
    hour
  );

  let updatedNPC: NPC = {
    ...npc,
    activity: decision.activity,
    activityStartedAt: Date.now(),
    activityDurationMinutes:
      Math.max(
        30,
        npc.activityDurationMinutes || 60
      ),
  };

  let moved = false;

  if (
    decision.shouldMove &&
    decision.preferredDestination &&
    decision.preferredDestination !==
      npc.currentLocationId
  ) {
    updatedNPC = {
      ...updatedNPC,
      currentLocationId:
        decision.preferredDestination,
      destinationLocationId: undefined,
    };

    moved = true;
  }

  return {
    npc: updatedNPC,
    previousActivity,
    newActivity: updatedNPC.activity,
    previousLocationId,
    newLocationId: updatedNPC.currentLocationId,
    moved,
    reason: decision.reason,
  };
}

/**
 * Alias for updating one NPC through its routine.
 */
export function updateNPCByRoutine(
  npc: NPC,
  hour: number
): NPC {
  return runNPCRoutine(npc, hour).npc;
}

/**
 * Run the routine engine for an entire NPC population.
 */
export function runNPCWorldRoutine(
  npcs: NPC[],
  hour: number
): {
  npcs: NPC[];
  results: NPCRoutineResult[];
  summary: NPCRoutineSummary;
} {
  const results = npcs.map((npc) =>
    runNPCRoutine(npc, hour)
  );

  const updatedNPCs = results.map(
    (result) => result.npc
  );

  return {
    npcs: updatedNPCs,
    results,
    summary: getRoutineSummary(results),
  };
}

/**
 * Create a useful summary of what happened during
 * the routine update.
 */
export function getRoutineSummary(
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
 * Get all NPCs that moved during a routine update.
 */
export function getMovedNPCs(
  results: NPCRoutineResult[]
): NPCRoutineResult[] {
  return results.filter(
    (result) => result.moved
  );
}

/**
 * Get NPCs whose activity changed.
 */
export function getActivityChanges(
  results: NPCRoutineResult[]
): NPCRoutineResult[] {
  return results.filter(
    (result) =>
      result.previousActivity !==
      result.newActivity
  );
}

/**
 * Get NPCs currently performing a specific activity.
 */
export function getNPCsWithActivity(
  results: NPCRoutineResult[],
  activity: NPCActivity
): NPC[] {
  return results
    .filter(
      (result) =>
        result.newActivity === activity
    )
    .map((result) => result.npc);
}

/**
 * Get a simple human-readable description of a
 * routine update.
 */
export function getRoutineDescription(
  result: NPCRoutineResult
): string {
  if (result.moved) {
    return `${result.npc.name} moved from ${result.previousLocationId} to ${result.newLocationId} and is now ${result.newActivity}.`;
  }

  return `${result.npc.name} is now ${result.newActivity} at ${result.newLocationId}.`;
}