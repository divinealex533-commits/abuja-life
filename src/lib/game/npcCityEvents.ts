import {
  NPC,
  NPCActivity,
} from "@/lib/game/npcs";

export type NPCEventReaction =
  | "ignore"
  | "watch"
  | "attend"
  | "socialize"
  | "work"
  | "leave"
  | "investigate"
  | "celebrate"
  | "avoid";

export interface NPCEventContext {
  eventId: string;
  eventName: string;
  locationId: string;
  category: string;
  intensity: "low" | "medium" | "high";
  active: boolean;
  description?: string;
}

export interface NPCEventReactionResult {
  npc: NPC;
  eventId: string;
  reaction: NPCEventReaction;
  previousActivity: NPCActivity;
  newActivity: NPCActivity;
  moved: boolean;
  previousLocationId: string;
  newLocationId: string;
  reason: string;
}

const SOCIAL_CATEGORIES = new Set([
  "social",
  "entertainment",
  "festival",
  "nightlife",
  "sports",
]);

const WORK_CATEGORIES = new Set([
  "business",
  "career",
  "market",
  "food",
  "shopping",
]);

const HIGH_INTENSITY_REACTIONS: NPCEventReaction[] = [
  "watch",
  "attend",
  "investigate",
  "socialize",
];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function isSocialEvent(
  context: NPCEventContext
): boolean {
  return SOCIAL_CATEGORIES.has(
    normalizeText(context.category)
  );
}

function isWorkEvent(
  context: NPCEventContext
): boolean {
  return WORK_CATEGORIES.has(
    normalizeText(context.category)
  );
}

/**
 * Decide how an NPC reacts to an active city event.
 */
export function chooseNPCEventReaction(
  npc: NPC,
  context: NPCEventContext
): NPCEventReaction {
  if (!context.active) {
    return "ignore";
  }

  const eventLocation =
    normalizeText(context.locationId);

  const npcLocation =
    normalizeText(npc.currentLocationId);

  const sameLocation =
    eventLocation === npcLocation;

  const eventCategory =
    normalizeText(context.category);

  if (
    context.intensity === "high" &&
    sameLocation
  ) {
    if (
      npc.role === "security" ||
      npc.role === "event_guest"
    ) {
      return "investigate";
    }

    if (isSocialEvent(context)) {
      return "attend";
    }

    return "watch";
  }

  if (
    eventCategory === "emergency" ||
    eventCategory === "security"
  ) {
    if (sameLocation) {
      return "avoid";
    }

    return "ignore";
  }

  if (sameLocation) {
    if (isSocialEvent(context)) {
      return "socialize";
    }

    if (isWorkEvent(context)) {
      return "work";
    }

    return "watch";
  }

  if (
    npc.role === "event_guest" &&
    isSocialEvent(context)
  ) {
    return "attend";
  }

  if (
    npc.role === "business_owner" &&
    isWorkEvent(context)
  ) {
    return "investigate";
  }

  if (
    npc.role === "vendor" &&
    isWorkEvent(context)
  ) {
    return "work";
  }

  return "ignore";
}

/**
 * Determine whether an NPC should travel toward
 * an event location.
 */
export function shouldNPCTravelToEvent(
  npc: NPC,
  context: NPCEventContext
): boolean {
  if (!context.active) {
    return false;
  }

  if (
    npc.currentLocationId ===
    context.locationId
  ) {
    return false;
  }

  const reaction =
    chooseNPCEventReaction(
      npc,
      context
    );

  return (
    reaction === "attend" ||
    reaction === "investigate" ||
    reaction === "celebrate"
  );
}

/**
 * Apply an event reaction to an NPC.
 */
export function reactNPCToCityEvent(
  npc: NPC,
  context: NPCEventContext
): NPCEventReactionResult {
  const previousActivity =
    npc.activity;

  const previousLocationId =
    npc.currentLocationId;

  const reaction =
    chooseNPCEventReaction(
      npc,
      context
    );

  let newActivity =
    previousActivity;

  let newLocationId =
    previousLocationId;

  let moved = false;

  switch (reaction) {
    case "attend":
      newActivity =
        "attending_event";
      newLocationId =
        context.locationId;
      moved =
        previousLocationId !==
        context.locationId;
      break;

    case "celebrate":
      newActivity =
        "socializing";
      break;

    case "socialize":
      newActivity =
        "socializing";
      break;

    case "work":
      newActivity =
        "working";
      break;

    case "watch":
      newActivity =
        "waiting";
      break;

    case "investigate":
      newActivity =
        "travelling";

      if (
        previousLocationId !==
        context.locationId
      ) {
        newLocationId =
          context.locationId;
        moved = true;
      }

      break;

    case "avoid":
      newActivity =
        "travelling";
      break;

    case "leave":
      newActivity =
        "travelling";
      break;

    default:
      break;
  }

  const updatedNPC: NPC = {
    ...npc,
    currentLocationId:
      newLocationId,
    activity:
      newActivity,
    activityStartedAt:
      Date.now(),
    destinationLocationId:
      moved
        ? undefined
        : npc.destinationLocationId,
  };

  return {
    npc: updatedNPC,
    eventId: context.eventId,
    reaction,
    previousActivity,
    newActivity,
    moved,
    previousLocationId,
    newLocationId,
    reason:
      getNPCEventReactionReason(
        npc,
        context,
        reaction
      ),
  };
}

/**
 * Apply one city event to a complete NPC population.
 */
export function processNPCCityEvent(
  npcs: NPC[],
  context: NPCEventContext
): NPCEventReactionResult[] {
  if (!context.active) {
    return npcs.map((npc) => ({
      npc,
      eventId: context.eventId,
      reaction: "ignore",
      previousActivity: npc.activity,
      newActivity: npc.activity,
      moved: false,
      previousLocationId:
        npc.currentLocationId,
      newLocationId:
        npc.currentLocationId,
      reason:
        "The event is not currently active.",
    }));
  }

  return npcs.map((npc) =>
    reactNPCToCityEvent(
      npc,
      context
    )
  );
}

/**
 * Process multiple active city events.
 */
export function processNPCActiveCityEvents(
  npcs: NPC[],
  contexts: NPCEventContext[]
): NPCEventReactionResult[] {
  let currentNPCs = [...npcs];
  const results: NPCEventReactionResult[] =
    [];

  for (const context of contexts) {
    if (!context.active) {
      continue;
    }

    const eventResults =
      processNPCCityEvent(
        currentNPCs,
        context
      );

    results.push(...eventResults);

    currentNPCs =
      eventResults.map(
        (result) => result.npc
      );
  }

  return results;
}

/**
 * Get a human-readable explanation for an NPC reaction.
 */
export function getNPCEventReactionReason(
  npc: NPC,
  context: NPCEventContext,
  reaction: NPCEventReaction
): string {
  const eventName =
    context.eventName;

  switch (reaction) {
    case "attend":
      return `${npc.name} decided to attend ${eventName}.`;

    case "watch":
      return `${npc.name} stopped to watch ${eventName}.`;

    case "socialize":
      return `${npc.name} is socializing around ${eventName}.`;

    case "work":
      return `${npc.name} is working because ${eventName} is attracting activity.`;

    case "investigate":
      return `${npc.name} is investigating ${eventName}.`;

    case "celebrate":
      return `${npc.name} is celebrating around ${eventName}.`;

    case "avoid":
      return `${npc.name} is avoiding the area because of ${eventName}.`;

    case "leave":
      return `${npc.name} decided to leave the area.`;

    default:
      return `${npc.name} is continuing their normal routine.`;
  }
}

/**
 * Get all NPCs that reacted to an event.
 */
export function getEventReactingNPCs(
  results: NPCEventReactionResult[]
): NPCEventReactionResult[] {
  return results.filter(
    (result) =>
      result.reaction !== "ignore"
  );
}

/**
 * Get NPCs that attended an event.
 */
export function getEventAttendees(
  results: NPCEventReactionResult[]
): NPC[] {
  return results
    .filter(
      (result) =>
        result.reaction === "attend"
    )
    .map(
      (result) => result.npc
    );
}

/**
 * Get NPCs that moved because of an event.
 */
export function getEventMovingNPCs(
  results: NPCEventReactionResult[]
): NPC[] {
  return results
    .filter(
      (result) => result.moved
    )
    .map(
      (result) => result.npc
    );
}

/**
 * Count reactions by type.
 */
export function getNPCEventReactionCounts(
  results: NPCEventReactionResult[]
): Record<NPCEventReaction, number> {
  const counts: Record<
    NPCEventReaction,
    number
  > = {
    ignore: 0,
    watch: 0,
    attend: 0,
    socialize: 0,
    work: 0,
    leave: 0,
    investigate: 0,
    celebrate: 0,
    avoid: 0,
  };

  for (const result of results) {
    counts[result.reaction] += 1;
  }

  return counts;
}

/**
 * Get a compact event reaction summary.
 */
export function getNPCEventSummary(
  results: NPCEventReactionResult[]
): {
  total: number;
  reacted: number;
  attendees: number;
  moved: number;
  working: number;
  socializing: number;
  investigating: number;
} {
  return {
    total: results.length,

    reacted:
      getEventReactingNPCs(results)
        .length,

    attendees:
      getEventAttendees(results)
        .length,

    moved:
      getEventMovingNPCs(results)
        .length,

    working:
      results.filter(
        (result) =>
          result.reaction === "work"
      ).length,

    socializing:
      results.filter(
        (result) =>
          result.reaction ===
          "socialize"
      ).length,

    investigating:
      results.filter(
        (result) =>
          result.reaction ===
          "investigate"
      ).length,
  };
}

/**
 * Build an event context quickly.
 */
export function createNPCEventContext(
  eventId: string,
  eventName: string,
  locationId: string,
  category: string,
  options?: {
    intensity?: "low" | "medium" | "high";
    active?: boolean;
    description?: string;
  }
): NPCEventContext {
  return {
    eventId,
    eventName,
    locationId,
    category,
    intensity:
      options?.intensity ??
      "medium",
    active:
      options?.active ?? true,
    description:
      options?.description,
  };
}