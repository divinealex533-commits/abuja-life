// Abuja Life — Core Game Types
// Shared types for locations, players, jobs, events, businesses,
// properties, vehicles and the virtual economy.

export type CityId = "abuja";

export type LocationCategory =
  | "district"
  | "shopping"
  | "food"
  | "nightlife"
  | "park"
  | "entertainment"
  | "transport"
  | "education"
  | "health"
  | "business"
  | "residential"
  | "sports";

export type ActivityCategory =
  | "social"
  | "shopping"
  | "food"
  | "career"
  | "entertainment"
  | "fitness"
  | "dating"
  | "exploration"
  | "business"
  | "property"
  | "transport";

export type JobCategory =
  | "technology"
  | "transport"
  | "food"
  | "creative"
  | "business"
  | "public"
  | "service"
  | "media"
  | "construction";

export type EventCategory =
  | "city"
  | "festival"
  | "sports"
  | "nightlife"
  | "social"
  | "business"
  | "mystery"
  | "seasonal";

export type PropertyType =
  | "room"
  | "studio"
  | "apartment"
  | "luxury_apartment"
  | "penthouse"
  | "mansion"
  | "villa";

export type VehicleType =
  | "taxi"
  | "bus"
  | "motorbike"
  | "car"
  | "suv"
  | "sports_car";

export interface GameLocation {
  id: string;
  cityId: CityId;
  name: string;
  slug: string;
  category: LocationCategory;
  description: string;
  shortDescription?: string;

  activities: string[];

  x?: number;
  y?: number;

  dangerLevel?: number;
  popularity?: number;

  openHour?: number;
  closeHour?: number;

  requiresLevel?: number;
  requiresVip?: boolean;
}

export interface GameActivity {
  id: string;
  locationId: string;
  name: string;
  description: string;

  category: ActivityCategory;

  rewardMin?: number;
  rewardMax?: number;

  energyCost?: number;
  reputationReward?: number;

  cooldownMinutes?: number;

  requiresLevel?: number;
  requiresJob?: string;
  requiresVip?: boolean;
}

export interface GamePlayer {
  id: string;
  username: string;

  displayName?: string;

  cityId: CityId;
  locationId?: string;

  level: number;
  experience: number;

  cash: number;
  bankBalance: number;

  energy: number;
  maxEnergy: number;

  reputation: number;

  health: number;
  happiness: number;

  jobId?: string;
  propertyId?: string;
  vehicleId?: string;

  avatar?: PlayerAvatar;

  createdAt?: string;
  lastActiveAt?: string;
}

export interface PlayerAvatar {
  skinTone?: string;
  hair?: string;
  hairColor?: string;
  eyes?: string;
  outfit?: string;
  shoes?: string;
  accessory?: string;
}

export interface GameJob {
  id: string;
  title: string;
  description: string;

  category: JobCategory;

  company?: string;
  locationId?: string;

  startingPay: number;
  maximumPay: number;

  energyCost?: number;
  experienceReward?: number;

  requiredLevel?: number;

  activities: string[];

  active?: boolean;
}

export interface JobActivity {
  id: string;
  jobId: string;
  name: string;
  description: string;

  durationMinutes?: number;

  minimumPay: number;
  maximumPay: number;

  experienceReward: number;
  energyCost: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;

  category: EventCategory;

  locationId?: string;

  startTime?: string;
  endTime?: string;

  durationMinutes?: number;

  rewardCash?: number;
  rewardExperience?: number;
  reputationReward?: number;

  maxParticipants?: number;

  entryFee?: number;

  requiresLevel?: number;
  requiresVip?: boolean;

  isFeatured?: boolean;
  isRecurring?: boolean;
}

export interface EventParticipant {
  eventId: string;
  playerId: string;

  joinedAt: string;

  score?: number;
  reward?: number;
  position?: number;
}

export interface Property {
  id: string;
  name: string;

  type: PropertyType;

  locationId: string;

  price: number;
  weeklyRent?: number;

  rooms: number;

  description: string;

  capacity?: number;

  features: string[];

  prestige: number;

  available?: boolean;
}

export interface Vehicle {
  id: string;
  name: string;

  type: VehicleType;

  price: number;

  speed: number;
  comfort: number;

  fuelCost: number;

  description: string;

  requiresLevel?: number;

  available?: boolean;
}

export interface InventoryItem {
  id: string;
  itemId: string;

  quantity: number;

  durability?: number;

  acquiredAt?: string;
}

export interface GameItem {
  id: string;
  name: string;

  category:
    | "clothing"
    | "food"
    | "electronics"
    | "vehicle"
    | "property"
    | "business"
    | "gift"
    | "special";

  description: string;

  price: number;

  sellPrice?: number;

  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";

  stackable?: boolean;
}

export interface Business {
  id: string;
  ownerId: string;

  name: string;

  type:
    | "restaurant"
    | "salon"
    | "shop"
    | "club"
    | "hotel"
    | "garage"
    | "studio"
    | "office";

  locationId: string;

  level: number;

  reputation: number;

  balance: number;

  dailyIncome: number;

  upgradeCost?: number;

  description?: string;

  open?: boolean;
}

export interface BusinessUpgrade {
  id: string;
  businessType: Business["type"];

  level: number;

  cost: number;

  incomeBonus: number;

  reputationBonus: number;

  description: string;
}

export interface PlayerPresence {
  playerId: string;
  username: string;

  locationId: string;

  status:
    | "online"
    | "away"
    | "busy"
    | "invisible"
    | "offline";

  lastSeen: string;
}

export interface ChatMessage {
  id: string;

  senderId: string;
  senderName: string;

  locationId?: string;

  message: string;

  createdAt: string;
}

export interface Friend {
  id: string;

  playerId: string;
  friendId: string;

  status: "pending" | "accepted" | "blocked";

  createdAt: string;
}

export interface Notification {
  id: string;

  playerId: string;

  type:
    | "event"
    | "job"
    | "money"
    | "friend"
    | "business"
    | "property"
    | "system"
    | "news";

  title: string;
  message: string;

  read: boolean;

  createdAt: string;
}

export interface Advertisement {
  id: string;

  businessName: string;

  title: string;
  description: string;

  locationId?: string;

  imageUrl?: string;
  targetUrl?: string;

  price: number;

  startDate: string;
  endDate: string;

  active: boolean;
}

export interface CityNews {
  id: string;

  title: string;
  summary: string;

  category:
    | "breaking"
    | "business"
    | "entertainment"
    | "sports"
    | "community"
    | "traffic"
    | "weather";

  locationId?: string;

  publishedAt: string;

  featured?: boolean;
}

export interface LeaderboardEntry {
  playerId: string;
  username: string;

  score: number;

  rank: number;

  category:
    | "wealth"
    | "business"
    | "career"
    | "reputation"
    | "events"
    | "social";
}