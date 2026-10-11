// Abuja Life — Job Missions
// Mission data for the job gameplay system.
// We start with Taxi Driver missions and can add missions
// for other careers later.

export type JobMissionDifficulty =
  | "easy"
  | "medium"
  | "hard";

export interface JobMission {
  id: string;
  jobId: string;
  title: string;
  description: string;
  pickupLocation: string;
  destination: string;
  reward: number;
  energyCost: number;
  reputationGain: number;
  experienceGain: number;
  difficulty: JobMissionDifficulty;
  estimatedMinutes: number;
  tags: string[];
}

export const JOB_MISSIONS: JobMission[] = [
  // ─────────────────────────────────────────────
  // TAXI DRIVER — EASY
  // ─────────────────────────────────────────────

  {
    id: "taxi-jabi-wuse",
    jobId: "taxi-driver",
    title: "Jabi to Wuse",
    description:
      "Pick up a passenger near Jabi Lake and take them safely to Wuse.",
    pickupLocation: "Jabi",
    destination: "Wuse",
    reward: 2200,
    energyCost: 15,
    reputationGain: 3,
    experienceGain: 10,
    difficulty: "easy",
    estimatedMinutes: 8,
    tags: ["taxi", "jabi", "wuse"],
  },

  {
    id: "taxi-wuse-garki",
    jobId: "taxi-driver",
    title: "Wuse to Garki",
    description:
      "A passenger needs a quick ride from Wuse to Garki.",
    pickupLocation: "Wuse",
    destination: "Garki",
    reward: 2400,
    energyCost: 15,
    reputationGain: 3,
    experienceGain: 10,
    difficulty: "easy",
    estimatedMinutes: 9,
    tags: ["taxi", "wuse", "garki"],
  },

  {
    id: "taxi-garki-cbd",
    jobId: "taxi-driver",
    title: "Garki to CBD",
    description:
      "Take a business passenger from Garki into Abuja's Central Business District.",
    pickupLocation: "Garki",
    destination: "CBD",
    reward: 2600,
    energyCost: 16,
    reputationGain: 3,
    experienceGain: 11,
    difficulty: "easy",
    estimatedMinutes: 10,
    tags: ["taxi", "garki", "cbd", "business"],
  },

  // ─────────────────────────────────────────────
  // TAXI DRIVER — MEDIUM
  // ─────────────────────────────────────────────

  {
    id: "taxi-maitama-jabi",
    jobId: "taxi-driver",
    title: "Maitama to Jabi",
    description:
      "Pick up a passenger in Maitama and deliver them to Jabi.",
    pickupLocation: "Maitama",
    destination: "Jabi",
    reward: 3400,
    energyCost: 18,
    reputationGain: 4,
    experienceGain: 15,
    difficulty: "medium",
    estimatedMinutes: 12,
    tags: ["taxi", "maitama", "jabi"],
  },

  {
    id: "taxi-wuse-maitama",
    jobId: "taxi-driver",
    title: "Wuse to Maitama",
    description:
      "A customer is waiting in Wuse and needs a ride to Maitama.",
    pickupLocation: "Wuse",
    destination: "Maitama",
    reward: 3600,
    energyCost: 18,
    reputationGain: 4,
    experienceGain: 16,
    difficulty: "medium",
    estimatedMinutes: 13,
    tags: ["taxi", "wuse", "maitama"],
  },

  {
    id: "taxi-airport-wuse",
    jobId: "taxi-driver",
    title: "Airport to Wuse",
    description:
      "Pick up a visitor arriving in Abuja and take them to Wuse.",
    pickupLocation: "Abuja Airport",
    destination: "Wuse",
    reward: 4800,
    energyCost: 22,
    reputationGain: 5,
    experienceGain: 20,
    difficulty: "medium",
    estimatedMinutes: 18,
    tags: ["taxi", "airport", "wuse", "visitor"],
  },

  {
    id: "taxi-gwarinpa-wuse",
    jobId: "taxi-driver",
    title: "Gwarinpa to Wuse",
    description:
      "Take a passenger from Gwarinpa into the busy Wuse district.",
    pickupLocation: "Gwarinpa",
    destination: "Wuse",
    reward: 4200,
    energyCost: 21,
    reputationGain: 5,
    experienceGain: 18,
    difficulty: "medium",
    estimatedMinutes: 17,
    tags: ["taxi", "gwarinpa", "wuse"],
  },

  // ─────────────────────────────────────────────
  // TAXI DRIVER — HARD
  // ─────────────────────────────────────────────

  {
    id: "taxi-airport-maitama",
    jobId: "taxi-driver",
    title: "Airport to Maitama",
    description:
      "A VIP visitor has arrived at the airport and needs a reliable ride to Maitama.",
    pickupLocation: "Abuja Airport",
    destination: "Maitama",
    reward: 6200,
    energyCost: 27,
    reputationGain: 7,
    experienceGain: 28,
    difficulty: "hard",
    estimatedMinutes: 25,
    tags: ["taxi", "airport", "maitama", "vip"],
  },

  {
    id: "taxi-gwarinpa-airport",
    jobId: "taxi-driver",
    title: "Gwarinpa to Airport",
    description:
      "Get a passenger to the airport on time before their flight.",
    pickupLocation: "Gwarinpa",
    destination: "Abuja Airport",
    reward: 6800,
    energyCost: 30,
    reputationGain: 8,
    experienceGain: 32,
    difficulty: "hard",
    estimatedMinutes: 28,
    tags: ["taxi", "gwarinpa", "airport", "rush"],
  },

  {
    id: "taxi-jabi-maitama-night",
    jobId: "taxi-driver",
    title: "Late Night Jabi Ride",
    description:
      "A passenger needs a safe late-night ride from Jabi to Maitama.",
    pickupLocation: "Jabi",
    destination: "Maitama",
    reward: 5800,
    energyCost: 25,
    reputationGain: 7,
    experienceGain: 27,
    difficulty: "hard",
    estimatedMinutes: 22,
    tags: ["taxi", "jabi", "maitama", "night"],
  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

export function getMissionById(
  missionId: string
): JobMission | undefined {
  return JOB_MISSIONS.find(
    (mission) => mission.id === missionId
  );
}

export function getMissionsForJob(
  jobId: string
): JobMission[] {
  return JOB_MISSIONS.filter(
    (mission) => mission.jobId === jobId
  );
}

export function getMissionsByDifficulty(
  difficulty: JobMissionDifficulty
): JobMission[] {
  return JOB_MISSIONS.filter(
    (mission) => mission.difficulty === difficulty
  );
}

export function searchMissions(
  query: string
): JobMission[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return JOB_MISSIONS;
  }

  return JOB_MISSIONS.filter((mission) =>
    [
      mission.title,
      mission.description,
      mission.pickupLocation,
      mission.destination,
      mission.difficulty,
      ...mission.tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}
export const FOOD_VENDOR_MISSIONS: JobMission[] = [
  {
    id: "food-vendor-breakfast-rush",
    jobId: "food-vendor",
    title: "Breakfast Rush",
    tags: ["food", "cooking", "customers"],
    description:
      "Prepare breakfast orders for hungry customers during the morning rush.",
    pickupLocation: "Food Street",
    destination: "Food Street",
    reward: 2400,
    energyCost: 12,
    reputationGain: 3,
    experienceGain: 20,
    estimatedMinutes: 5,
    difficulty: "easy",
  },
  {
    id: "food-vendor-lunch-rush",
    jobId: "food-vendor",
    title: "Lunch Rush",
    tags: ["food", "cooking", "customers"],
    description:
      "The lunch crowd has arrived. Cook and serve several hungry customers before they leave.",
    pickupLocation: "Food Street",
    destination: "Wuse Market",
    reward: 3400,
    energyCost: 15,
    reputationGain: 4,
    experienceGain: 30,
    estimatedMinutes: 7,
    difficulty: "medium",
  },
  {
    id: "food-vendor-party-order",
    jobId: "food-vendor",
    title: "Big Party Order",
    tags: ["food", "cooking", "customers"],
    description:
      "A customer needs a large food order for a private Abuja event. Keep the quality high.",
    pickupLocation: "Food Street",
    destination: "Jabi",
    reward: 5200,
    energyCost: 20,
    reputationGain: 6,
    experienceGain: 45,
    estimatedMinutes: 10,
    difficulty: "hard",
  },
];

