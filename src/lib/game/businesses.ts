export type BusinessCategory =
  | "food"
  | "hospitality"
  | "fashion"
  | "beauty"
  | "events"
  | "creative"
  | "retail"
  | "automotive"
  | "transport"
  | "professional"
  | "entertainment"
  | "technology";

export type BusinessTier =
  | "starter"
  | "standard"
  | "premium"
  | "luxury";

export type BusinessGameplay =
  | "restaurant"
  | "cafe"
  | "food"
  | "hotel"
  | "fashion"
  | "salon"
  | "barbershop"
  | "event-planner"
  | "interior-design"
  | "photography"
  | "decoration"
  | "creative"
  | "retail"
  | "automotive"
  | "transport"
  | "professional"
  | "entertainment"
  | "technology";

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  tier: BusinessTier;
  gameplay: BusinessGameplay;
  description: string;

  neighborhood: string;
  locationId: string;

  startupCost: number;
  dailyOperatingCost: number;

  baseDailyRevenue: number;
  maximumDailyRevenue: number;

  reputationRequired: number;
  levelRequired: number;

  staffSlots: number;
  upgradeSlots: number;

  customerCapacity: number;

  tags: string[];
}

export interface OwnedBusiness {
  id: string;
  businessId: string;
  ownerId?: string;

  name: string;

  level: number;
  reputation: number;

  condition: number;
  customerSatisfaction: number;

  dailyRevenue: number;
  totalRevenue: number;

  staffCount: number;
  upgradeIds: string[];

  locationId: string;

  createdAt: string;
}

export interface BusinessUpgrade {
  id: string;
  name: string;
  description: string;

  category: BusinessCategory;

  cost: number;
  reputationGain: number;
  revenueMultiplier: number;

  levelRequired: number;

  tags: string[];
}

export const BUSINESS_CATEGORIES: {
  id: BusinessCategory;
  name: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "food",
    name: "Food & Catering",
    icon: "🍔",
    description: "Restaurants, food vendors, bakeries and catering businesses.",
  },
  {
    id: "hospitality",
    name: "Hospitality",
    icon: "🏨",
    description: "Hotels, lounges and premium hospitality businesses.",
  },
  {
    id: "fashion",
    name: "Fashion",
    icon: "👗",
    description: "Fashion stores, designers, boutiques and sneaker businesses.",
  },
  {
    id: "beauty",
    name: "Beauty",
    icon: "💄",
    description: "Salons, barbershops, nail studios and beauty businesses.",
  },
  {
    id: "events",
    name: "Events",
    icon: "🎉",
    description: "Event planners, decorators, promoters and event services.",
  },
  {
    id: "creative",
    name: "Creative",
    icon: "🎨",
    description: "Photography, video, design, decoration and media businesses.",
  },
  {
    id: "retail",
    name: "Retail",
    icon: "🛍️",
    description: "Stores selling products to Abuja residents and players.",
  },
  {
    id: "automotive",
    name: "Automotive",
    icon: "🚗",
    description: "Car dealerships, garages, detailing and automotive services.",
  },
  {
    id: "transport",
    name: "Transport",
    icon: "🚕",
    description: "Taxi, delivery, rental and transport companies.",
  },
  {
    id: "professional",
    name: "Professional",
    icon: "💼",
    description: "Agencies, consulting, construction and professional services.",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎮",
    description: "Clubs, gaming lounges, cinemas and entertainment venues.",
  },
  {
    id: "technology",
    name: "Technology",
    icon: "💻",
    description: "Software, digital agencies and technology businesses.",
  },
];

export const BUSINESSES: Business[] = [
  // FOOD
  {
    id: "food-vendor",
    name: "Food Vendor",
    category: "food",
    tier: "starter",
    gameplay: "food",
    description: "A small food business serving quick meals around Abuja.",
    neighborhood: "Garki",
    locationId: "garki",
    startupCost: 150000,
    dailyOperatingCost: 12000,
    baseDailyRevenue: 18000,
    maximumDailyRevenue: 65000,
    reputationRequired: 0,
    levelRequired: 1,
    staffSlots: 2,
    upgradeSlots: 3,
    customerCapacity: 30,
    tags: ["starter", "food", "low-cost"],
  },
  {
    id: "bakery",
    name: "Bakery",
    category: "food",
    tier: "standard",
    gameplay: "food",
    description: "A neighborhood bakery producing bread, pastries and cakes.",
    neighborhood: "Wuse",
    locationId: "wuse",
    startupCost: 850000,
    dailyOperatingCost: 35000,
    baseDailyRevenue: 55000,
    maximumDailyRevenue: 180000,
    reputationRequired: 10,
    levelRequired: 2,
    staffSlots: 5,
    upgradeSlots: 5,
    customerCapacity: 80,
    tags: ["food", "bakery", "popular"],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    category: "food",
    tier: "standard",
    gameplay: "restaurant",
    description: "A full restaurant serving Abuja residents and players.",
    neighborhood: "Wuse 2",
    locationId: "wuse-2",
    startupCost: 2500000,
    dailyOperatingCost: 85000,
    baseDailyRevenue: 140000,
    maximumDailyRevenue: 550000,
    reputationRequired: 20,
    levelRequired: 3,
    staffSlots: 10,
    upgradeSlots: 7,
    customerCapacity: 120,
    tags: ["food", "restaurant", "social"],
  },
  {
    id: "catering-company",
    name: "Catering Company",
    category: "food",
    tier: "premium",
    gameplay: "food",
    description: "Provide food services for weddings, parties and major events.",
    neighborhood: "Garki",
    locationId: "garki",
    startupCost: 4500000,
    dailyOperatingCost: 120000,
    baseDailyRevenue: 250000,
    maximumDailyRevenue: 900000,
    reputationRequired: 35,
    levelRequired: 5,
    staffSlots: 15,
    upgradeSlots: 8,
    customerCapacity: 250,
    tags: ["catering", "events", "premium"],
  },

  // HOSPITALITY
  {
    id: "lounge",
    name: "Lounge",
    category: "hospitality",
    tier: "premium",
    gameplay: "entertainment",
    description: "A stylish Abuja lounge for social nights and private gatherings.",
    neighborhood: "Jabi",
    locationId: "jabi",
    startupCost: 7500000,
    dailyOperatingCost: 250000,
    baseDailyRevenue: 450000,
    maximumDailyRevenue: 1800000,
    reputationRequired: 45,
    levelRequired: 6,
    staffSlots: 20,
    upgradeSlots: 10,
    customerCapacity: 300,
    tags: ["nightlife", "social", "premium"],
  },
  {
    id: "hotel",
    name: "Boutique Hotel",
    category: "hospitality",
    tier: "luxury",
    gameplay: "hotel",
    description: "A premium hotel with rooms, services and VIP hospitality.",
    neighborhood: "Maitama",
    locationId: "maitama",
    startupCost: 45000000,
    dailyOperatingCost: 1200000,
    baseDailyRevenue: 1800000,
    maximumDailyRevenue: 8500000,
    reputationRequired: 100,
    levelRequired: 12,
    staffSlots: 60,
    upgradeSlots: 15,
    customerCapacity: 180,
    tags: ["hotel", "luxury", "vip"],
  },

  // FASHION
  {
    id: "fashion-boutique",
    name: "Fashion Boutique",
    category: "fashion",
    tier: "standard",
    gameplay: "fashion",
    description: "Sell fashionable clothing and accessories.",
    neighborhood: "Wuse",
    locationId: "wuse",
    startupCost: 1200000,
    dailyOperatingCost: 45000,
    baseDailyRevenue: 90000,
    maximumDailyRevenue: 350000,
    reputationRequired: 15,
    levelRequired: 3,
    staffSlots: 5,
    upgradeSlots: 6,
    customerCapacity: 70,
    tags: ["fashion", "retail", "style"],
  },
  {
    id: "fashion-designer",
    name: "Fashion Design Studio",
    category: "fashion",
    tier: "premium",
    gameplay: "fashion",
    description: "Design custom outfits for players and special events.",
    neighborhood: "Wuse 2",
    locationId: "wuse-2",
    startupCost: 3500000,
    dailyOperatingCost: 90000,
    baseDailyRevenue: 180000,
    maximumDailyRevenue: 750000,
    reputationRequired: 30,
    levelRequired: 5,
    staffSlots: 8,
    upgradeSlots: 8,
    customerCapacity: 50,
    tags: ["designer", "fashion", "custom"],
  },
  {
    id: "sneaker-store",
    name: "Sneaker Store",
    category: "fashion",
    tier: "premium",
    gameplay: "retail",
    description: "Sell premium sneakers and collectible footwear.",
    neighborhood: "Jabi",
    locationId: "jabi",
    startupCost: 4000000,
    dailyOperatingCost: 100000,
    baseDailyRevenue: 220000,
    maximumDailyRevenue: 900000,
    reputationRequired: 35,
    levelRequired: 6,
    staffSlots: 8,
    upgradeSlots: 7,
    customerCapacity: 100,
    tags: ["sneakers", "fashion", "collectibles"],
  },

  // BEAUTY
  {
    id: "barbershop",
    name: "Barbershop",
    category: "beauty",
    tier: "starter",
    gameplay: "barbershop",
    description: "A neighborhood barbershop offering cuts and grooming.",
    neighborhood: "Garki",
    locationId: "garki",
    startupCost: 350000,
    dailyOperatingCost: 18000,
    baseDailyRevenue: 30000,
    maximumDailyRevenue: 120000,
    reputationRequired: 0,
    levelRequired: 1,
    staffSlots: 3,
    upgradeSlots: 4,
    customerCapacity: 35,
    tags: ["grooming", "starter", "beauty"],
  },
  {
    id: "beauty-salon",
    name: "Beauty Salon",
    category: "beauty",
    tier: "standard",
    gameplay: "salon",
    description: "A full-service beauty salon.",
    neighborhood: "Wuse",
    locationId: "wuse",
    startupCost: 1500000,
    dailyOperatingCost: 55000,
    baseDailyRevenue: 110000,
    maximumDailyRevenue: 420000,
    reputationRequired: 15,
    levelRequired: 3,
    staffSlots: 7,
    upgradeSlots: 6,
    customerCapacity: 60,
    tags: ["beauty", "salon", "social"],
  },

  // EVENTS
  {
    id: "event-planning-company",
    name: "Event Planning Company",
    category: "events",
    tier: "premium",
    gameplay: "event-planner",
    description:
      "Plan weddings, birthdays, concerts, corporate events and city celebrations.",
    neighborhood: "Maitama",
    locationId: "maitama",
    startupCost: 5000000,
    dailyOperatingCost: 100000,
    baseDailyRevenue: 250000,
    maximumDailyRevenue: 1500000,
    reputationRequired: 25,
    levelRequired: 5,
    staffSlots: 12,
    upgradeSlots: 10,
    customerCapacity: 500,
    tags: ["events", "weddings", "planning", "premium"],
  },
  {
    id: "event-decoration",
    name: "Event Decoration Company",
    category: "events",
    tier: "standard",
    gameplay: "decoration",
    description:
      "Decorate weddings, parties, concerts and premium Abuja events.",
    neighborhood: "Jabi",
    locationId: "jabi",
    startupCost: 1800000,
    dailyOperatingCost: 50000,
    baseDailyRevenue: 100000,
    maximumDailyRevenue: 600000,
    reputationRequired: 15,
    levelRequired: 3,
    staffSlots: 8,
    upgradeSlots: 8,
    customerCapacity: 250,
    tags: ["decoration", "events", "creative"],
  },
  {
    id: "event-promotion",
    name: "Event Promotion Agency",
    category: "events",
    tier: "premium",
    gameplay: "professional",
    description:
      "Promote concerts, festivals, parties and player-run events.",
    neighborhood: "Wuse 2",
    locationId: "wuse-2",
    startupCost: 3000000,
    dailyOperatingCost: 75000,
    baseDailyRevenue: 160000,
    maximumDailyRevenue: 800000,
    reputationRequired: 30,
    levelRequired: 5,
    staffSlots: 10,
    upgradeSlots: 8,
    customerCapacity: 1000,
    tags: ["promotion", "events", "marketing"],
  },

  // CREATIVE
  {
    id: "interior-design-studio",
    name: "Interior Design Studio",
    category: "creative",
    tier: "premium",
    gameplay: "interior-design",
    description:
      "Design and decorate player homes, apartments, mansions and businesses.",
    neighborhood: "Maitama",
    locationId: "maitama",
    startupCost: 4000000,
    dailyOperatingCost: 80000,
    baseDailyRevenue: 180000,
    maximumDailyRevenue: 900000,
    reputationRequired: 25,
    levelRequired: 5,
    staffSlots: 8,
    upgradeSlots: 10,
    customerCapacity: 40,
    tags: ["interior", "design", "homes", "premium"],
  },
  {
    id: "photography-studio",
    name: "Photography Studio",
    category: "creative",
    tier: "standard",
    gameplay: "photography",
    description:
      "Take player portraits, event photographs and promotional campaigns.",
    neighborhood: "Jabi",
    locationId: "jabi",
    startupCost: 1500000,
    dailyOperatingCost: 40000,
    baseDailyRevenue: 90000,
    maximumDailyRevenue: 450000,
    reputationRequired: 10,
    levelRequired: 3,
    staffSlots: 5,
    upgradeSlots: 7,
    customerCapacity: 30,
    tags: ["photography", "creative", "events"],
  },
  {
    id: "video-production",
    name: "Film & Video Studio",
    category: "creative",
    tier: "premium",
    gameplay: "creative",
    description:
      "Produce adverts, music videos, documentaries and player content.",
    neighborhood: "CBD",
    locationId: "cbd",
    startupCost: 6000000,
    dailyOperatingCost: 150000,
    baseDailyRevenue: 300000,
    maximumDailyRevenue: 1200000,
    reputationRequired: 40,
    levelRequired: 7,
    staffSlots: 15,
    upgradeSlots: 12,
    customerCapacity: 100,
    tags: ["film", "video", "media"],
  },

  // RETAIL
  {
    id: "supermarket",
    name: "Supermarket",
    category: "retail",
    tier: "premium",
    gameplay: "retail",
    description: "A large store selling everyday products.",
    neighborhood: "Gwarinpa",
    locationId: "gwarinpa",
    startupCost: 8500000,
    dailyOperatingCost: 280000,
    baseDailyRevenue: 450000,
    maximumDailyRevenue: 1800000,
    reputationRequired: 30,
    levelRequired: 6,
    staffSlots: 20,
    upgradeSlots: 10,
    customerCapacity: 400,
    tags: ["retail", "shopping", "large"],
  },
  {
    id: "phone-store",
    name: "Phone & Gadget Store",
    category: "retail",
    tier: "standard",
    gameplay: "retail",
    description: "Sell phones, gadgets and digital accessories.",
    neighborhood: "Wuse",
    locationId: "wuse",
    startupCost: 2500000,
    dailyOperatingCost: 80000,
    baseDailyRevenue: 180000,
    maximumDailyRevenue: 700000,
    reputationRequired: 20,
    levelRequired: 4,
    staffSlots: 8,
    upgradeSlots: 7,
    customerCapacity: 100,
    tags: ["technology", "retail", "gadgets"],
  },
  {
    id: "furniture-store",
    name: "Furniture Store",
    category: "retail",
    tier: "premium",
    gameplay: "retail",
    description:
      "Sell furniture and home items used to customize player properties.",
    neighborhood: "Gwarinpa",
    locationId: "gwarinpa",
    startupCost: 6500000,
    dailyOperatingCost: 180000,
    baseDailyRevenue: 350000,
    maximumDailyRevenue: 1400000,
    reputationRequired: 30,
    levelRequired: 6,
    staffSlots: 12,
    upgradeSlots: 10,
    customerCapacity: 200,
    tags: ["furniture", "homes", "retail"],
  },

  // AUTOMOTIVE
  {
    id: "car-wash",
    name: "Car Wash",
    category: "automotive",
    tier: "starter",
    gameplay: "automotive",
    description: "Wash and detail player vehicles.",
    neighborhood: "Jabi",
    locationId: "jabi",
    startupCost: 600000,
    dailyOperatingCost: 25000,
    baseDailyRevenue: 45000,
    maximumDailyRevenue: 180000,
    reputationRequired: 0,
    levelRequired: 1,
    staffSlots: 5,
    upgradeSlots: 5,
    customerCapacity: 40,
    tags: ["cars", "automotive", "starter"],
  },
  {
    id: "auto-repair",
    name: "Auto Repair Garage",
    category: "automotive",
    tier: "standard",
    gameplay: "automotive",
    description: "Repair, service and maintain player vehicles.",
    neighborhood: "Jabi",
    locationId: "jabi",
    startupCost: 3000000,
    dailyOperatingCost: 90000,
    baseDailyRevenue: 180000,
    maximumDailyRevenue: 750000,
    reputationRequired: 20,
    levelRequired: 4,
    staffSlots: 10,
    upgradeSlots: 8,
    customerCapacity: 80,
    tags: ["cars", "repair", "mechanic"],
  },
  {
    id: "car-rental",
    name: "Car Rental Company",
    category: "transport",
    tier: "premium",
    gameplay: "transport",
    description: "Rent vehicles to players travelling around Abuja.",
    neighborhood: "CBD",
    locationId: "cbd",
    startupCost: 12000000,
    dailyOperatingCost: 300000,
    baseDailyRevenue: 500000,
    maximumDailyRevenue: 2200000,
    reputationRequired: 40,
    levelRequired: 8,
    staffSlots: 15,
    upgradeSlots: 12,
    customerCapacity: 100,
    tags: ["cars", "rental", "transport"],
  },

  // PROFESSIONAL
  {
    id: "real-estate-agency",
    name: "Real Estate Agency",
    category: "professional",
    tier: "premium",
    gameplay: "professional",
    description:
      "Help players find, rent, sell and upgrade properties around Abuja.",
    neighborhood: "Maitama",
    locationId: "maitama",
    startupCost: 7500000,
    dailyOperatingCost: 120000,
    baseDailyRevenue: 350000,
    maximumDailyRevenue: 1800000,
    reputationRequired: 40,
    levelRequired: 8,
    staffSlots: 12,
    upgradeSlots: 10,
    customerCapacity: 100,
    tags: ["property", "real-estate", "professional"],
  },
  {
    id: "construction-company",
    name: "Construction Company",
    category: "professional",
    tier: "luxury",
    gameplay: "professional",
    description:
      "Build and upgrade player properties and commercial locations.",
    neighborhood: "CBD",
    locationId: "cbd",
    startupCost: 25000000,
    dailyOperatingCost: 600000,
    baseDailyRevenue: 900000,
    maximumDailyRevenue: 4500000,
    reputationRequired: 75,
    levelRequired: 10,
    staffSlots: 30,
    upgradeSlots: 15,
    customerCapacity: 200,
    tags: ["construction", "property", "luxury"],
  },

  // ENTERTAINMENT
  {
    id: "gaming-lounge",
    name: "Gaming Lounge",
    category: "entertainment",
    tier: "standard",
    gameplay: "entertainment",
    description:
      "A gaming venue where players can compete in tournaments.",
    neighborhood: "Jabi",
    locationId: "jabi",
    startupCost: 2200000,
    dailyOperatingCost: 70000,
    baseDailyRevenue: 130000,
    maximumDailyRevenue: 650000,
    reputationRequired: 15,
    levelRequired: 3,
    staffSlots: 8,
    upgradeSlots: 8,
    customerCapacity: 100,
    tags: ["gaming", "social", "tournaments"],
  },
  {
    id: "nightclub",
    name: "Nightclub",
    category: "entertainment",
    tier: "luxury",
    gameplay: "entertainment",
    description:
      "A major nightlife venue hosting DJs, parties and VIP events.",
    neighborhood: "Wuse 2",
    locationId: "wuse-2",
    startupCost: 18000000,
    dailyOperatingCost: 550000,
    baseDailyRevenue: 850000,
    maximumDailyRevenue: 4000000,
    reputationRequired: 70,
    levelRequired: 10,
    staffSlots: 30,
    upgradeSlots: 15,
    customerCapacity: 800,
    tags: ["nightlife", "music", "vip", "events"],
  },

  // TECHNOLOGY
  {
    id: "software-company",
    name: "Software Company",
    category: "technology",
    tier: "premium",
    gameplay: "technology",
    description:
      "Build digital products, websites and software for Abuja businesses.",
    neighborhood: "CBD",
    locationId: "cbd",
    startupCost: 5500000,
    dailyOperatingCost: 120000,
    baseDailyRevenue: 300000,
    maximumDailyRevenue: 1500000,
    reputationRequired: 30,
    levelRequired: 6,
    staffSlots: 15,
    upgradeSlots: 10,
    customerCapacity: 80,
    tags: ["software", "technology", "digital"],
  },
];

export const BUSINESS_UPGRADES: BusinessUpgrade[] = [
  {
    id: "better-equipment",
    name: "Better Equipment",
    description: "Upgrade the equipment used by your business.",
    category: "technology",
    cost: 500000,
    reputationGain: 3,
    revenueMultiplier: 1.08,
    levelRequired: 2,
    tags: ["equipment", "upgrade"],
  },
  {
    id: "premium-interior",
    name: "Premium Interior",
    description: "Improve the appearance and comfort of your business.",
    category: "creative",
    cost: 1200000,
    reputationGain: 8,
    revenueMultiplier: 1.15,
    levelRequired: 3,
    tags: ["interior", "premium"],
  },
  {
    id: "advertising-campaign",
    name: "Advertising Campaign",
    description: "Promote your business across Abuja.",
    category: "professional",
    cost: 750000,
    reputationGain: 10,
    revenueMultiplier: 1.2,
    levelRequired: 3,
    tags: ["marketing", "advertising"],
  },
  {
    id: "vip-service",
    name: "VIP Service",
    description: "Introduce premium services for wealthy customers.",
    category: "hospitality",
    cost: 2500000,
    reputationGain: 15,
    revenueMultiplier: 1.3,
    levelRequired: 6,
    tags: ["vip", "luxury"],
  },
  {
    id: "online-booking",
    name: "Online Booking",
    description: "Allow players to book your business services remotely.",
    category: "technology",
    cost: 1000000,
    reputationGain: 5,
    revenueMultiplier: 1.12,
    levelRequired: 4,
    tags: ["online", "booking"],
  },
  {
    id: "premium-branding",
    name: "Premium Branding",
    description: "Give your business a recognizable premium identity.",
    category: "fashion",
    cost: 1800000,
    reputationGain: 12,
    revenueMultiplier: 1.18,
    levelRequired: 5,
    tags: ["branding", "premium"],
  },
];

export function getBusinessById(
  businessId: string
): Business | undefined {
  return BUSINESSES.find((business) => business.id === businessId);
}

export function getBusinessesByCategory(
  category: BusinessCategory
): Business[] {
  return BUSINESSES.filter(
    (business) => business.category === category
  );
}

export function getBusinessesByTier(
  tier: BusinessTier
): Business[] {
  return BUSINESSES.filter(
    (business) => business.tier === tier
  );
}

export function getBusinessesByLocation(
  locationId: string
): Business[] {
  return BUSINESSES.filter(
    (business) => business.locationId === locationId
  );
}

export function searchBusinesses(
  query: string
): Business[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return BUSINESSES;
  }

  return BUSINESSES.filter((business) => {
    return (
      business.name.toLowerCase().includes(normalized) ||
      business.category.toLowerCase().includes(normalized) ||
      business.description.toLowerCase().includes(normalized) ||
      business.tags.some((tag) =>
        tag.toLowerCase().includes(normalized)
      )
    );
  });
}

export function canStartBusiness(
  business: Business,
  cash: number,
  reputation: number,
  level: number
): boolean {
  return (
    cash >= business.startupCost &&
    reputation >= business.reputationRequired &&
    level >= business.levelRequired
  );
}

export function calculateBusinessRevenue(
  business: Business,
  level: number,
  reputation: number,
  customerSatisfaction = 100
): number {
  const levelMultiplier = 1 + Math.max(0, level - 1) * 0.08;

  const reputationMultiplier =
    1 + Math.min(100, Math.max(0, reputation)) / 500;

  const satisfactionMultiplier =
    Math.max(50, Math.min(100, customerSatisfaction)) / 100;

  const revenue =
    business.baseDailyRevenue *
    levelMultiplier *
    reputationMultiplier *
    satisfactionMultiplier;

  return Math.min(
    Math.round(revenue),
    business.maximumDailyRevenue
  );
}

export function calculateBusinessProfit(
  business: Business,
  revenue: number
): number {
  return Math.max(
    0,
    Math.round(revenue - business.dailyOperatingCost)
  );
}

export function calculateBusinessUpgradeRevenue(
  baseRevenue: number,
  upgrades: BusinessUpgrade[]
): number {
  return Math.round(
    upgrades.reduce(
      (revenue, upgrade) =>
        revenue * upgrade.revenueMultiplier,
      baseRevenue
    )
  );
}

export function getBusinessUpgradeById(
  upgradeId: string
): BusinessUpgrade | undefined {
  return BUSINESS_UPGRADES.find(
    (upgrade) => upgrade.id === upgradeId
  );
}

export function getAvailableBusinessUpgrades(
  level: number
): BusinessUpgrade[] {
  return BUSINESS_UPGRADES.filter(
    (upgrade) => level >= upgrade.levelRequired
  );
}