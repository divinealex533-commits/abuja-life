// src/lib/game/npcSchedule.ts

import {
  NPC,
  NPCActivity,
  NPCRole,
  getNPCActivity,
  getNPCActivitiesForHour,
  chooseNPCActivity,
} from "@/lib/game/npcs";

export type NPCDayPeriod =
  | "early_morning"
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "late_night";

export interface NPCScheduleDecision {
  activity: NPCActivity;
  period: NPCDayPeriod;
  shouldMove: boolean;
  preferredDestination?: string;
  reason: string;
}

export interface NPCScheduleRule {
  role?: NPCRole[];
  activities: NPCActivity[];
  startHour: number;
  endHour: number;
  locations?: string[];
  destinationLocations?: string[];
  priority: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION DESTINATIONS
// ─────────────────────────────────────────────────────────────────────────────

const LOCATION_DESTINATIONS: Record<string, string[]> = {
  garki: ["garki", "wuse", "cbd"],
  wuse: ["wuse", "wuse-2", "garki", "cbd"],
  "wuse-2": ["wuse-2", "wuse", "jabi"],
  jabi: ["jabi", "wuse-2", "wuse"],
  maitama: ["maitama", "wuse-2", "cbd"],
  gwarinpa: ["gwarinpa", "wuse", "jabi"],
  cbd: ["cbd", "garki", "wuse", "maitama"],
  asokoro: ["asokoro", "maitama", "cbd"],
  kado: ["kado", "jabi", "wuse"],
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE DESTINATIONS
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_DESTINATIONS: Record<string, string[]> = {
  worker: ["cbd", "wuse", "garki"],
  business_owner: ["wuse", "wuse-2", "maitama", "cbd"],
  student: ["jabi", "wuse", "garki"],
  driver: ["garki", "wuse", "cbd", "jabi"],
  vendor: ["garki", "wuse", "jabi"],
  tourist: ["jabi", "maitama", "wuse-2", "kado"],
  event_guest: ["jabi", "wuse-2", "maitama"],
  security: ["cbd", "maitama", "asokoro", "wuse"],
  resident: ["garki", "wuse", "gwarinpa", "jabi"],
};

// ─────────────────────────────────────────────────────────────────────────────
// DAILY SCHEDULE RULES
// ─────────────────────────────────────────────────────────────────────────────

const SCHEDULE_RULES: NPCScheduleRule[] = [
  {
    role: ["worker", "business_owner", "student"],
    activities: ["travelling", "working"],
    startHour: 6,
    endHour: 9,
    priority: 10,
  },

  {
    role: ["worker", "business_owner"],
    activities: ["working"],
    startHour: 9,
    endHour: 17,
    priority: 10,
  },

  {
    role: ["student"],
    activities: ["working", "relaxing"],
    startHour: 8,
    endHour: 16,
    priority: 10,
  },

  {
    role: ["vendor"],
    activities: ["working", "shopping"],
    startHour: 7,
    endHour: 19,
    priority: 9,
  },

  {
    role: ["driver"],
    activities: ["driving", "waiting"],
    startHour: 6,
    endHour: 22,
    priority: 10,
  },

  {
    role: ["security"],
    activities: ["working", "walking"],
    startHour: 7,
    endHour: 23,
    priority: 9,
  },

  {
    role: [
      "resident",
      "worker",
      "business_owner",
      "student",
    ],
    activities: [
      "eating",
      "socializing",
      "shopping",
    ],
    startHour: 12,
    endHour: 14,
    priority: 6,
  },

  {
    role: [
      "resident",
      "worker",
      "business_owner",
      "student",
      "tourist",
    ],
    activities: [
      "socializing",
      "shopping",
      "eating",
      "exercising",
    ],
    startHour: 17,
    endHour: 21,
    priority: 8,
  },

  {
    role: ["tourist", "event_guest"],
    activities: [
      "walking",
      "socializing",
      "attending_event",
    ],
    startHour: 10,
    endHour: 23,
    priority: 8,
  },

  {
    role: [
      "resident",
      "worker",
      "business_owner",
      "student",
      "tourist",
    ],
    activities: ["sleeping"],
    startHour: 23,
    endHour: 6,
    priority: 10,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIME HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function hourInRange(
  hour: number,
  startHour: number,
  endHour: number
): boolean {
  const normalizedHour =
    ((hour % 24) + 24) % 24;

  if (startHour < endHour) {
    return (
      normalizedHour >= startHour &&
      normalizedHour < endHour
    );
  }

  return (
    normalizedHour >= startHour ||
    normalizedHour < endHour
  );
}

export function getNPCDayPeriod(
  hour: number
): NPCDayPeriod {
  const normalized =
    ((hour % 24) + 24) % 24;

  if (normalized >= 5 && normalized < 8) {
    return "early_morning";
  }

  if (normalized >= 8 && normalized < 12) {
    return "morning";
  }

  if (normalized >= 12 && normalized < 17) {
    return "afternoon";
  }

  if (normalized >= 17 && normalized < 21) {
    return "evening";
  }

  if (normalized >= 21 && normalized < 24) {
    return "night";
  }

  return "late_night";
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE RULE LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCScheduleRules(
  npc: NPC,
  hour: number
): NPCScheduleRule[] {
  return SCHEDULE_RULES
    .filter((rule) => {
      if (
        rule.role &&
        !rule.role.includes(npc.role)
      ) {
        return false;
      }

      if (
        rule.locations &&
        !rule.locations.includes(
          npc.currentLocationId
        )
      ) {
        return false;
      }

      return hourInRange(
        hour,
        rule.startHour,
        rule.endHour
      );
    })
    .sort(
      (a, b) =>
        b.priority - a.priority
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RANDOM HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function chooseFromList<T>(
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

// ─────────────────────────────────────────────────────────────────────────────
// DESTINATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getPreferredDestinations(
  npc: NPC
): string[] {
  const roleDestinations =
    ROLE_DESTINATIONS[npc.role] ?? [];

  const locationDestinations =
    LOCATION_DESTINATIONS[
      npc.currentLocationId
    ] ?? [];

  return Array.from(
    new Set([
      ...roleDestinations,
      ...locationDestinations,
    ])
  ).filter(
    (locationId) =>
      locationId !==
      npc.currentLocationId
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED ACTIVITY
// ─────────────────────────────────────────────────────────────────────────────

function chooseScheduledActivity(
  npc: NPC,
  hour: number
): NPCActivity | undefined {
  const validActivities =
    getNPCActivitiesForHour(
      npc.currentLocationId,
      hour
    ).filter((activity) => {
      return (
        activity.allowedRoles.length === 0 ||
        activity.allowedRoles.includes(
          npc.role
        )
      );
    });

  if (validActivities.length > 0) {
    const chosen =
      chooseFromList(validActivities);

    if (chosen) {
      return chosen.id;
    }
  }

  // IMPORTANT:
  // chooseNPCActivity requires:
  // locationId, role, hour
  return chooseNPCActivity(
    npc.currentLocationId,
    npc.role,
    hour
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCHEDULE DECISION
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCScheduleDecision(
  npc: NPC,
  hour: number
): NPCScheduleDecision {
  const period =
    getNPCDayPeriod(hour);

  const scheduledActivity =
    chooseScheduledActivity(
      npc,
      hour
    );

  const activity =
    scheduledActivity ??
    npc.activity;

  const destinations =
    getPreferredDestinations(
      npc
    );

  const travelling =
    activity === "travelling";

  const shouldMove =
    travelling ||
    (
      period === "morning" &&
      [
        "worker",
        "student",
        "business_owner",
      ].includes(npc.role)
    );

  const preferredDestination =
    shouldMove
      ? chooseFromList(
          destinations
        )
      : undefined;

  let reason =
    "The NPC is following their normal routine.";

  if (
    period === "early_morning"
  ) {
    reason =
      "Morning routines are starting.";
  } else if (
    period === "morning"
  ) {
    reason =
      "People are heading to work, school and businesses.";
  } else if (
    period === "afternoon"
  ) {
    reason =
      "The city is active with work, shopping and lunch activity.";
  } else if (
    period === "evening"
  ) {
    reason =
      "People are leaving work and becoming more social.";
  } else if (
    period === "night"
  ) {
    reason =
      "Nightlife, restaurants and social activities are active.";
  } else {
    reason =
      "Most residents are winding down or sleeping.";
  }

  return {
    activity,
    period,
    shouldMove,
    preferredDestination,
    reason,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SLEEP
// ─────────────────────────────────────────────────────────────────────────────

export function shouldNPCSleep(
  npc: NPC,
  hour: number
): boolean {
  if (
    ["security", "driver"].includes(
      npc.role
    )
  ) {
    return (
      hour >= 2 &&
      hour < 5
    );
  }

  if (
    ["event_guest", "tourist"].includes(
      npc.role
    )
  ) {
    return (
      hour >= 2 &&
      hour < 7
    );
  }

  return (
    hour >= 23 ||
    hour < 6
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORK
// ─────────────────────────────────────────────────────────────────────────────

export function shouldNPCWork(
  npc: NPC,
  hour: number
): boolean {
  if (
    ![
      "worker",
      "business_owner",
      "vendor",
      "security",
      "student",
    ].includes(npc.role)
  ) {
    return false;
  }

  if (npc.role === "student") {
    return (
      hour >= 8 &&
      hour < 16
    );
  }

  if (npc.role === "security") {
    return (
      hour >= 7 &&
      hour < 23
    );
  }

  return (
    hour >= 8 &&
    hour < 18
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCIALIZING
// ─────────────────────────────────────────────────────────────────────────────

export function shouldNPCSocialize(
  npc: NPC,
  hour: number
): boolean {
  if (
    shouldNPCSleep(
      npc,
      hour
    )
  ) {
    return false;
  }

  if (
    npc.activity ===
    "attending_event"
  ) {
    return true;
  }

  return (
    hour >= 17 &&
    hour < 23
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORATION
// ─────────────────────────────────────────────────────────────────────────────

export function shouldNPCExplore(
  npc: NPC,
  hour: number
): boolean {
  if (
    shouldNPCSleep(
      npc,
      hour
    )
  ) {
    return false;
  }

  if (
    npc.role === "tourist"
  ) {
    return (
      hour >= 9 &&
      hour < 22
    );
  }

  return (
    hour >= 10 &&
    hour < 20
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREFERRED DESTINATIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCPreferredDestinations(
  npc: NPC,
  hour: number
): string[] {
  const destinations =
    getPreferredDestinations(
      npc
    );

  if (
    shouldNPCWork(
      npc,
      hour
    )
  ) {
    const workDestinations =
      ROLE_DESTINATIONS[
        npc.role
      ] ?? [];

    if (
      workDestinations.length
    ) {
      return workDestinations.filter(
        (locationId) =>
          locationId !==
          npc.currentLocationId
      );
    }
  }

  if (
    shouldNPCSocialize(
      npc,
      hour
    )
  ) {
    return Array.from(
      new Set([
        "jabi",
        "wuse-2",
        "wuse",
        ...destinations,
      ])
    ).filter(
      (locationId) =>
        locationId !==
        npc.currentLocationId
    );
  }

  return destinations;
}

// ─────────────────────────────────────────────────────────────────────────────
// HUMAN-READABLE SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────

export function getNPCScheduleText(
  npc: NPC,
  hour: number
): string {
  const decision =
    getNPCScheduleDecision(
      npc,
      hour
    );

  const activityDefinition =
    getNPCActivity(
      decision.activity
    );

  const activityName =
    activityDefinition?.name ??
    decision.activity;

  return `${npc.name} is ${activityName.toLowerCase()}. ${decision.reason}`;
}