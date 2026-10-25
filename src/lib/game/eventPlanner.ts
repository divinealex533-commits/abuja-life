export type EventType =
  | "wedding"
  | "concert"
  | "corporate"
  | "birthday"
  | "festival"
  | "launch";

export type EventDifficulty = "easy" | "medium" | "hard";

export type EventVenue =
  | "jabi-lake"
  | "maitama-garden"
  | "wuse-event-center"
  | "abuja-international"
  | "central-arena";

export type EventTheme =
  | "luxury"
  | "modern"
  | "cultural"
  | "street"
  | "corporate";

export interface EventContract {
  id: string;
  title: string;
  type: EventType;
  venue: EventVenue;
  difficulty: EventDifficulty;
  guests: number;
  deadline: number;
  budget: number;
  basePay: number;
  description: string;
}

export interface EventPlannerResult {
  eventScore: number;
  venueScore: number;
  guestScore: number;
  budgetScore: number;
  themeScore: number;
  executionScore: number;
  payment: number;
  bonus: number;
  reputation: number;
  experience: number;
  energyUsed: number;
  headline: string;
  verdict: string;
}

const DIFFICULTY_MULTIPLIER: Record<EventDifficulty, number> = {
  easy: 1,
  medium: 1.25,
  hard: 1.55,
};

const DIFFICULTY_ENERGY: Record<EventDifficulty, number> = {
  easy: 12,
  medium: 17,
  hard: 23,
};

export const EVENT_CONTRACTS: EventContract[] = [
  {
    id: "jabi-birthday",
    title: "Jabi Birthday Bash",
    type: "birthday",
    venue: "jabi-lake",
    difficulty: "easy",
    guests: 80,
    deadline: 80,
    budget: 180000,
    basePay: 6500,
    description:
      "Plan a lively birthday celebration beside Jabi Lake with food, music and memorable entertainment.",
  },
  {
    id: "maitama-wedding",
    title: "Maitama Luxury Wedding",
    type: "wedding",
    venue: "maitama-garden",
    difficulty: "hard",
    guests: 350,
    deadline: 150,
    budget: 1500000,
    basePay: 15000,
    description:
      "Deliver a premium Abuja wedding where every detail, from guests to decoration, must feel perfect.",
  },
  {
    id: "abuja-tech-launch",
    title: "Abuja Tech Launch",
    type: "launch",
    venue: "abuja-international",
    difficulty: "medium",
    guests: 220,
    deadline: 110,
    budget: 850000,
    basePay: 10500,
    description:
      "Organize a high-profile technology product launch for investors, media and guests.",
  },
  {
    id: "capital-corporate",
    title: "Capital Corporate Summit",
    type: "corporate",
    venue: "wuse-event-center",
    difficulty: "hard",
    guests: 500,
    deadline: 170,
    budget: 1800000,
    basePay: 18000,
    description:
      "Coordinate a major corporate summit with demanding executives and hundreds of guests.",
  },
  {
    id: "abuja-street-festival",
    title: "Abuja Street Festival",
    type: "festival",
    venue: "central-arena",
    difficulty: "hard",
    guests: 1200,
    deadline: 190,
    budget: 2500000,
    basePay: 22000,
    description:
      "Create a huge Abuja festival packed with music, food, performers and thousands of moving parts.",
  },
  {
    id: "jabi-concert",
    title: "Jabi Music Night",
    type: "concert",
    venue: "jabi-lake",
    difficulty: "medium",
    guests: 650,
    deadline: 135,
    budget: 1200000,
    basePay: 13500,
    description:
      "Put together a high-energy music night with performers, security, guests and production.",
  },
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function getEventContract(id: string) {
  return EVENT_CONTRACTS.find((event) => event.id === id);
}

export function calculateEventPlannerResult(
  contract: EventContract,
  venueScore: number,
  guestScore: number,
  budgetScore: number,
  themeScore: number,
  executionScore: number
): EventPlannerResult {
  const venue = clamp(venueScore);
  const guests = clamp(guestScore);
  const budget = clamp(budgetScore);
  const theme = clamp(themeScore);
  const execution = clamp(executionScore);

  const eventScore = Math.round(
    venue * 0.2 +
      guests * 0.2 +
      budget * 0.2 +
      theme * 0.15 +
      execution * 0.25
  );

  const venueBonus = venue >= 90 ? 1800 : venue >= 75 ? 700 : 0;
  const guestBonus = guests >= 90 ? 1800 : guests >= 75 ? 700 : 0;
  const budgetBonus = budget >= 90 ? 2200 : budget >= 75 ? 900 : 0;
  const themeBonus = theme >= 90 ? 1800 : theme >= 75 ? 800 : 0;
  const executionBonus = execution >= 90 ? 3000 : execution >= 75 ? 1200 : 0;

  const bonus =
    venueBonus +
    guestBonus +
    budgetBonus +
    themeBonus +
    executionBonus;

  const difficulty = DIFFICULTY_MULTIPLIER[contract.difficulty];

  const payment = Math.round(
    contract.basePay * difficulty +
      bonus +
      eventScore * 35
  );

  const reputation = Math.max(
    2,
    Math.round(
      4 +
        eventScore / 15 +
        (execution >= 85 ? 3 : 0) +
        (contract.difficulty === "hard" ? 3 : 0)
    )
  );

  const experience = Math.max(
    30,
    Math.round(
      45 +
        eventScore * 0.75 +
        (contract.difficulty === "hard" ? 25 : 0)
    )
  );

  let headline = "Event completed";
  let verdict =
    "The event was successfully delivered, but there is room to improve.";

  if (eventScore >= 92) {
    headline = "🏆 Abuja Event of the Year";
    verdict =
      "Outstanding planning. The guests loved it, the client was impressed and your execution was elite.";
  } else if (eventScore >= 80) {
    headline = "🎉 Five-Star Event";
    verdict =
      "Excellent event planning. Your coordination, creativity and execution stood out.";
  } else if (eventScore >= 65) {
    headline = "✨ Successful Event";
    verdict =
      "The event went well and the client was satisfied, although a few details could have been stronger.";
  } else {
    headline = "⚠️ Event Saved";
    verdict =
      "You managed to complete the event, but several planning decisions caused problems.";
  }

  return {
    eventScore,
    venueScore: venue,
    guestScore: guests,
    budgetScore: budget,
    themeScore: theme,
    executionScore: execution,
    payment,
    bonus,
    reputation,
    experience,
    energyUsed: DIFFICULTY_ENERGY[contract.difficulty],
    headline,
    verdict,
  };
}
