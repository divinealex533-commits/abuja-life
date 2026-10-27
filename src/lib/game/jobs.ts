// Abuja Life — Jobs System
// All job definitions live here.
// Keep this file independent so we can expand the job system later.

export type JobCategory =
  | "transport"
  | "food"
  | "business"
  | "creative"
  | "technology"
  | "service"
  | "media"
  | "investigation"

export interface Job {
  id: string;
  name: string;
  category: JobCategory;
  description: string;
  locationId?: string;
  startingPay: number;
  maxPay: number;
  energyCost: number;
  reputationGain: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export const JOBS: Job[] = [
  {
    id: "taxi-driver",
    name: "Taxi Driver",
    category: "transport",
    description:
      "Pick up passengers around Abuja and earn money by completing taxi trips.",
    locationId: "taxi-stand",
    startingPay: 2200,
    maxPay: 6500,
    energyCost: 15,
    reputationGain: 3,
    difficulty: "easy",
    tags: ["driving", "transport", "passengers"],
  },

  {
    id: "food-vendor",
    name: "Food Vendor",
    category: "food",
    description:
      "Serve hungry residents and visitors around Abuja with popular local meals.",
    locationId: "food-street",
    startingPay: 1800,
    maxPay: 5200,
    energyCost: 12,
    reputationGain: 3,
    difficulty: "easy",
    tags: ["food", "cooking", "customers"],
  },

  {
    id: "shopkeeper",
    name: "Shopkeeper",
    category: "business",
    description:
      "Run a small shop, serve customers and build your business reputation.",
    locationId: "wuse-market",
    startingPay: 2000,
    maxPay: 6000,
    energyCost: 10,
    reputationGain: 4,
    difficulty: "easy",
    tags: ["shop", "business", "customers"],
  },

  {
    id: "photographer",
    name: "Photographer",
    category: "creative",
    description:
      "Take photos at events, parties and popular Abuja locations.",
    startingPay: 2500,
    maxPay: 8000,
    energyCost: 15,
    reputationGain: 5,
    difficulty: "medium",
    tags: ["photography", "events", "creative"],
  },

  {
    id: "software-developer",
    name: "Software Developer",
    category: "technology",
    description:
      "Complete digital projects for clients and earn money from your technical skills.",
    startingPay: 4500,
    maxPay: 14000,
    energyCost: 20,
    reputationGain: 6,
    difficulty: "hard",
    tags: ["technology", "coding", "digital"],
  },

  {
    id: "fashion-designer",
    name: "Fashion Designer",
    category: "creative",
    description:
      "Design outfits and create stylish looks for Abuja residents.",
    locationId: "style-studio",
    startingPay: 3000,
    maxPay: 9500,
    energyCost: 18,
    reputationGain: 5,
    difficulty: "medium",
    tags: ["fashion", "style", "design"],
  },

  {
    id: "barber",
    name: "Barber",
    category: "service",
    description:
      "Give customers fresh cuts and build a strong style reputation.",
    locationId: "style-studio",
    startingPay: 2200,
    maxPay: 7000,
    energyCost: 14,
    reputationGain: 4,
    difficulty: "easy",
    tags: ["barber", "style", "customers"],
  },

  {
    id: "journalist",
    name: "Journalist",
    category: "media",
    description:
      "Cover Abuja events and turn interesting city stories into earnings.",
    startingPay: 2800,
    maxPay: 9000,
    energyCost: 16,
    reputationGain: 7,
    difficulty: "medium",
    tags: ["news", "media", "events"],
  },

  {
    id: "event-planner",
    name: "Event Planner",
    category: "business",
    description:
      "Organize parties, competitions and major Abuja events.",
    startingPay: 3500,
    maxPay: 11000,
    energyCost: 20,
    reputationGain: 8,
    difficulty: "hard",
    tags: ["events", "business", "parties"],
  },

  {
    id: "delivery-rider",
    name: "Delivery Rider",
    category: "transport",
    description:
      "Deliver food and packages across Abuja while racing against the clock.",
    startingPay: 2000,
    maxPay: 6500,
    energyCost: 18,
    reputationGain: 3,
    difficulty: "medium",
    tags: ["delivery", "bike", "transport"],
  },

  {
  id: "private-investigator",
  name: "Private Investigator",
  category: "investigation",
  description:
    "Investigate mysteries across Abuja, interrogate suspects, collect evidence and solve difficult cases.",
  locationId: "wuse",
  startingPay: 5000,
  maxPay: 24000,
  energyCost: 20,
  reputationGain: 10,
  difficulty: "hard",
  tags: [
    "investigation",
    "detective",
    "mystery",
    "evidence",
    "cases",
  ],
},

  {
  id: "paramedic",
  name: "Paramedic",
  category: "service",
  description:
    "Respond to emergency calls across Abuja, stabilize patients and race against time to save lives.",
  locationId: "wuse",
  startingPay: 4500,
  maxPay: 22000,
  energyCost: 22,
  reputationGain: 12,
  difficulty: "hard",
  tags: [
    "medical",
    "emergency",
    "rescue",
    "ambulance",
    "first-aid",
  ],
},

  {
  id: "police-officer",
  name: "Police Officer",
  category: "service",
  description:
    "Protect Abuja, respond to emergency calls, investigate crimes and make critical decisions on the streets.",
  locationId: "wuse",
  startingPay: 4000,
  maxPay: 20000,
  energyCost: 20,
  reputationGain: 11,
  difficulty: "hard",
  tags: [
    "police",
    "patrol",
    "crime",
    "investigation",
    "arrest",
    "emergency",
  ],
},

 {
  id: "street-racer",
  name: "Street Racer",
  category: "transport",
  description:
    "Race through Abuja, master dangerous corners, use nitro and compete for big prizes.",
  locationId: "wuse",
  startingPay: 5500,
  maxPay: 30000,
  energyCost: 18,
  reputationGain: 12,
  difficulty: "hard",
  tags: [
    "racing",
    "cars",
    "speed",
    "drift",
    "nitro",
    "street",
  ],
}, 

  {
  id: "game-streamer",
  name: "Game Streamer",
  category: "media",
  description:
    "Build a gaming audience, stream live, create viral moments and become one of Abuja's biggest creators.",
  locationId: "wuse",
  startingPay: 3000,
  maxPay: 25000,
  energyCost: 18,
  reputationGain: 8,
  difficulty: "hard",
  tags: [
    "streaming",
    "gaming",
    "creator",
    "tiktok",
    "youtube",
    "live",
  ],
},
];

export function getJobById(jobId: string): Job | undefined {
  return JOBS.find((job) => job.id === jobId);
}

export function getJobsByCategory(category: JobCategory): Job[] {
  return JOBS.filter((job) => job.category === category);
}

export function searchJobs(query: string): Job[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return JOBS;
  }

  return JOBS.filter((job) =>
    [
      job.name,
      job.description,
      job.category,
      ...job.tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

export function calculateJobPay(
  job: Job,
  performance = 1
): number {
  const safePerformance = Math.max(0, Math.min(1, performance));

  const pay =
    job.startingPay +
    (job.maxPay - job.startingPay) * safePerformance;

  return Math.round(pay);
}
