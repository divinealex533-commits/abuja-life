export type HouseRoomType =
  | "living-room"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "balcony"
  | "garage"
  | "garden"
  | "pool"
  | "home-office"
  | "game-room"
  | "cinema"
  | "security-room";

export interface HouseRoom {
  id: string;
  name: string;
  type: HouseRoomType;
  description: string;
  icon: string;
  unlockLevel: number;
  comfort: number;
  prestige: number;
  activities: string[];
}

export const HOUSE_ROOMS: HouseRoom[] = [
  {
    id: "living-room",
    name: "Living Room",
    type: "living-room",
    description: "Your main relaxation and social space.",
    icon: "🛋️",
    unlockLevel: 1,
    comfort: 10,
    prestige: 5,
    activities: ["Relax", "Watch TV", "Invite Guests"],
  },
  {
    id: "bedroom",
    name: "Bedroom",
    type: "bedroom",
    description: "Rest and recover your energy.",
    icon: "🛏️",
    unlockLevel: 1,
    comfort: 15,
    prestige: 5,
    activities: ["Sleep", "Change Outfit", "Rest"],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    type: "kitchen",
    description: "Prepare food and improve your home lifestyle.",
    icon: "🍳",
    unlockLevel: 1,
    comfort: 8,
    prestige: 4,
    activities: ["Cook", "Prepare Food", "Make Drink"],
  },
  {
    id: "bathroom",
    name: "Bathroom",
    type: "bathroom",
    description: "Freshen up and maintain your character.",
    icon: "🚿",
    unlockLevel: 1,
    comfort: 7,
    prestige: 3,
    activities: ["Shower", "Freshen Up"],
  },
  {
    id: "balcony",
    name: "Balcony",
    type: "balcony",
    description: "Enjoy the Abuja skyline.",
    icon: "🌇",
    unlockLevel: 2,
    comfort: 10,
    prestige: 8,
    activities: ["Relax", "View City", "Take Photos"],
  },
  {
    id: "garage",
    name: "Garage",
    type: "garage",
    description: "Store and customize your vehicles.",
    icon: "🚗",
    unlockLevel: 2,
    comfort: 5,
    prestige: 12,
    activities: ["View Vehicles", "Customize Vehicle"],
  },
  {
    id: "home-office",
    name: "Home Office",
    type: "home-office",
    description: "A professional workspace inside your home.",
    icon: "💻",
    unlockLevel: 2,
    comfort: 8,
    prestige: 10,
    activities: ["Work", "Study", "Manage Business"],
  },
  {
    id: "garden",
    name: "Garden",
    type: "garden",
    description: "A private outdoor space for relaxation.",
    icon: "🌿",
    unlockLevel: 3,
    comfort: 15,
    prestige: 12,
    activities: ["Relax", "Garden", "Host Guests"],
  },
  {
    id: "game-room",
    name: "Game Room",
    type: "game-room",
    description: "A private entertainment room.",
    icon: "🎮",
    unlockLevel: 3,
    comfort: 12,
    prestige: 15,
    activities: ["Play Games", "Host Gaming Session"],
  },
  {
    id: "cinema",
    name: "Private Cinema",
    type: "cinema",
    description: "A luxury entertainment experience.",
    icon: "🎬",
    unlockLevel: 4,
    comfort: 20,
    prestige: 25,
    activities: ["Watch Movie", "Host Movie Night"],
  },
  {
    id: "pool",
    name: "Private Pool",
    type: "pool",
    description: "A premium private swimming area.",
    icon: "🏊",
    unlockLevel: 4,
    comfort: 20,
    prestige: 30,
    activities: ["Swim", "Relax", "Pool Party"],
  },
  {
    id: "security-room",
    name: "Security Room",
    type: "security-room",
    description: "Monitor and protect your property.",
    icon: "🛡️",
    unlockLevel: 3,
    comfort: 3,
    prestige: 18,
    activities: ["Monitor Security", "Review Cameras"],
  },
];

export function getHouseRooms(interiorLevel: number): HouseRoom[] {
  return HOUSE_ROOMS.filter(
    (room) => room.unlockLevel <= interiorLevel
  );
}

export function getHouseRoomById(
  roomId: string
): HouseRoom | undefined {
  return HOUSE_ROOMS.find((room) => room.id === roomId);
}

export function calculateInteriorComfort(
  interiorLevel: number
): number {
  return getHouseRooms(interiorLevel).reduce(
    (total, room) => total + room.comfort,
    0
  );
}

export function calculateInteriorPrestige(
  interiorLevel: number
): number {
  return getHouseRooms(interiorLevel).reduce(
    (total, room) => total + room.prestige,
    0
  );
}

export function isRoomUnlocked(
  roomId: string,
  interiorLevel: number
): boolean {
  const room = getHouseRoomById(roomId);

  if (!room) return false;

  return room.unlockLevel <= interiorLevel;
}