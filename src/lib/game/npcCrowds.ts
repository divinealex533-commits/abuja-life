import {
  NPC,
  NPCActivity,
} from "@/lib/game/npcs";

export type CrowdLevel =
  | "empty"
  | "quiet"
  | "normal"
  | "busy"
  | "packed"
  | "overflowing";

export type CrowdType =
  | "general"
  | "workers"
  | "shoppers"
  | "social"
  | "nightlife"
  | "event"
  | "tourists"
  | "students"
  | "families";

export interface NPCCrowd {
  locationId: string;
  totalNPCs: number;
  crowdLevel: CrowdLevel;
  density: number;
  dominantActivity: NPCActivity | null;
  dominantCrowdType: CrowdType;
  workers: number;
  shoppers: number;
  socializing: number;
  eventGuests: number;
  tourists: number;
  students: number;
  families: number;
  updatedAt: number;
}

export interface NPCCrowdSnapshot {
  crowds: NPCCrowd[];
  busiestLocationId: string | null;
  quietestLocationId: string | null;
  totalNPCs: number;
  averageDensity: number;
  updatedAt: number;
}

const CROWD_THRESHOLDS = {
  empty: 0,
  quiet: 4,
  normal: 10,
  busy: 20,
  packed: 35,
  overflowing: 50,
} as const;

const LOCATION_CAPACITY: Record<
  string,
  number
> = {
  garki: 45,
  wuse: 55,
  "wuse-2": 50,
  jabi: 60,
  maitama: 30,
  gwarinpa: 55,
  cbd: 65,
  asokoro: 30,
  kado: 40,
};

function getCrowdLevel(
  count: number
): CrowdLevel {
  if (
    count >=
    CROWD_THRESHOLDS.overflowing
  ) {
    return "overflowing";
  }

  if (
    count >=
    CROWD_THRESHOLDS.packed
  ) {
    return "packed";
  }

  if (
    count >=
    CROWD_THRESHOLDS.busy
  ) {
    return "busy";
  }

  if (
    count >=
    CROWD_THRESHOLDS.normal
  ) {
    return "normal";
  }

  if (
    count >=
    CROWD_THRESHOLDS.quiet
  ) {
    return "quiet";
  }

  return "empty";
}

function getDensity(
  locationId: string,
  count: number
): number {
  const capacity =
    LOCATION_CAPACITY[
      locationId
    ] ?? 50;

  return Math.min(
    100,
    Math.round(
      (count / capacity) * 100
    )
  );
}

function getActivityCounts(
  npcs: NPC[]
): Record<string, number> {
  const counts: Record<
    string,
    number
  > = {};

  for (const npc of npcs) {
    counts[npc.activity] =
      (counts[npc.activity] ?? 0) + 1;
  }

  return counts;
}

function getDominantActivity(
  npcs: NPC[]
): NPCActivity | null {
  if (npcs.length === 0) {
    return null;
  }

  const counts =
    getActivityCounts(npcs);

  let dominant: NPCActivity =
    npcs[0].activity;

  let highest = 0;

  for (const [activity, count] of Object.entries(
    counts
  )) {
    if (count > highest) {
      highest = count;
      dominant =
        activity as NPCActivity;
    }
  }

  return dominant;
}

function getCrowdTypeCounts(
  npcs: NPC[]
): Record<CrowdType, number> {
  const counts: Record<
    CrowdType,
    number
  > = {
    general: 0,
    workers: 0,
    shoppers: 0,
    social: 0,
    nightlife: 0,
    event: 0,
    tourists: 0,
    students: 0,
    families: 0,
  };

  for (const npc of npcs) {
    if (
      npc.role === "worker" ||
      npc.activity === "working"
    ) {
      counts.workers += 1;
    }

    if (
      npc.activity === "shopping"
    ) {
      counts.shoppers += 1;
    }

    if (
      npc.activity ===
        "socializing" ||
      npc.activity === "relaxing"
    ) {
      counts.social += 1;
    }

    if (
      npc.activity ===
      "attending_event"
    ) {
      counts.event += 1;
    }

    if (npc.role === "tourist") {
      counts.tourists += 1;
    }

    if (npc.role === "student") {
      counts.students += 1;
    }

    if (
      npc.tags.some(
        (tag) =>
          tag.toLowerCase() ===
          "family"
      )
    ) {
      counts.families += 1;
    }

    if (
      npc.activity === "driving" ||
      npc.activity === "walking" ||
      npc.activity === "travelling"
    ) {
      counts.general += 1;
    }
  }

  return counts;
}

function getDominantCrowdType(
  counts: Record<
    CrowdType,
    number
  >
): CrowdType {
  let dominant: CrowdType =
    "general";

  let highest = 0;

  for (const [type, count] of Object.entries(
    counts
  )) {
    if (count > highest) {
      highest = count;
      dominant =
        type as CrowdType;
    }
  }

  return dominant;
}

/**
 * Build crowd information for one location.
 */
export function calculateNPCCrowd(
  locationId: string,
  npcs: NPC[]
): NPCCrowd {
  const crowdTypeCounts =
    getCrowdTypeCounts(npcs);

  return {
    locationId,
    totalNPCs: npcs.length,
    crowdLevel:
      getCrowdLevel(npcs.length),
    density:
      getDensity(
        locationId,
        npcs.length
      ),
    dominantActivity:
      getDominantActivity(npcs),
    dominantCrowdType:
      getDominantCrowdType(
        crowdTypeCounts
      ),
    workers:
      crowdTypeCounts.workers,
    shoppers:
      crowdTypeCounts.shoppers,
    socializing:
      crowdTypeCounts.social,
    eventGuests:
      crowdTypeCounts.event,
    tourists:
      crowdTypeCounts.tourists,
    students:
      crowdTypeCounts.students,
    families:
      crowdTypeCounts.families,
    updatedAt: Date.now(),
  };
}

/**
 * Calculate crowds for an entire NPC population.
 */
export function calculateNPCCrowds(
  npcs: NPC[]
): NPCCrowd[] {
  const locationIds =
    new Set(
      npcs.map(
        (npc) =>
          npc.currentLocationId
      )
    );

  return Array.from(
    locationIds
  ).map((locationId) => {
    const locationNPCs =
      npcs.filter(
        (npc) =>
          npc.currentLocationId ===
          locationId
      );

    return calculateNPCCrowd(
      locationId,
      locationNPCs
    );
  });
}

/**
 * Get crowd information for one location.
 */
export function getNPCCrowd(
  npcs: NPC[],
  locationId: string
): NPCCrowd {
  const locationNPCs =
    npcs.filter(
      (npc) =>
        npc.currentLocationId ===
        locationId
    );

  return calculateNPCCrowd(
    locationId,
    locationNPCs
  );
}

/**
 * Create a complete city crowd snapshot.
 */
export function createNPCCrowdSnapshot(
  npcs: NPC[]
): NPCCrowdSnapshot {
  const crowds =
    calculateNPCCrowds(npcs);

  if (crowds.length === 0) {
    return {
      crowds: [],
      busiestLocationId: null,
      quietestLocationId: null,
      totalNPCs: 0,
      averageDensity: 0,
      updatedAt: Date.now(),
    };
  }

  const busiest =
    [...crowds].sort(
      (a, b) =>
        b.totalNPCs -
        a.totalNPCs
    )[0];

  const quietest =
    [...crowds].sort(
      (a, b) =>
        a.totalNPCs -
        b.totalNPCs
    )[0];

  const averageDensity =
    Math.round(
      crowds.reduce(
        (sum, crowd) =>
          sum + crowd.density,
        0
      ) / crowds.length
    );

  return {
    crowds,
    busiestLocationId:
      busiest.locationId,
    quietestLocationId:
      quietest.locationId,
    totalNPCs: npcs.length,
    averageDensity,
    updatedAt: Date.now(),
  };
}

/**
 * Get locations above a crowd threshold.
 */
export function getBusyLocations(
  crowds: NPCCrowd[]
): NPCCrowd[] {
  return crowds.filter(
    (crowd) =>
      crowd.crowdLevel === "busy" ||
      crowd.crowdLevel === "packed" ||
      crowd.crowdLevel ===
        "overflowing"
  );
}

/**
 * Get locations that are relatively quiet.
 */
export function getQuietLocations(
  crowds: NPCCrowd[]
): NPCCrowd[] {
  return crowds.filter(
    (crowd) =>
      crowd.crowdLevel === "empty" ||
      crowd.crowdLevel === "quiet"
  );
}

/**
 * Get locations currently packed with people.
 */
export function getPackedLocations(
  crowds: NPCCrowd[]
): NPCCrowd[] {
  return crowds.filter(
    (crowd) =>
      crowd.crowdLevel ===
        "packed" ||
      crowd.crowdLevel ===
        "overflowing"
  );
}

/**
 * Get the busiest location.
 */
export function getBusiestLocation(
  crowds: NPCCrowd[]
): NPCCrowd | null {
  if (crowds.length === 0) {
    return null;
  }

  return [...crowds].sort(
    (a, b) =>
      b.totalNPCs -
      a.totalNPCs
  )[0];
}

/**
 * Get the quietest location.
 */
export function getQuietestLocation(
  crowds: NPCCrowd[]
): NPCCrowd | null {
  if (crowds.length === 0) {
    return null;
  }

  return [...crowds].sort(
    (a, b) =>
      a.totalNPCs -
      b.totalNPCs
  )[0];
}

/**
 * Get locations dominated by workers.
 */
export function getWorkCrowdLocations(
  crowds: NPCCrowd[]
): NPCCrowd[] {
  return crowds.filter(
    (crowd) =>
      crowd.workers >
      crowd.socializing &&
      crowd.workers >
      crowd.shoppers
  );
}

/**
 * Get locations dominated by shoppers.
 */
export function getShoppingCrowdLocations(
  crowds: NPCCrowd[]
): NPCCrowd[] {
  return crowds.filter(
    (crowd) =>
      crowd.shoppers >
      crowd.workers &&
      crowd.shoppers >
      crowd.socializing
  );
}

/**
 * Get locations dominated by social activity.
 */
export function getSocialCrowdLocations(
  crowds: NPCCrowd[]
): NPCCrowd[] {
  return crowds.filter(
    (crowd) =>
      crowd.socializing >
      crowd.workers &&
      crowd.socializing >
      crowd.shoppers
  );
}

/**
 * Get event-heavy locations.
 */
export function getEventCrowdLocations(
  crowds: NPCCrowd[]
): NPCCrowd[] {
  return crowds.filter(
    (crowd) =>
      crowd.eventGuests > 0
  );
}

/**
 * Get a simple crowd label for UI.
 */
export function getCrowdLabel(
  level: CrowdLevel
): string {
  switch (level) {
    case "empty":
      return "Empty";

    case "quiet":
      return "Quiet";

    case "normal":
      return "Normal";

    case "busy":
      return "Busy";

    case "packed":
      return "Packed";

    case "overflowing":
      return "Overflowing";

    default:
      return "Normal";
  }
}

/**
 * Get a description of the crowd.
 */
export function getCrowdDescription(
  crowd: NPCCrowd
): string {
  if (
    crowd.crowdLevel ===
    "overflowing"
  ) {
    return `${crowd.totalNPCs} people are filling this area. Expect heavy activity and movement.`;
  }

  if (
    crowd.crowdLevel ===
    "packed"
  ) {
    return `${crowd.totalNPCs} people are currently gathered here. The area is very busy.`;
  }

  if (
    crowd.crowdLevel ===
    "busy"
  ) {
    return `${crowd.totalNPCs} people are active around this location.`;
  }

  if (
    crowd.crowdLevel ===
    "quiet"
  ) {
    return `${crowd.totalNPCs} people are currently around. The area is relatively quiet.`;
  }

  if (
    crowd.crowdLevel ===
    "empty"
  ) {
    return "There is very little NPC activity here right now.";
  }

  return `${crowd.totalNPCs} people are currently around this location.`;
}

/**
 * Check whether a location is crowded enough
 * to influence gameplay.
 */
export function isLocationCrowded(
  crowd: NPCCrowd
): boolean {
  return (
    crowd.crowdLevel === "busy" ||
    crowd.crowdLevel === "packed" ||
    crowd.crowdLevel ===
      "overflowing"
  );
}

/**
 * Get the crowd multiplier used by future
 * gameplay systems such as shops, events,
 * businesses and nightlife.
 */
export function getCrowdActivityMultiplier(
  crowd: NPCCrowd
): number {
  switch (crowd.crowdLevel) {
    case "empty":
      return 0.7;

    case "quiet":
      return 0.85;

    case "normal":
      return 1;

    case "busy":
      return 1.15;

    case "packed":
      return 1.3;

    case "overflowing":
      return 1.45;

    default:
      return 1;
  }
}