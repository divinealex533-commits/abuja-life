export type HouseType =
  | "room"
  | "studio"
  | "apartment"
  | "duplex"
  | "penthouse"
  | "mansion"
  | "estate"
  | "land"
  | "commercial";

export type HouseTier =
  | "starter"
  | "standard"
  | "premium"
  | "luxury"
  | "elite";

export type InteriorStyle =
  | "basic"
  | "modern"
  | "african-modern"
  | "luxury"
  | "minimalist"
  | "executive";

export interface HouseFeatures {
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;

  hasKitchen: boolean;
  hasLivingRoom: boolean;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  hasGym: boolean;
  hasGarage: boolean;
  hasHomeOffice: boolean;
  hasGameRoom: boolean;
  hasCinema: boolean;
  hasSecurityRoom: boolean;
  hasServantsQuarter: boolean;

  securityLevel: number;
  powerReliability: number;
  internetQuality: number;
  guestCapacity: number;
}

export interface House {
  id: string;
  name: string;
  type: HouseType;
  tier: HouseTier;

  neighborhood: string;

  description: string;

  purchasePrice: number;
  weeklyRent: number;

  propertyValue: number;

  reputationRequired: number;

  features: HouseFeatures;

  availableStyles: InteriorStyle[];

  maxInteriorLevel: number;

  icon: string;

  tags: string[];
}

export interface OwnedHouse {
  houseId: string;

  purchasedAt: string;

  interiorStyle: InteriorStyle;

  interiorLevel: number;

  securityLevel: number;

  furnitureValue: number;

  propertyValue: number;

  renovations: string[];

  furniture: string[];

  lastRentPaidAt?: string;
}

/*
|--------------------------------------------------------------------------
| ABUJA LIFE — PROPERTY MARKET
|--------------------------------------------------------------------------
|
| Properties are intentionally different from one another.
|
| A player should eventually have reasons to move:
|
| Starter Room
|     ↓
| Studio
|     ↓
| Standard Apartment
|     ↓
| Luxury Apartment
|     ↓
| Duplex
|     ↓
| Penthouse
|     ↓
| Mansion
|     ↓
| Estate Villa
|
|--------------------------------------------------------------------------
*/
export const HOUSES: House[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // STARTER
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: "starter-room",
    name: "Starter Room",
    type: "room",
    tier: "starter",
    neighborhood: "Garki",
    description:
      "A simple starter home for a new Abuja resident. Small, affordable and easy to upgrade.",
    purchasePrice: 0,
    weeklyRent: 0,
    propertyValue: 150000,
    reputationRequired: 0,
    features: {
      bedrooms: 1,
      bathrooms: 1,
      parkingSpaces: 0,
      hasKitchen: false,
      hasLivingRoom: false,
      hasBalcony: false,
      hasGarden: false,
      hasPool: false,
      hasGym: false,
      hasGarage: false,
      hasHomeOffice: false,
      hasGameRoom: false,
      hasCinema: false,
      hasSecurityRoom: false,
      hasServantsQuarter: false,
      securityLevel: 1,
      powerReliability: 2,
      internetQuality: 2,
      guestCapacity: 2,
    },
    availableStyles: ["basic", "minimalist"],
    maxInteriorLevel: 3,
    icon: "🛏️",
    tags: ["starter", "affordable", "first-home"],
  },

  {
    id: "jabi-modern-studio",
    name: "Jabi Modern Studio",
    type: "studio",
    tier: "standard",
    neighborhood: "Jabi",
    description:
      "A stylish modern studio close to Jabi Lake, restaurants and entertainment.",
    purchasePrice: 4500000,
    weeklyRent: 85000,
    propertyValue: 4500000,
    reputationRequired: 5,
    features: {
      bedrooms: 1,
      bathrooms: 1,
      parkingSpaces: 1,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: false,
      hasPool: false,
      hasGym: false,
      hasGarage: false,
      hasHomeOffice: false,
      hasGameRoom: false,
      hasCinema: false,
      hasSecurityRoom: false,
      hasServantsQuarter: false,
      securityLevel: 3,
      powerReliability: 4,
      internetQuality: 4,
      guestCapacity: 4,
    },
    availableStyles: ["modern", "minimalist", "african-modern"],
    maxInteriorLevel: 5,
    icon: "🏙️",
    tags: ["jabi", "studio", "modern", "lake-life"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // APARTMENTS
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: "wuse-city-apartment",
    name: "Wuse City Apartment",
    type: "apartment",
    tier: "standard",
    neighborhood: "Wuse",
    description:
      "A comfortable city apartment with modern interiors and excellent access to Wuse.",
    purchasePrice: 8500000,
    weeklyRent: 150000,
    propertyValue: 8500000,
    reputationRequired: 10,
    features: {
      bedrooms: 2,
      bathrooms: 2,
      parkingSpaces: 1,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: false,
      hasPool: false,
      hasGym: false,
      hasGarage: false,
      hasHomeOffice: true,
      hasGameRoom: false,
      hasCinema: false,
      hasSecurityRoom: false,
      hasServantsQuarter: false,
      securityLevel: 4,
      powerReliability: 4,
      internetQuality: 4,
      guestCapacity: 6,
    },
    availableStyles: ["modern", "african-modern", "minimalist"],
    maxInteriorLevel: 6,
    icon: "🏢",
    tags: ["wuse", "apartment", "city", "modern"],
  },

  {
    id: "jabi-luxury-apartment",
    name: "Jabi Lake Luxury Apartment",
    type: "apartment",
    tier: "premium",
    neighborhood: "Jabi",
    description:
      "A premium apartment designed for players who want comfort, views and nightlife nearby.",
    purchasePrice: 14500000,
    weeklyRent: 240000,
    propertyValue: 14500000,
    reputationRequired: 18,
    features: {
      bedrooms: 3,
      bathrooms: 3,
      parkingSpaces: 2,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: false,
      hasPool: true,
      hasGym: true,
      hasGarage: false,
      hasHomeOffice: true,
      hasGameRoom: false,
      hasCinema: false,
      hasSecurityRoom: false,
      hasServantsQuarter: false,
      securityLevel: 6,
      powerReliability: 5,
      internetQuality: 5,
      guestCapacity: 10,
    },
    availableStyles: ["modern", "luxury", "african-modern"],
    maxInteriorLevel: 8,
    icon: "🌆",
    tags: ["jabi", "luxury", "pool", "gym"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DUPLEXES
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: "gwarinpa-family-duplex",
    name: "Gwarinpa Family Duplex",
    type: "duplex",
    tier: "premium",
    neighborhood: "Gwarinpa",
    description:
      "A spacious family duplex with private outdoor space, multiple rooms and room to grow.",
    purchasePrice: 35000000,
    weeklyRent: 450000,
    propertyValue: 35000000,
    reputationRequired: 30,
    features: {
      bedrooms: 4,
      bathrooms: 4,
      parkingSpaces: 3,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: true,
      hasPool: false,
      hasGym: false,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: true,
      hasCinema: false,
      hasSecurityRoom: true,
      hasServantsQuarter: true,
      securityLevel: 6,
      powerReliability: 5,
      internetQuality: 5,
      guestCapacity: 14,
    },
    availableStyles: ["modern", "african-modern", "executive"],
    maxInteriorLevel: 9,
    icon: "🏡",
    tags: ["gwarinpa", "duplex", "family", "garden"],
  },

  {
    id: "wuse-2-luxury-duplex",
    name: "Wuse 2 Luxury Duplex",
    type: "duplex",
    tier: "luxury",
    neighborhood: "Wuse 2",
    description:
      "A high-end duplex surrounded by Abuja nightlife, restaurants, shopping and premium entertainment.",
    purchasePrice: 65000000,
    weeklyRent: 750000,
    propertyValue: 65000000,
    reputationRequired: 50,
    features: {
      bedrooms: 5,
      bathrooms: 5,
      parkingSpaces: 4,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: true,
      hasPool: true,
      hasGym: true,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: true,
      hasCinema: true,
      hasSecurityRoom: true,
      hasServantsQuarter: true,
      securityLevel: 8,
      powerReliability: 6,
      internetQuality: 6,
      guestCapacity: 18,
    },
    availableStyles: ["luxury", "modern", "executive"],
    maxInteriorLevel: 10,
    icon: "🏰",
    tags: ["wuse-2", "luxury", "duplex", "nightlife"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PENTHOUSES
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: "wuse-2-sky-penthouse",
    name: "Wuse 2 Sky Penthouse",
    type: "penthouse",
    tier: "luxury",
    neighborhood: "Wuse 2",
    description:
      "A spectacular penthouse with skyline views, private entertainment space and luxury amenities.",
    purchasePrice: 95000000,
    weeklyRent: 1200000,
    propertyValue: 95000000,
    reputationRequired: 70,
    features: {
      bedrooms: 4,
      bathrooms: 5,
      parkingSpaces: 4,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: false,
      hasPool: true,
      hasGym: true,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: true,
      hasCinema: true,
      hasSecurityRoom: true,
      hasServantsQuarter: true,
      securityLevel: 9,
      powerReliability: 7,
      internetQuality: 7,
      guestCapacity: 20,
    },
    availableStyles: ["luxury", "modern", "executive", "minimalist"],
    maxInteriorLevel: 10,
    icon: "💎",
    tags: ["wuse-2", "penthouse", "skyline", "vip"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MANSIONS
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: "maitama-grand-mansion",
    name: "Maitama Grand Mansion",
    type: "mansion",
    tier: "elite",
    neighborhood: "Maitama",
    description:
      "An enormous private mansion with luxury rooms, entertainment areas, garden space and premium security.",
    purchasePrice: 180000000,
    weeklyRent: 2500000,
    propertyValue: 180000000,
    reputationRequired: 100,
    features: {
      bedrooms: 7,
      bathrooms: 8,
      parkingSpaces: 8,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: true,
      hasPool: true,
      hasGym: true,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: true,
      hasCinema: true,
      hasSecurityRoom: true,
      hasServantsQuarter: true,
      securityLevel: 10,
      powerReliability: 8,
      internetQuality: 8,
      guestCapacity: 35,
    },
    availableStyles: ["luxury", "executive", "modern", "african-modern"],
    maxInteriorLevel: 12,
    icon: "🏛️",
    tags: ["maitama", "mansion", "elite", "luxury"],
  },

  {
    id: "asokoro-grand-villa",
    name: "Asokoro Grand Villa",
    type: "mansion",
    tier: "elite",
    neighborhood: "Asokoro",
    description:
      "A prestigious Abuja villa with huge grounds, private pool, luxury entertainment areas and elite security.",
    purchasePrice: 320000000,
    weeklyRent: 4000000,
    propertyValue: 320000000,
    reputationRequired: 140,
    features: {
      bedrooms: 8,
      bathrooms: 10,
      parkingSpaces: 10,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: true,
      hasPool: true,
      hasGym: true,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: true,
      hasCinema: true,
      hasSecurityRoom: true,
      hasServantsQuarter: true,
      securityLevel: 10,
      powerReliability: 9,
      internetQuality: 9,
      guestCapacity: 45,
    },
    availableStyles: ["luxury", "executive", "african-modern"],
    maxInteriorLevel: 15,
    icon: "🏰",
    tags: ["asokoro", "villa", "elite", "private"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ESTATES
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: "guzape-executive-estate",
    name: "Guzape Executive Estate",
    type: "estate",
    tier: "luxury",
    neighborhood: "Guzape",
    description:
      "A private gated estate property with multiple living spaces, landscaped grounds and premium security.",
    purchasePrice: 450000000,
    weeklyRent: 5500000,
    propertyValue: 450000000,
    reputationRequired: 180,
    features: {
      bedrooms: 9,
      bathrooms: 10,
      parkingSpaces: 12,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: true,
      hasPool: true,
      hasGym: true,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: true,
      hasCinema: true,
      hasSecurityRoom: true,
      hasServantsQuarter: true,
      securityLevel: 10,
      powerReliability: 9,
      internetQuality: 9,
      guestCapacity: 50,
    },
    availableStyles: ["luxury", "executive", "modern"],
    maxInteriorLevel: 15,
    icon: "🏘️",
    tags: ["guzape", "estate", "gated", "luxury"],
  },

  {
    id: "maitama-private-estate",
    name: "Maitama Private Estate",
    type: "estate",
    tier: "elite",
    neighborhood: "Maitama",
    description:
      "One of Abuja Life's most prestigious properties. A massive private estate designed for the wealthiest players.",
    purchasePrice: 750000000,
    weeklyRent: 9000000,
    propertyValue: 750000000,
    reputationRequired: 250,
    features: {
      bedrooms: 12,
      bathrooms: 14,
      parkingSpaces: 20,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: true,
      hasPool: true,
      hasGym: true,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: true,
      hasCinema: true,
      hasSecurityRoom: true,
      hasServantsQuarter: true,
      securityLevel: 10,
      powerReliability: 10,
      internetQuality: 10,
      guestCapacity: 70,
    },
    availableStyles: ["luxury", "executive", "african-modern"],
    maxInteriorLevel: 20,
    icon: "👑",
    tags: ["maitama", "private-estate", "elite", "endgame"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LAND
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: "gwarinpa-residential-land",
    name: "Gwarinpa Residential Plot",
    type: "land",
    tier: "standard",
    neighborhood: "Gwarinpa",
    description:
      "A residential plot ready for your first custom build.",
    purchasePrice: 18000000,
    weeklyRent: 0,
    propertyValue: 18000000,
    reputationRequired: 25,
    features: {
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 0,
      hasKitchen: false,
      hasLivingRoom: false,
      hasBalcony: false,
      hasGarden: true,
      hasPool: false,
      hasGym: false,
      hasGarage: false,
      hasHomeOffice: false,
      hasGameRoom: false,
      hasCinema: false,
      hasSecurityRoom: false,
      hasServantsQuarter: false,
      securityLevel: 2,
      powerReliability: 3,
      internetQuality: 1,
      guestCapacity: 0,
    },
    availableStyles: ["modern", "african-modern", "minimalist"],
    maxInteriorLevel: 1,
    icon: "🌳",
    tags: ["land", "gwarinpa", "residential", "build"],
  },

  {
    id: "jabi-double-plot",
    name: "Jabi Double Plot",
    type: "land",
    tier: "premium",
    neighborhood: "Jabi",
    description:
      "A large double plot with enough space for a luxury home, guest house and private outdoor facilities.",
    purchasePrice: 65000000,
    weeklyRent: 0,
    propertyValue: 65000000,
    reputationRequired: 60,
    features: {
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 8,
      hasKitchen: false,
      hasLivingRoom: false,
      hasBalcony: false,
      hasGarden: true,
      hasPool: true,
      hasGym: false,
      hasGarage: true,
      hasHomeOffice: false,
      hasGameRoom: false,
      hasCinema: false,
      hasSecurityRoom: true,
      hasServantsQuarter: false,
      securityLevel: 5,
      powerReliability: 5,
      internetQuality: 2,
      guestCapacity: 0,
    },
    availableStyles: ["modern", "luxury", "african-modern"],
    maxInteriorLevel: 1,
    icon: "🌿",
    tags: ["land", "jabi", "double-plot", "custom-build"],
  },

  {
    id: "asokoro-estate-land",
    name: "Asokoro Estate Land",
    type: "land",
    tier: "elite",
    neighborhood: "Asokoro",
    description:
      "A premium piece of land for players planning to build an enormous private estate.",
    purchasePrice: 180000000,
    weeklyRent: 0,
    propertyValue: 180000000,
    reputationRequired: 150,
    features: {
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 20,
      hasKitchen: false,
      hasLivingRoom: false,
      hasBalcony: false,
      hasGarden: true,
      hasPool: true,
      hasGym: true,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: true,
      hasCinema: true,
      hasSecurityRoom: true,
      hasServantsQuarter: true,
      securityLevel: 8,
      powerReliability: 8,
      internetQuality: 5,
      guestCapacity: 0,
    },
    availableStyles: ["luxury", "executive", "african-modern"],
    maxInteriorLevel: 1,
    icon: "🌴",
    tags: ["land", "asokoro", "estate", "mega-build"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMMERCIAL
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: "wuse-commercial-plaza",
    name: "Wuse Commercial Plaza",
    type: "commercial",
    tier: "premium",
    neighborhood: "Wuse",
    description:
      "A commercial property suitable for opening shops, restaurants, offices and player businesses.",
    purchasePrice: 85000000,
    weeklyRent: 1000000,
    propertyValue: 85000000,
    reputationRequired: 70,
    features: {
      bedrooms: 0,
      bathrooms: 6,
      parkingSpaces: 15,
      hasKitchen: true,
      hasLivingRoom: false,
      hasBalcony: true,
      hasGarden: false,
      hasPool: false,
      hasGym: false,
      hasGarage: false,
      hasHomeOffice: true,
      hasGameRoom: false,
      hasCinema: false,
      hasSecurityRoom: true,
      hasServantsQuarter: false,
      securityLevel: 7,
      powerReliability: 7,
      internetQuality: 8,
      guestCapacity: 100,
    },
    availableStyles: ["modern", "executive"],
    maxInteriorLevel: 10,
    icon: "🏢",
    tags: ["commercial", "wuse", "business", "plaza"],
  },

  {
    id: "jabi-business-complex",
    name: "Jabi Business Complex",
    type: "commercial",
    tier: "luxury",
    neighborhood: "Jabi",
    description:
      "A large business complex overlooking one of Abuja's busiest entertainment districts.",
    purchasePrice: 220000000,
    weeklyRent: 2500000,
    propertyValue: 220000000,
    reputationRequired: 130,
    features: {
      bedrooms: 0,
      bathrooms: 12,
      parkingSpaces: 30,
      hasKitchen: true,
      hasLivingRoom: false,
      hasBalcony: true,
      hasGarden: true,
      hasPool: false,
      hasGym: false,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: false,
      hasCinema: false,
      hasSecurityRoom: true,
      hasServantsQuarter: false,
      securityLevel: 9,
      powerReliability: 9,
      internetQuality: 10,
      guestCapacity: 250,
    },
    availableStyles: ["modern", "executive", "luxury"],
    maxInteriorLevel: 12,
    icon: "🏙️",
    tags: ["commercial", "jabi", "business", "complex"],
  },

  {
    id: "abuja-luxury-hotel",
    name: "Abuja Luxury Hotel",
    type: "commercial",
    tier: "elite",
    neighborhood: "CBD",
    description:
      "A massive luxury hotel property that can eventually become a major player-owned business.",
    purchasePrice: 600000000,
    weeklyRent: 7000000,
    propertyValue: 600000000,
    reputationRequired: 220,
    features: {
      bedrooms: 50,
      bathrooms: 55,
      parkingSpaces: 80,
      hasKitchen: true,
      hasLivingRoom: true,
      hasBalcony: true,
      hasGarden: true,
      hasPool: true,
      hasGym: true,
      hasGarage: true,
      hasHomeOffice: true,
      hasGameRoom: true,
      hasCinema: true,
      hasSecurityRoom: true,
      hasServantsQuarter: true,
      securityLevel: 10,
      powerReliability: 10,
      internetQuality: 10,
      guestCapacity: 300,
    },
    availableStyles: ["luxury", "executive", "modern"],
    maxInteriorLevel: 20,
    icon: "🏨",
    tags: ["hotel", "commercial", "cbd", "business", "endgame"],
  },
];
  
/*
|--------------------------------------------------------------------------
| FURNITURE
|--------------------------------------------------------------------------
*/

export interface FurnitureItem {
  id: string;
  name: string;
  category:
    | "living"
    | "bedroom"
    | "kitchen"
    | "office"
    | "entertainment"
    | "outdoor"
    | "security";

  price: number;

  comfort: number;
  prestige: number;

  description: string;

  icon: string;
}

export const FURNITURE_ITEMS: FurnitureItem[] = [
  {
    id: "basic-sofa",
    name: "Basic Sofa",
    category: "living",
    price: 45000,
    comfort: 3,
    prestige: 1,
    description: "A simple but comfortable sofa.",
    icon: "🛋️",
  },

  {
    id: "designer-sofa",
    name: "Designer Sofa",
    category: "living",
    price: 350000,
    comfort: 8,
    prestige: 7,
    description: "A premium sofa that gives your living room serious style.",
    icon: "🛋️",
  },

  {
    id: "smart-tv",
    name: "Smart TV",
    category: "entertainment",
    price: 280000,
    comfort: 5,
    prestige: 5,
    description: "Watch entertainment and keep up with Abuja Daily.",
    icon: "📺",
  },

  {
    id: "gaming-setup",
    name: "Gaming Setup",
    category: "entertainment",
    price: 750000,
    comfort: 8,
    prestige: 8,
    description: "A serious gaming station for tournaments and relaxation.",
    icon: "🎮",
  },

  {
    id: "home-office",
    name: "Executive Home Office",
    category: "office",
    price: 900000,
    comfort: 7,
    prestige: 9,
    description: "A professional workspace for ambitious players.",
    icon: "💼",
  },

  {
    id: "luxury-bed",
    name: "Luxury Bed",
    category: "bedroom",
    price: 650000,
    comfort: 10,
    prestige: 8,
    description: "A premium bed that makes recovery more comfortable.",
    icon: "🛏️",
  },

  {
    id: "modern-kitchen",
    name: "Modern Kitchen",
    category: "kitchen",
    price: 1200000,
    comfort: 8,
    prestige: 8,
    description: "A fully upgraded kitchen for cooking and entertaining.",
    icon: "🍳",
  },

  {
    id: "pool-lounge",
    name: "Pool Lounge",
    category: "outdoor",
    price: 1500000,
    comfort: 9,
    prestige: 10,
    description: "A luxury outdoor area for parties and relaxation.",
    icon: "🏖️",
  },

  {
    id: "security-upgrade",
    name: "Advanced Security System",
    category: "security",
    price: 1800000,
    comfort: 2,
    prestige: 7,
    description: "Cameras, access control and advanced home security.",
    icon: "🔐",
  },
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

export function getHouseById(id: string): House | undefined {
  return HOUSES.find((house) => house.id === id);
}

export function getHousesByNeighborhood(
  neighborhood: string
): House[] {
  return HOUSES.filter(
    (house) =>
      house.neighborhood.toLowerCase() ===
      neighborhood.toLowerCase()
  );
}

export function getHousesByTier(
  tier: HouseTier
): House[] {
  return HOUSES.filter(
    (house) => house.tier === tier
  );
}

export function getAffordableHouses(
  cash: number,
  reputation: number
): House[] {
  return HOUSES.filter(
    (house) =>
      house.purchasePrice <= cash &&
      house.reputationRequired <= reputation
  );
}

export function canBuyHouse(
  house: House,
  cash: number,
  reputation: number
): boolean {
  return (
    cash >= house.purchasePrice &&
    reputation >= house.reputationRequired
  );
}

export function getFurnitureById(
  id: string
): FurnitureItem | undefined {
  return FURNITURE_ITEMS.find(
    (item) => item.id === id
  );
}

export function calculateFurniturePrestige(
  furnitureIds: string[]
): number {
  return furnitureIds.reduce((total, furnitureId) => {
    const item = getFurnitureById(furnitureId);

    return total + (item?.prestige ?? 0);
  }, 0);
}

export function calculateFurnitureComfort(
  furnitureIds: string[]
): number {
  return furnitureIds.reduce((total, furnitureId) => {
    const item = getFurnitureById(furnitureId);

    return total + (item?.comfort ?? 0);
  }, 0);
}

export function calculateHouseValue(
  house: House,
  furnitureIds: string[],
  interiorLevel: number
): number {
  const furnitureValue = furnitureIds.reduce(
    (total, furnitureId) => {
      const item = getFurnitureById(furnitureId);

      return total + (item?.price ?? 0);
    },
    0
  );

  const interiorBonus =
    Math.max(0, interiorLevel - 1) *
    Math.floor(house.purchasePrice * 0.03);

  return (
    house.propertyValue +
    furnitureValue +
    interiorBonus
  );
}

export function getHousePrestige(
  house: House,
  furnitureIds: string[],
  interiorLevel: number
): number {
  const furniturePrestige =
    calculateFurniturePrestige(furnitureIds);

  const featurePrestige =
    Number(house.features.hasPool) * 10 +
    Number(house.features.hasGym) * 8 +
    Number(house.features.hasCinema) * 10 +
    Number(house.features.hasGarage) * 5 +
    Number(house.features.hasGarden) * 4 +
    Number(house.features.hasGameRoom) * 5 +
    house.features.securityLevel;

  return (
    furniturePrestige +
    featurePrestige +
    interiorLevel * 2
  );
}