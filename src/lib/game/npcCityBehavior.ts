// src/lib/game/npcCityBehavior.ts

import {
  NPC,
  NPCActivity,
} from "@/lib/game/npcs";

import {
  NPCScheduleDecision,
  getNPCScheduleDecision,
} from "@/lib/game/npcSchedule";

// ─────────────────────────────────────────────────────────────────────────────
// CITY CONDITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type NPCCityWeather =
  | "clear"
  | "sunny"
  | "cloudy"
  | "rain"
  | "storm"
  | "hot";

export type NPCTrafficLevel =
  | "low"
  | "medium"
  | "high"
  | "very-high";

export type NPCCityMood =
  | "calm"
  | "normal"
  | "busy"
  | "excited"
  | "celebrating";

export interface NPCCityConditions {
  weather: NPCCityWeather;
  traffic: NPCTrafficLevel;
  mood: NPCCityMood;
  temperature?: number;
  activeEventLocationIds?: string[];
  constructionLocationIds?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIOUR RESULT
// ─────────────────────────────────────────────────────────────────────────────

export interface NPCCityBehaviorDecision {
  npc: NPC;
  activity: NPCActivity;
  shouldMove: boolean;
  destinationLocationId?: string;
  reason: string;
  weatherEffect: string;
  trafficEffect: string;
  eventEffect: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function chooseRandom<T>(
  values: T[]
): T | undefined {
  if (!values.length) {
    return undefined;
  }

  return values[
    Math.floor(
      Math.random() * values.length
    )
  ];
}

function uniqueLocations(
  locations: string[]
): string[] {
  return Array.from(
    new Set(locations)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER BEHAVIOUR
// ─────────────────────────────────────────────────────────────────────────────

function applyWeatherBehaviour(
  npc: NPC,
  activity: NPCActivity,
  conditions: NPCCityConditions
): {
  activity: NPCActivity;
  shouldMove: boolean;
  reason: string;
} {
  const {
    weather,
  } = conditions;

  if (
    weather === "storm"
  ) {
    if (
      [
        "walking",
        "exercising",
        "socializing",
      ].includes(activity)
    ) {
      return {
        activity: "relaxing",
        shouldMove: false,
        reason:
          "The storm is keeping people indoors.",
      };
    }

    return {
      activity,
      shouldMove: false,
      reason:
        "The storm is reducing movement around the city.",
    };
  }

  if (
    weather === "rain"
  ) {
    if (
      activity === "exercising"
    ) {
      return {
        activity: "relaxing",
        shouldMove: false,
        reason:
          "Rain has interrupted outdoor exercise.",
      };
    }

    if (
      activity === "walking"
    ) {
      return {
        activity: "waiting",
        shouldMove: false,
        reason:
          "The NPC is waiting for the rain to ease.",
      };
    }

    return {
      activity,
      shouldMove: false,
      reason:
        "Rain is reducing outdoor movement.",
    };
  }

  if (
    weather === "hot"
  ) {
    if (
      activity === "exercising"
    ) {
      return {
        activity: "relaxing",
        shouldMove: false,
        reason:
          "The hot weather is discouraging outdoor exercise.",
      };
    }

    return {
      activity,
      shouldMove: true,
      reason:
        "The hot weather is causing people to prefer shorter trips.",
    };
  }

  return {
    activity,
    shouldMove: true,
    reason:
      "Weather conditions are normal.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAFFIC BEHAVIOUR
// ─────────────────────────────────────────────────────────────────────────────

function applyTrafficBehaviour(
  npc: NPC,
  activity: NPCActivity,
  conditions: NPCCityConditions
): {
  shouldMove: boolean;
  reason: string;
} {
  const {
    traffic,
  } = conditions;

  if (
    traffic === "very-high"
  ) {
    if (
      [
        "travelling",
        "driving",
      ].includes(activity)
    ) {
      return {
        shouldMove: false,
        reason:
          "Heavy traffic is slowing the NPC down.",
      };
    }

    return {
      shouldMove: false,
      reason:
        "Very heavy traffic is reducing unnecessary movement.",
    };
  }

  if (
    traffic === "high"
  ) {
    if (
      activity === "driving" ||
      activity === "travelling"
    ) {
      return {
        shouldMove: false,
        reason:
          "Traffic is causing delays on the roads.",
      };
    }

    return {
      shouldMove: true,
      reason:
        "Traffic is busy but the city remains active.",
    };
  }

  return {
    shouldMove: true,
    reason:
      "Traffic is allowing normal movement.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT BEHAVIOUR
// ─────────────────────────────────────────────────────────────────────────────

function applyEventBehaviour(
  npc: NPC,
  activity: NPCActivity,
  conditions: NPCCityConditions
): {
  activity: NPCActivity;
  shouldMove: boolean;
  destinationLocationId?: string;
  reason: string;
} {
  const eventLocations =
    conditions.activeEventLocationIds ??
    [];

  if (
    eventLocations.includes(
      npc.currentLocationId
    )
  ) {
    if (
      [
        "resident",
        "student",
        "tourist",
        "event_guest",
        "business_owner",
      ].includes(npc.role)
    ) {
      return {
        activity: "attending_event",
        shouldMove: false,
        reason:
          "A city event is attracting people to this location.",
      };
    }
  }

  if (
    eventLocations.length > 0 &&
    [
      "tourist",
      "event_guest",
      "student",
      "resident",
    ].includes(npc.role)
  ) {
    const destination =
      chooseRandom(
        eventLocations.filter(
          (locationId) =>
            locationId !==
            npc.currentLocationId
        )
      );

    if (destination) {
      return {
        activity:
          "travelling",
        shouldMove: true,
        destinationLocationId:
          destination,
        reason:
          "A city event is attracting the NPC.",
      };
    }
  }

  return {
    activity,
    shouldMove: false,
    reason:
      "No nearby event is affecting this NPC.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUCTION BEHAVIOUR
// ─────────────────────────────────────────────────────────────────────────────

function applyConstructionBehaviour(
  npc: NPC,
  shouldMove: boolean,
  conditions: NPCCityConditions
): {
  shouldMove: boolean;
  destinationLocationId?: string;
  reason: string;
} {
  const constructionLocations =
    conditions.constructionLocationIds ??
    [];

  if (
    !constructionLocations.includes(
      npc.currentLocationId
    )
  ) {
    return {
      shouldMove,
      reason:
        "There is no construction disruption at the NPC's location.",
    };
  }

  const destination =
    chooseRandom(
      [
        "garki",
        "wuse",
        "wuse-2",
        "jabi",
        "maitama",
        "gwarinpa",
        "cbd",
        "asokoro",
        "kado",
      ].filter(
        (locationId) =>
          locationId !==
          npc.currentLocationId &&
          !constructionLocations.includes(
            locationId
          )
      )
    );

  return {
    shouldMove: true,
    destinationLocationId:
      destination,
    reason:
      "Construction is causing the NPC to avoid this area.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY MOOD
// ─────────────────────────────────────────────────────────────────────────────

function applyMoodBehaviour(
  npc: NPC,
  activity: NPCActivity,
  conditions: NPCCityConditions
): {
  activity: NPCActivity;
  shouldMove: boolean;
  reason: string;
} {
  const {
    mood,
  } = conditions;

  if (
    mood === "celebrating" ||
    mood === "excited"
  ) {
    if (
      [
        "resident",
        "student",
        "tourist",
        "event_guest",
        "business_owner",
      ].includes(npc.role)
    ) {
      if (
        activity === "relaxing" ||
        activity === "walking"
      ) {
        return {
          activity:
            "socializing",
          shouldMove: true,
          reason:
            "The city mood is encouraging people to socialize.",
        };
      }
    }
  }

  if (
    mood === "busy"
  ) {
    return {
      activity,
      shouldMove: true,
      reason:
        "The city is busy and NPCs are staying active.",
    };
  }

  if (
    mood === "calm"
  ) {
    return {
      activity,
      shouldMove: true,
      reason:
        "The calm city mood is reducing unnecessary activity.",
    };
  }

  return {
    activity,
    shouldMove: true,
    reason:
      "The city mood is normal.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DECISION
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCCityBehaviorDecision(
  npc: NPC,
  hour: number,
  conditions: NPCCityConditions
): NPCCityBehaviorDecision {
  const schedule =
    getNPCScheduleDecision(
      npc,
      hour
    );

  let activity =
    schedule.activity;

  let shouldMove =
    schedule.shouldMove;

  let destinationLocationId =
    schedule.preferredDestination;

  let reason =
    schedule.reason;

  let weatherEffect =
    "Weather has no major effect.";

  let trafficEffect =
    "Traffic has no major effect.";

  let eventEffect =
    "No active event is affecting this NPC.";

  // Weather
  const weatherResult =
    applyWeatherBehaviour(
      npc,
      activity,
      conditions
    );

  activity =
    weatherResult.activity;

  shouldMove =
    shouldMove &&
    weatherResult.shouldMove;

  weatherEffect =
    weatherResult.reason;

  // Traffic
  const trafficResult =
    applyTrafficBehaviour(
      npc,
      activity,
      conditions
    );

  shouldMove =
    shouldMove &&
    trafficResult.shouldMove;

  trafficEffect =
    trafficResult.reason;

  // Events
  const eventResult =
    applyEventBehaviour(
      npc,
      activity,
      conditions
    );

  if (
    eventResult.activity !==
    activity
  ) {
    activity =
      eventResult.activity;
  }

  if (
    eventResult.destinationLocationId
  ) {
    destinationLocationId =
      eventResult.destinationLocationId;
  }

  if (
    eventResult.shouldMove
  ) {
    shouldMove = true;
  }

  if (
    eventResult.reason !==
    "No nearby event is affecting this NPC."
  ) {
    eventEffect =
      eventResult.reason;
  }

  // Construction
  const constructionResult =
    applyConstructionBehaviour(
      npc,
      shouldMove,
      conditions
    );

  if (
    constructionResult.destinationLocationId
  ) {
    destinationLocationId =
      constructionResult.destinationLocationId;
  }

  if (
    constructionResult.shouldMove
  ) {
    shouldMove = true;
  }

  // City mood
  const moodResult =
    applyMoodBehaviour(
      npc,
      activity,
      conditions
    );

  activity =
    moodResult.activity;

  shouldMove =
    shouldMove &&
    moodResult.shouldMove;

  if (
    moodResult.reason !==
    "The city mood is normal."
  ) {
    reason =
      moodResult.reason;
  }

  // Prevent invalid self-destination.
  if (
    destinationLocationId ===
    npc.currentLocationId
  ) {
    destinationLocationId =
      undefined;
  }

  return {
    npc,
    activity,
    shouldMove,
    destinationLocationId,
    reason,
    weatherEffect,
    trafficEffect,
    eventEffect,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH CITY BEHAVIOUR
// ─────────────────────────────────────────────────────────────────────────────

export function processNPCsWithCityBehavior(
  npcs: NPC[],
  hour: number,
  conditions: NPCCityConditions
): NPCCityBehaviorDecision[] {
  return npcs.map(
    (npc) =>
      getNPCCityBehaviorDecision(
        npc,
        hour,
        conditions
      )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION CROWD EFFECT
// ─────────────────────────────────────────────────────────────────────────────

export function calculateLocationCrowdEffect(
  npcs: NPC[],
  locationId: string,
  conditions: NPCCityConditions
): number {
  const population =
    npcs.filter(
      (npc) =>
        npc.currentLocationId ===
        locationId
    ).length;

  let multiplier = 1;

  if (
    conditions.mood ===
      "excited" ||
    conditions.mood ===
      "celebrating"
  ) {
    multiplier += 0.25;
  }

  if (
    conditions.activeEventLocationIds?.includes(
      locationId
    )
  ) {
    multiplier += 0.5;
  }

  if (
    conditions.weather ===
      "rain" ||
    conditions.weather ===
      "storm"
  ) {
    multiplier -= 0.2;
  }

  return Math.max(
    0,
    Math.round(
      population *
        multiplier
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY BEHAVIOUR TEXT
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCCityBehaviorText(
  npc: NPC,
  hour: number,
  conditions: NPCCityConditions
): string {
  const decision =
    getNPCCityBehaviorDecision(
      npc,
      hour,
      conditions
    );

  return `${npc.name} is ${decision.activity.replace(
    "_",
    " "
  )}. ${decision.reason}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY CONDITIONS FACTORY
// ─────────────────────────────────────────────────────────────────────────────

export function createDefaultNPCCityConditions(): NPCCityConditions {
  return {
    weather: "clear",
    traffic: "medium",
    mood: "normal",
    activeEventLocationIds: [],
    constructionLocationIds: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION-SPECIFIC CONDITIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCLocationBehavior(
  npc: NPC,
  hour: number,
  locationId: string,
  conditions: NPCCityConditions
): NPCCityBehaviorDecision {
  const adjustedNPC: NPC = {
    ...npc,
    currentLocationId:
      locationId,
  };

  return getNPCCityBehaviorDecision(
    adjustedNPC,
    hour,
    conditions
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT CROWD CHECK
// ─────────────────────────────────────────────────────────────────────────────

export function isNPCAtActiveEvent(
  npc: NPC,
  conditions: NPCCityConditions
): boolean {
  return Boolean(
    conditions.activeEventLocationIds?.includes(
      npc.currentLocationId
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTDOOR ACTIVITY CHECK
// ─────────────────────────────────────────────────────────────────────────────

export function isNPCOutdoorActivity(
  activity: NPCActivity
): boolean {
  return [
    "walking",
    "exercising",
    "driving",
    "travelling",
    "socializing",
    "attending_event",
  ].includes(activity);
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY DISRUPTION CHECK
// ─────────────────────────────────────────────────────────────────────────────

export function isLocationDisrupted(
  locationId: string,
  conditions: NPCCityConditions
): boolean {
  const construction =
    conditions.constructionLocationIds ??
    [];

  return construction.includes(
    locationId
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFE DESTINATIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCSafeDestinations(
  npc: NPC,
  conditions: NPCCityConditions
): string[] {
  const blocked =
    conditions.constructionLocationIds ??
    [];

  const eventLocations =
    conditions.activeEventLocationIds ??
    [];

  const candidates =
    [
      "garki",
      "wuse",
      "wuse-2",
      "jabi",
      "maitama",
      "gwarinpa",
      "cbd",
      "asokoro",
      "kado",
    ];

  if (
    conditions.weather ===
      "rain" ||
    conditions.weather ===
      "storm"
  ) {
    return candidates.filter(
      (locationId) =>
        !blocked.includes(
          locationId
        ) &&
        (
          eventLocations.includes(
            locationId
          ) ||
          locationId ===
            npc.currentLocationId
        )
    );
  }

  return candidates.filter(
    (locationId) =>
      !blocked.includes(
        locationId
      ) &&
      locationId !==
        npc.currentLocationId
  );
}