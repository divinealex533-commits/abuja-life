import {
  NPC,
} from "@/lib/game/npcs";

import {
  NPCSimulationState,
  NPCSimulationResult,
  runNPCSimulationTick,
  getSimulationLocationCounts,
  getSimulationActivityCounts,
} from "@/lib/game/npcSimulation";

import {
  NPCEventContext,
  NPCEventReactionResult,
  processNPCCityEvent,
} from "@/lib/game/npcCityEvents";

export interface NPCCitySimulationState {
  simulation: NPCSimulationState;
  activeEvents: NPCEventContext[];
  lastEventUpdateAt: number;
}

export interface NPCCitySimulationResult {
  state: NPCCitySimulationState;
  simulationResult: NPCSimulationResult;
  eventResults: NPCEventReactionResult[];
}

export interface NPCCitySummary {
  totalNPCs: number;
  activeEvents: number;
  simulationTick: number;
  locations: Record<string, number>;
  activities: Record<string, number>;
  eventReactions: number;
  eventAttendees: number;
  eventMovements: number;
}

/**
 * Create a city-wide NPC simulation.
 */
export function createNPCCitySimulation(
  npcs: NPC[],
  hour = new Date().getHours(),
  activeEvents: NPCEventContext[] = []
): NPCCitySimulationState {
  const simulation: NPCSimulationState = {
    npcs: [...npcs],
    currentHour: hour,
    lastUpdatedAt: Date.now(),
    simulationTick: 0,
  };

  return {
    simulation,
    activeEvents: activeEvents.filter(
      (event) => event.active
    ),
    lastEventUpdateAt: Date.now(),
  };
}

/**
 * Update the active event list.
 */
export function setNPCCityEvents(
  state: NPCCitySimulationState,
  events: NPCEventContext[]
): NPCCitySimulationState {
  return {
    ...state,
    activeEvents: events.filter(
      (event) => event.active
    ),
    lastEventUpdateAt: Date.now(),
  };
}

/**
 * Add one active city event.
 */
export function addNPCCityEvent(
  state: NPCCitySimulationState,
  event: NPCEventContext
): NPCCitySimulationState {
  const existing =
    state.activeEvents.filter(
      (item) =>
        item.eventId !== event.eventId
    );

  return {
    ...state,
    activeEvents: event.active
      ? [...existing, event]
      : existing,
    lastEventUpdateAt: Date.now(),
  };
}

/**
 * Remove an event from the NPC simulation.
 */
export function removeNPCCityEvent(
  state: NPCCitySimulationState,
  eventId: string
): NPCCitySimulationState {
  return {
    ...state,
    activeEvents:
      state.activeEvents.filter(
        (event) =>
          event.eventId !== eventId
      ),
    lastEventUpdateAt: Date.now(),
  };
}

/**
 * Run one city simulation tick.
 *
 * Normal NPC routines run first.
 * Active city events then override the behavior
 * of NPCs affected by those events.
 */
export function runNPCCitySimulationTick(
  state: NPCCitySimulationState,
  hour = new Date().getHours()
): NPCCitySimulationResult {
  const simulationResult =
    runNPCSimulationTick(
      state.simulation,
      hour
    );

  let currentNPCs =
    simulationResult.state.npcs;

  const eventResults: NPCEventReactionResult[] =
    [];

  for (const event of state.activeEvents) {
    if (!event.active) {
      continue;
    }

    const results =
      processNPCCityEvent(
        currentNPCs,
        event
      );

    eventResults.push(
      ...results
    );

    currentNPCs =
      results.map(
        (result) => result.npc
      );
  }

  const finalSimulationState: NPCSimulationState =
    {
      ...simulationResult.state,
      npcs: currentNPCs,
      lastUpdatedAt: Date.now(),
    };

  return {
    state: {
      ...state,
      simulation:
        finalSimulationState,
      lastEventUpdateAt:
        Date.now(),
    },
    simulationResult: {
      ...simulationResult,
      state:
        finalSimulationState,
    },
    eventResults,
  };
}

/**
 * Run multiple city simulation ticks.
 */
export function runNPCCitySimulationTicks(
  state: NPCCitySimulationState,
  hours: number[]
): NPCCitySimulationResult {
  let currentState = state;

  let lastResult:
    | NPCCitySimulationResult
    | null = null;

  for (const hour of hours) {
    lastResult =
      runNPCCitySimulationTick(
        currentState,
        hour
      );

    currentState =
      lastResult.state;
  }

  if (!lastResult) {
    const emptyResult: NPCSimulationResult =
      {
        state:
          currentState.simulation,
        results: [],
        summary: {
          processed: 0,
          moved: 0,
          changedActivity: 0,
          sleeping: 0,
          working: 0,
          socializing: 0,
          travelling: 0,
        },
      };

    return {
      state: currentState,
      simulationResult:
        emptyResult,
      eventResults: [],
    };
  }

  return lastResult;
}

/**
 * Get NPCs currently at an event location.
 */
export function getNPCsAtEventLocations(
  state: NPCCitySimulationState
): NPC[] {
  const eventLocations =
    new Set(
      state.activeEvents.map(
        (event) =>
          event.locationId
      )
    );

  return state.simulation.npcs.filter(
    (npc) =>
      eventLocations.has(
        npc.currentLocationId
      )
  );
}

/**
 * Get all NPCs currently affected by active events.
 */
export function getEventAffectedNPCs(
  state: NPCCitySimulationState
): NPC[] {
  const locations =
    new Set(
      state.activeEvents.map(
        (event) =>
          event.locationId
      )
    );

  return state.simulation.npcs.filter(
    (npc) =>
      locations.has(
        npc.currentLocationId
      ) &&
      npc.activity !==
        "sleeping"
  );
}

/**
 * Get active events for a particular location.
 */
export function getNPCCityEventsAtLocation(
  state: NPCCitySimulationState,
  locationId: string
): NPCEventContext[] {
  return state.activeEvents.filter(
    (event) =>
      event.locationId ===
      locationId &&
      event.active
  );
}

/**
 * Get event reaction count from the latest tick.
 */
export function getCityEventReactionCount(
  result: NPCCitySimulationResult
): number {
  return result.eventResults.filter(
    (reaction) =>
      reaction.reaction !== "ignore"
  ).length;
}

/**
 * Get event attendee count from the latest tick.
 */
export function getCityEventAttendeeCount(
  result: NPCCitySimulationResult
): number {
  return result.eventResults.filter(
    (reaction) =>
      reaction.reaction === "attend"
  ).length;
}

/**
 * Get NPC movement caused by city events.
 */
export function getCityEventMovementCount(
  result: NPCCitySimulationResult
): number {
  return result.eventResults.filter(
    (reaction) =>
      reaction.moved
  ).length;
}

/**
 * Create a complete city summary.
 */
export function getNPCCitySummary(
  state: NPCCitySimulationState,
  latestResult?: NPCCitySimulationResult
): NPCCitySummary {
  const npcs =
    state.simulation.npcs;

  const eventResults =
    latestResult?.eventResults ?? [];

  return {
    totalNPCs:
      npcs.length,

    activeEvents:
      state.activeEvents.length,

    simulationTick:
      state.simulation.simulationTick,

    locations:
      getSimulationLocationCounts(
        npcs
      ),

    activities:
      getSimulationActivityCounts(
        npcs
      ),

    eventReactions:
      eventResults.filter(
        (result) =>
          result.reaction !==
          "ignore"
      ).length,

    eventAttendees:
      eventResults.filter(
        (result) =>
          result.reaction ===
          "attend"
      ).length,

    eventMovements:
      eventResults.filter(
        (result) =>
          result.moved
      ).length,
  };
}

/**
 * Determine whether the city simulation should
 * process another tick.
 */
export function shouldUpdateNPCCitySimulation(
  state: NPCCitySimulationState,
  hour = new Date().getHours()
): boolean {
  return (
    state.simulation.currentHour !==
      hour ||
    Date.now() -
      state.simulation.lastUpdatedAt >=
      60_000
  );
}

/**
 * Replace the NPC population while preserving
 * the current city simulation.
 */
export function replaceNPCCityPopulation(
  state: NPCCitySimulationState,
  npcs: NPC[]
): NPCCitySimulationState {
  return {
    ...state,
    simulation: {
      ...state.simulation,
      npcs: [...npcs],
      lastUpdatedAt: Date.now(),
    },
  };
}

/**
 * Get NPCs participating in an event at a
 * particular location.
 */
export function getEventParticipantsAtLocation(
  result: NPCCitySimulationResult,
  locationId: string
): NPC[] {
  return result.eventResults
    .filter(
      (reaction) =>
        reaction.newLocationId ===
        locationId &&
        reaction.reaction !==
          "ignore"
    )
    .map(
      (reaction) =>
        reaction.npc
    );
}