export interface GameActivity {
  id: string;
  name: string;
  description: string;
  locationIds: string[];
  category:
    | "social"
    | "career"
    | "fitness"
    | "entertainment"
    | "shopping"
    | "food"
    | "exploration";
  energyCost: number;
  reward: number;
  cooldownMinutes: number;
}

export const ACTIVITIES: GameActivity[] = [
  {
    id: "coffee-meetup",
    name: "Coffee Meetup",
    description: "Meet other players, chat and build your social reputation.",
    locationIds: ["wuse-2", "jabi"],
    category: "social",
    energyCost: 5,
    reward: 25,
    cooldownMinutes: 15,
  },
  {
    id: "jabi-lake-walk",
    name: "Jabi Lake Walk",
    description: "Take a relaxing walk around Jabi Lake.",
    locationIds: ["jabi-lake"],
    category: "fitness",
    energyCost: 8,
    reward: 40,
    cooldownMinutes: 20,
  },
  {
    id: "mall-shopping",
    name: "Shopping Trip",
    description: "Visit the mall and browse clothes, accessories and items.",
    locationIds: ["jabi-lake-mall"],
    category: "shopping",
    energyCost: 5,
    reward: 30,
    cooldownMinutes: 20,
  },
  {
    id: "park-relaxation",
    name: "Relax at the Park",
    description: "Spend some peaceful time at Millennium Park.",
    locationIds: ["millennium-park"],
    category: "exploration",
    energyCost: 3,
    reward: 20,
    cooldownMinutes: 10,
  },
  {
    id: "restaurant-meal",
    name: "Eat at a Restaurant",
    description: "Enjoy a meal and restore some energy.",
    locationIds: ["wuse-2", "maitama", "garki"],
    category: "food",
    energyCost: 0,
    reward: 15,
    cooldownMinutes: 10,
  },
  {
    id: "gym-workout",
    name: "Gym Workout",
    description: "Work out and improve your fitness reputation.",
    locationIds: ["wuse-2", "gwarinpa"],
    category: "fitness",
    energyCost: 15,
    reward: 75,
    cooldownMinutes: 30,
  },
  {
    id: "nightlife",
    name: "Nightlife",
    description: "Visit Abuja nightlife spots and meet other players.",
    locationIds: ["wuse-2"],
    category: "entertainment",
    energyCost: 10,
    reward: 60,
    cooldownMinutes: 30,
  },
  {
    id: "photo-walk",
    name: "Photo Walk",
    description: "Explore Abuja and capture memorable moments.",
    locationIds: ["cbd", "maitama", "millennium-park"],
    category: "exploration",
    energyCost: 7,
    reward: 50,
    cooldownMinutes: 20,
  },
  {
    id: "street-food",
    name: "Street Food Hunt",
    description: "Discover local food around the city.",
    locationIds: ["garki", "wuse-2", "gwarinpa"],
    category: "food",
    energyCost: 5,
    reward: 35,
    cooldownMinutes: 15,
  },
  {
    id: "social-event",
    name: "Join a Social Event",
    description: "Attend a city gathering and increase your reputation.",
    locationIds: ["jabi", "wuse-2", "cbd"],
    category: "social",
    energyCost: 10,
    reward: 100,
    cooldownMinutes: 45,
  },
];

export function getActivityById(id: string): GameActivity | undefined {
  return ACTIVITIES.find((activity) => activity.id === id);
}

export function getActivitiesForLocation(
  locationId: string
): GameActivity[] {
  return ACTIVITIES.filter((activity) =>
    activity.locationIds.includes(locationId)
  );
}
