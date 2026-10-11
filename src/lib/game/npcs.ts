// src/lib/game/npcs.ts

export type NPCGender =
  | "male"
  | "female";

export type NPCActivity =
  | "walking"
  | "working"
  | "shopping"
  | "eating"
  | "socializing"
  | "exercising"
  | "driving"
  | "waiting"
  | "relaxing"
  | "attending_event"
  | "travelling"
  | "sleeping";

export type NPCRole =
  | "resident"
  | "worker"
  | "business_owner"
  | "student"
  | "driver"
  | "tourist"
  | "event_guest"
  | "security"
  | "vendor";

export interface NPC {
  id: string;
  name: string;
  gender: NPCGender;
  age: number;
  role: NPCRole;
  homeLocationId: string;
  currentLocationId: string;
  activity: NPCActivity;
  activityStartedAt: number;
  activityDurationMinutes: number;
  destinationLocationId?: string;
  occupation?: string;
  icon: string;
  personality: string;
  tags: string[];
}

export interface NPCActivityDefinition {
  id: NPCActivity;
  name: string;
  description: string;
  icon: string;
  allowedRoles: NPCRole[];
  preferredHours: {
    start: number;
    end: number;
  };
  locations: string[];
  movementChance: number;
}

export interface NPCSpawnRule {
  locationId: string;
  minNPCs: number;
  maxNPCs: number;
  preferredRoles: NPCRole[];
  tags: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// NPC ACTIVITY DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const NPC_ACTIVITIES: NPCActivityDefinition[] = [
  {
    id: "walking",
    name: "Walking",
    description: "Walking around the neighbourhood.",
    icon: "🚶",
    allowedRoles: [
      "resident",
      "worker",
      "student",
      "tourist",
      "event_guest",
      "driver",
    ],
    preferredHours: {
      start: 6,
      end: 23,
    },
    locations: [
      "garki",
      "wuse",
      "wuse-2",
      "jabi",
      "maitama",
      "gwarinpa",
      "cbd",
      "asokoro",
      "kado",
    ],
    movementChance: 0.8,
  },

  {
    id: "working",
    name: "Working",
    description: "Working at a business or workplace.",
    icon: "💼",
    allowedRoles: [
      "worker",
      "business_owner",
      "security",
      "vendor",
    ],
    preferredHours: {
      start: 7,
      end: 19,
    },
    locations: [
      "garki",
      "wuse",
      "wuse-2",
      "cbd",
      "jabi",
      "maitama",
      "gwarinpa",
      "kado",
    ],
    movementChance: 0.25,
  },

  {
    id: "shopping",
    name: "Shopping",
    description: "Browsing shops and buying things.",
    icon: "🛍️",
    allowedRoles: [
      "resident",
      "worker",
      "student",
      "tourist",
      "business_owner",
    ],
    preferredHours: {
      start: 9,
      end: 21,
    },
    locations: [
      "wuse",
      "wuse-2",
      "garki",
      "maitama",
      "jabi",
      "kado",
    ],
    movementChance: 0.45,
  },

  {
    id: "eating",
    name: "Eating",
    description: "Having a meal at a restaurant or food spot.",
    icon: "🍽️",
    allowedRoles: [
      "resident",
      "worker",
      "student",
      "tourist",
      "business_owner",
      "event_guest",
    ],
    preferredHours: {
      start: 11,
      end: 22,
    },
    locations: [
      "garki",
      "wuse",
      "wuse-2",
      "jabi",
      "maitama",
      "gwarinpa",
      "cbd",
    ],
    movementChance: 0.3,
  },

  {
    id: "socializing",
    name: "Socializing",
    description: "Meeting friends and talking with other people.",
    icon: "🗣️",
    allowedRoles: [
      "resident",
      "student",
      "tourist",
      "event_guest",
      "business_owner",
    ],
    preferredHours: {
      start: 16,
      end: 23,
    },
    locations: [
      "jabi",
      "wuse-2",
      "maitama",
      "gwarinpa",
      "wuse",
      "garki",
    ],
    movementChance: 0.4,
  },

  {
    id: "exercising",
    name: "Exercising",
    description: "Exercising or participating in fitness activities.",
    icon: "🏋️",
    allowedRoles: [
      "resident",
      "worker",
      "student",
      "tourist",
    ],
    preferredHours: {
      start: 6,
      end: 21,
    },
    locations: [
      "jabi",
      "maitama",
      "gwarinpa",
      "asokoro",
      "wuse-2",
    ],
    movementChance: 0.2,
  },

  {
    id: "driving",
    name: "Driving",
    description: "Travelling around Abuja by road.",
    icon: "🚗",
    allowedRoles: [
      "resident",
      "worker",
      "business_owner",
      "driver",
      "tourist",
    ],
    preferredHours: {
      start: 6,
      end: 23,
    },
    locations: [
      "garki",
      "wuse",
      "wuse-2",
      "jabi",
      "maitama",
      "gwarinpa",
      "cbd",
      "asokoro",
      "kado",
    ],
    movementChance: 0.75,
  },

  {
    id: "waiting",
    name: "Waiting",
    description: "Waiting for transport, friends or a service.",
    icon: "⏳",
    allowedRoles: [
      "resident",
      "worker",
      "student",
      "tourist",
      "driver",
    ],
    preferredHours: {
      start: 6,
      end: 23,
    },
    locations: [
      "garki",
      "wuse",
      "jabi",
      "cbd",
      "gwarinpa",
      "kado",
    ],
    movementChance: 0.1,
  },

  {
    id: "relaxing",
    name: "Relaxing",
    description: "Relaxing and enjoying the city.",
    icon: "😎",
    allowedRoles: [
      "resident",
      "student",
      "tourist",
      "event_guest",
      "business_owner",
    ],
    preferredHours: {
      start: 12,
      end: 23,
    },
    locations: [
      "jabi",
      "maitama",
      "asokoro",
      "gwarinpa",
      "wuse-2",
    ],
    movementChance: 0.15,
  },

  {
    id: "attending_event",
    name: "Attending Event",
    description: "Attending a live event in the city.",
    icon: "🎉",
    allowedRoles: [
      "resident",
      "student",
      "tourist",
      "event_guest",
      "business_owner",
    ],
    preferredHours: {
      start: 10,
      end: 23,
    },
    locations: [
      "jabi",
      "wuse",
      "wuse-2",
      "maitama",
      "garki",
      "cbd",
    ],
    movementChance: 0.65,
  },

  {
    id: "travelling",
    name: "Travelling",
    description: "Moving between Abuja locations.",
    icon: "🚌",
    allowedRoles: [
      "resident",
      "worker",
      "student",
      "tourist",
      "driver",
      "business_owner",
    ],
    preferredHours: {
      start: 6,
      end: 23,
    },
    locations: [
      "garki",
      "wuse",
      "wuse-2",
      "jabi",
      "maitama",
      "gwarinpa",
      "cbd",
      "asokoro",
      "kado",
    ],
    movementChance: 0.9,
  },

  {
    id: "sleeping",
    name: "Sleeping",
    description: "Resting at home during the night.",
    icon: "😴",
    allowedRoles: [
      "resident",
      "worker",
      "student",
      "business_owner",
      "driver",
      "tourist",
    ],
    preferredHours: {
      start: 0,
      end: 6,
    },
    locations: [
      "garki",
      "wuse",
      "wuse-2",
      "jabi",
      "maitama",
      "gwarinpa",
      "cbd",
      "asokoro",
      "kado",
    ],
    movementChance: 0.02,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPAWN RULES
// ─────────────────────────────────────────────────────────────────────────────

export const NPC_SPAWN_RULES: NPCSpawnRule[] = [
  {
    locationId: "garki",
    minNPCs: 8,
    maxNPCs: 20,
    preferredRoles: [
      "resident",
      "worker",
      "vendor",
      "driver",
    ],
    tags: ["market", "transport", "food"],
  },

  {
    locationId: "wuse",
    minNPCs: 10,
    maxNPCs: 25,
    preferredRoles: [
      "resident",
      "worker",
      "business_owner",
      "vendor",
    ],
    tags: ["market", "shopping", "business"],
  },

  {
    locationId: "wuse-2",
    minNPCs: 8,
    maxNPCs: 20,
    preferredRoles: [
      "resident",
      "worker",
      "tourist",
      "business_owner",
    ],
    tags: ["nightlife", "fashion", "social"],
  },

  {
    locationId: "jabi",
    minNPCs: 12,
    maxNPCs: 30,
    preferredRoles: [
      "resident",
      "tourist",
      "student",
      "event_guest",
    ],
    tags: ["lake", "events", "social"],
  },

  {
    locationId: "maitama",
    minNPCs: 6,
    maxNPCs: 16,
    preferredRoles: [
      "resident",
      "business_owner",
      "worker",
      "tourist",
    ],
    tags: ["luxury", "business", "elite"],
  },

  {
    locationId: "gwarinpa",
    minNPCs: 10,
    maxNPCs: 24,
    preferredRoles: [
      "resident",
      "worker",
      "student",
      "vendor",
    ],
    tags: ["community", "family", "shopping"],
  },

  {
    locationId: "cbd",
    minNPCs: 12,
    maxNPCs: 28,
    preferredRoles: [
      "worker",
      "business_owner",
      "resident",
      "driver",
    ],
    tags: ["corporate", "business", "transport"],
  },

  {
    locationId: "asokoro",
    minNPCs: 5,
    maxNPCs: 14,
    preferredRoles: [
      "resident",
      "business_owner",
      "tourist",
    ],
    tags: ["luxury", "private", "estate"],
  },

  {
    locationId: "kado",
    minNPCs: 7,
    maxNPCs: 18,
    preferredRoles: [
      "resident",
      "worker",
      "business_owner",
      "tourist",
    ],
    tags: ["cars", "property", "development"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NPC NAMES
// ─────────────────────────────────────────────────────────────────────────────

const MALE_NAMES = [
  "Emeka",
  "Chinedu",
  "Daniel",
  "David",
  "Ibrahim",
  "Yusuf",
  "Samuel",
  "Tunde",
  "Victor",
  "Kelvin",
  "Michael",
  "Joshua",
  "Femi",
  "Musa",
  "Peter",
];

const FEMALE_NAMES = [
  "Amaka",
  "Ada",
  "Aisha",
  "Zainab",
  "Blessing",
  "Esther",
  "Grace",
  "Mary",
  "Joy",
  "Jennifer",
  "Faith",
  "Peace",
  "Ruth",
  "Chiamaka",
  "Fatima",
];

const OCCUPATIONS = [
  "Shop Assistant",
  "Chef",
  "Photographer",
  "Driver",
  "Software Developer",
  "Fashion Designer",
  "Journalist",
  "Event Planner",
  "Barber",
  "Food Vendor",
  "Business Consultant",
  "Security Officer",
  "Sales Representative",
  "Delivery Rider",
];

const PERSONALITIES = [
  "friendly",
  "ambitious",
  "social",
  "quiet",
  "energetic",
  "business-minded",
  "adventurous",
  "professional",
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function randomFrom<T>(items: T[]): T {
  return items[
    Math.floor(Math.random() * items.length)
  ];
}

function randomInt(
  min: number,
  max: number
): number {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function createNPCName(
  gender: NPCGender
): string {
  return gender === "male"
    ? randomFrom(MALE_NAMES)
    : randomFrom(FEMALE_NAMES);
}

function getActivityDefinition(
  activity: NPCActivity
): NPCActivityDefinition {
  return (
    NPC_ACTIVITIES.find(
      (item) => item.id === activity
    ) ?? NPC_ACTIVITIES[0]
  );
}

export function getNPCActivity(
  activityId: NPCActivity
): NPCActivityDefinition | undefined {
  return NPC_ACTIVITIES.find(
    (activity) => activity.id === activityId
  );
}

export function getNPCSpawnRule(
  locationId: string
): NPCSpawnRule | undefined {
  return NPC_SPAWN_RULES.find(
    (rule) => rule.locationId === locationId
  );
}

export function getNPCActivitiesForLocation(
  locationId: string
): NPCActivityDefinition[] {
  return NPC_ACTIVITIES.filter((activity) =>
    activity.locations.includes(locationId)
  );
}

export function getNPCActivitiesForHour(
  locationId: string,
  hour: number
): NPCActivityDefinition[] {
  const normalizedHour =
    ((hour % 24) + 24) % 24;

  return getNPCActivitiesForLocation(
    locationId
  ).filter((activity) => {
    const { start, end } =
      activity.preferredHours;

    if (start <= end) {
      return (
        normalizedHour >= start &&
        normalizedHour < end
      );
    }

    return (
      normalizedHour >= start ||
      normalizedHour < end
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY SELECTION
//
// Supports all existing calling styles so older/newer systems do not break:
//
// chooseNPCActivity(locationId, role, hour)
// chooseNPCActivity(npc, hour)
// chooseNPCActivity(hour, role)
// ─────────────────────────────────────────────────────────────────────────────

export function chooseNPCActivity(
  locationId: string,
  role: NPCRole,
  hour: number
): NPCActivity;

export function chooseNPCActivity(
  npc: NPC,
  hour: number
): NPCActivity;

export function chooseNPCActivity(
  hour: number,
  role: NPCRole
): NPCActivity;

export function chooseNPCActivity(
  first: string | number | NPC,
  second: NPCRole | number,
  third?: number
): NPCActivity {
  let locationId: string | undefined;
  let role: NPCRole;
  let hour: number;

  if (
    typeof first === "object" &&
    first !== null
  ) {
    locationId =
      first.currentLocationId;

    role =
      first.role;

    hour =
      typeof second === "number"
        ? second
        : new Date().getHours();
  } else if (
    typeof first === "string"
  ) {
    locationId = first;

    role =
      second as NPCRole;

    hour =
      typeof third === "number"
        ? third
        : new Date().getHours();
  } else {
    hour = first;

    role =
      second as NPCRole;
  }

  const possible =
    locationId
      ? getNPCActivitiesForHour(
          locationId,
          hour
        ).filter((activity) =>
          activity.allowedRoles.includes(
            role
          )
        )
      : NPC_ACTIVITIES.filter(
          (activity) => {
            const {
              start,
              end,
            } = activity.preferredHours;

            const normalizedHour =
              ((hour % 24) + 24) % 24;

            const inRange =
              start <= end
                ? normalizedHour >= start &&
                  normalizedHour < end
                : normalizedHour >= start ||
                  normalizedHour < end;

            return (
              inRange &&
              activity.allowedRoles.includes(
                role
              )
            );
          }
        );

  if (possible.length === 0) {
    return "walking";
  }

  const weighted: NPCActivityDefinition[] =
    [];

  for (const activity of possible) {
    const weight = Math.max(
      1,
      Math.round(
        activity.movementChance * 10
      )
    );

    for (
      let i = 0;
      i < weight;
      i += 1
    ) {
      weighted.push(activity);
    }
  }

  return randomFrom(weighted).id;
}

// ─────────────────────────────────────────────────────────────────────────────
// NPC CREATION
// ─────────────────────────────────────────────────────────────────────────────

export function createNPC(
  locationId: string,
  hour = new Date().getHours(),
  preferredRole?: NPCRole
): NPC {
  const rule =
    getNPCSpawnRule(locationId);

  const role =
    preferredRole ??
    randomFrom(
      rule?.preferredRoles ?? [
        "resident",
        "worker",
        "student",
        "tourist",
      ]
    );

  const gender: NPCGender =
    Math.random() > 0.5
      ? "male"
      : "female";

  const activity =
    chooseNPCActivity(
      locationId,
      role,
      hour
    );

  const definition =
    getActivityDefinition(activity);

  const otherLocations =
    NPC_SPAWN_RULES.filter(
      (spawn) =>
        spawn.locationId !==
        locationId
    );

  const destination =
    activity === "travelling" ||
    activity === "driving"
      ? otherLocations.length > 0
        ? randomFrom(
            otherLocations
          ).locationId
        : undefined
      : undefined;

  return {
    id: `npc-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,

    name: createNPCName(gender),

    gender,

    age: randomInt(18, 58),

    role,

    homeLocationId:
      locationId,

    currentLocationId:
      locationId,

    activity,

    activityStartedAt:
      Date.now(),

    activityDurationMinutes:
      randomInt(10, 60),

    destinationLocationId:
      destination,

    occupation:
      role === "worker" ||
      role === "business_owner" ||
      role === "vendor"
        ? randomFrom(
            OCCUPATIONS
          )
        : undefined,

    icon:
      gender === "male"
        ? "👨🏿"
        : "👩🏿",

    personality:
      randomFrom(
        PERSONALITIES
      ),

    tags: [
      role,
      activity,
      definition.name.toLowerCase(),
    ],
  };
}

export function spawnNPCs(
  locationId: string,
  count?: number,
  hour = new Date().getHours()
): NPC[] {
  const rule =
    getNPCSpawnRule(locationId);

  const amount =
    count ??
    randomInt(
      rule?.minNPCs ?? 5,
      rule?.maxNPCs ?? 15
    );

  return Array.from(
    { length: amount },
    () =>
      createNPC(
        locationId,
        hour
      )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NPC ACTIVITY UPDATES
// ─────────────────────────────────────────────────────────────────────────────

export function updateNPCActivity(
  npc: NPC,
  hour = new Date().getHours()
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

  const activity =
    chooseNPCActivity(
      npc,
      hour
    );

  const otherLocations =
    NPC_SPAWN_RULES.filter(
      (spawn) =>
        spawn.locationId !==
        npc.currentLocationId
    );

  const destination =
    activity === "travelling" ||
    activity === "driving"
      ? otherLocations.length > 0
        ? randomFrom(
            otherLocations
          ).locationId
        : undefined
      : undefined;

  return {
    ...npc,
    activity,
    activityStartedAt:
      Date.now(),
    activityDurationMinutes:
      randomInt(10, 60),
    destinationLocationId:
      destination,
    tags: [
      npc.role,
      activity,
    ],
  };
}

export function moveNPC(
  npc: NPC,
  destinationLocationId: string,
  hour = new Date().getHours()
): NPC {
  const activity =
    chooseNPCActivity(
      destinationLocationId,
      npc.role,
      hour
    );

  return {
    ...npc,

    currentLocationId:
      destinationLocationId,

    activity,

    activityStartedAt:
      Date.now(),

    activityDurationMinutes:
      randomInt(10, 60),

    destinationLocationId:
      undefined,

    tags: [
      npc.role,
      activity,
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NPC QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCsByActivity(
  npcs: NPC[],
  activity: NPCActivity
): NPC[] {
  return npcs.filter(
    (npc) =>
      npc.activity ===
      activity
  );
}

export function getNPCsByRole(
  npcs: NPC[],
  role: NPCRole
): NPC[] {
  return npcs.filter(
    (npc) =>
      npc.role === role
  );
}

export function getNPCsAtLocation(
  npcs: NPC[],
  locationId: string
): NPC[] {
  return npcs.filter(
    (npc) =>
      npc.currentLocationId ===
      locationId
  );
}

export function getNPCActivityCounts(
  npcs: NPC[]
): Record<NPCActivity, number> {
  const counts =
    {} as Record<
      NPCActivity,
      number
    >;

  for (
    const activity of NPC_ACTIVITIES
  ) {
    counts[activity.id] = 0;
  }

  for (const npc of npcs) {
    counts[npc.activity] += 1;
  }

  return counts;
}

export function getNPCSummary(
  npcs: NPC[]
) {
  const activities =
    getNPCActivityCounts(
      npcs
    );

  return {
    total: npcs.length,

    activities,

    workers:
      getNPCsByRole(
        npcs,
        "worker"
      ).length,

    residents:
      getNPCsByRole(
        npcs,
        "resident"
      ).length,

    students:
      getNPCsByRole(
        npcs,
        "student"
      ).length,

    tourists:
      getNPCsByRole(
        npcs,
        "tourist"
      ).length,

    businessOwners:
      getNPCsByRole(
        npcs,
        "business_owner"
      ).length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY / STATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCDisplayText(
  npc: NPC
): string {
  const activity =
    getNPCActivity(
      npc.activity
    );

  return `${npc.name} is ${
    activity?.name.toLowerCase() ??
    npc.activity
  }.`;
}

export function getNPCIcon(
  npc: NPC
): string {
  return npc.icon;
}

export function isNPCSleeping(
  npc: NPC,
  hour = new Date().getHours()
): boolean {
  const normalizedHour =
    ((hour % 24) + 24) % 24;

  if (
    normalizedHour >= 0 &&
    normalizedHour < 6
  ) {
    return true;
  }

  return npc.activity ===
    "sleeping";
}

export function resetNPCActivity(
  npc: NPC,
  hour = new Date().getHours()
): NPC {
  return {
    ...npc,

    activity:
      chooseNPCActivity(
        npc,
        hour
      ),

    activityStartedAt:
      Date.now(),

    activityDurationMinutes:
      randomInt(10, 60),

    destinationLocationId:
      undefined,
  };
}