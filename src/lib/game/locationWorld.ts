// src/lib/game/locationWorld.ts

export type LocationWorldCategory =
  | "social"
  | "shopping"
  | "food"
  | "business"
  | "career"
  | "entertainment"
  | "fitness"
  | "transport"
  | "property"
  | "education"
  | "health"
  | "exploration"
  | "special";

export interface LocationWorldActivity {
  id: string;
  name: string;
  description: string;
  category: LocationWorldCategory;
  icon: string;
  energyCost: number;
  reward: number;
  reputationGain: number;
  experienceGain: number;
  durationMinutes: number;
  tags: string[];
}

export interface LocationWorldBusiness {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  playerOwned: boolean;
  openHour: number;
  closeHour: number;
  tags: string[];
}

export interface LocationWorld {
  id: string;
  name: string;
  neighborhood: string;
  description: string;
  icon: string;
  atmosphere: string;
  trafficLevel: "low" | "medium" | "high" | "very-high";
  safetyLevel: "low" | "medium" | "high";
  propertyAvailable: boolean;
  activities: LocationWorldActivity[];
  businesses: LocationWorldBusiness[];
  specialFeatures: string[];
  tags: string[];
}

const commonActivities = {
  socialize: {
    id: "socialize",
    name: "Socialize",
    description: "Meet other players and build your social reputation.",
    category: "social" as const,
    icon: "👥",
    energyCost: 3,
    reward: 100,
    reputationGain: 1,
    experienceGain: 5,
    durationMinutes: 15,
    tags: ["social", "players"],
  },

  explore: {
    id: "explore",
    name: "Explore Area",
    description: "Walk around and discover what is happening nearby.",
    category: "exploration" as const,
    icon: "🗺️",
    energyCost: 4,
    reward: 150,
    reputationGain: 1,
    experienceGain: 8,
    durationMinutes: 20,
    tags: ["exploration", "discovery"],
  },

  photograph: {
    id: "photograph",
    name: "Take Photos",
    description: "Capture interesting moments around Abuja.",
    category: "career" as const,
    icon: "📸",
    energyCost: 5,
    reward: 450,
    reputationGain: 2,
    experienceGain: 15,
    durationMinutes: 25,
    tags: ["photography", "creative"],
  },

  networking: {
    id: "networking",
    name: "Business Networking",
    description: "Meet entrepreneurs and potential business partners.",
    category: "business" as const,
    icon: "🤝",
    energyCost: 4,
    reward: 300,
    reputationGain: 3,
    experienceGain: 15,
    durationMinutes: 20,
    tags: ["business", "networking"],
  },
};

export const LOCATION_WORLDS: LocationWorld[] = [
  {
    id: "garki",
    name: "Garki",
    neighborhood: "Garki",
    description:
      "A busy central district filled with offices, markets, restaurants and everyday city life.",
    icon: "🏙️",
    atmosphere: "Busy and commercial",
    trafficLevel: "high",
    safetyLevel: "high",
    propertyAvailable: true,

    activities: [
      commonActivities.socialize,
      commonActivities.explore,
      commonActivities.photograph,
      commonActivities.networking,
      {
        id: "visit-garki-market",
        name: "Visit Garki Market",
        description: "Explore stalls, vendors and player-owned shops.",
        category: "shopping",
        icon: "🛍️",
        energyCost: 4,
        reward: 200,
        reputationGain: 1,
        experienceGain: 10,
        durationMinutes: 20,
        tags: ["market", "shopping"],
      },
    ],

    businesses: [
      {
        id: "garki-food-street",
        name: "Garki Food Street",
        type: "food",
        description: "A busy collection of food vendors and restaurants.",
        icon: "🍔",
        playerOwned: false,
        openHour: 8,
        closeHour: 23,
        tags: ["food", "restaurants"],
      },
      {
        id: "garki-business-hub",
        name: "Garki Business Hub",
        type: "business",
        description: "Offices and professional services.",
        icon: "🏢",
        playerOwned: false,
        openHour: 8,
        closeHour: 18,
        tags: ["office", "business"],
      },
    ],

    specialFeatures: [
      "Garki Market",
      "Business District",
      "Food Street",
      "Taxi Stands",
    ],

    tags: ["central", "business", "market"],
  },

  {
    id: "wuse",
    name: "Wuse",
    neighborhood: "Wuse",
    description:
      "One of Abuja's busiest commercial districts with markets, shops, restaurants and entertainment.",
    icon: "🏪",
    atmosphere: "Very busy",
    trafficLevel: "very-high",
    safetyLevel: "high",
    propertyAvailable: true,

    activities: [
      commonActivities.socialize,
      commonActivities.explore,
      commonActivities.photograph,
      commonActivities.networking,
      {
        id: "shop-wuse-market",
        name: "Shop at Wuse Market",
        description: "Browse shops and hunt for useful items.",
        category: "shopping",
        icon: "🛒",
        energyCost: 5,
        reward: 250,
        reputationGain: 1,
        experienceGain: 12,
        durationMinutes: 30,
        tags: ["shopping", "market"],
      },
      {
        id: "business-deal-wuse",
        name: "Negotiate Business Deal",
        description: "Try to secure a profitable business opportunity.",
        category: "business",
        icon: "💼",
        energyCost: 6,
        reward: 900,
        reputationGain: 4,
        experienceGain: 25,
        durationMinutes: 35,
        tags: ["business", "deal"],
      },
    ],

    businesses: [
      {
        id: "wuse-market",
        name: "Wuse Market",
        type: "market",
        description: "A massive commercial marketplace.",
        icon: "🛍️",
        playerOwned: false,
        openHour: 7,
        closeHour: 20,
        tags: ["market", "shopping"],
      },
      {
        id: "wuse-nightlife",
        name: "Wuse Nightlife District",
        type: "entertainment",
        description: "Restaurants, lounges and nightlife venues.",
        icon: "🌃",
        playerOwned: false,
        openHour: 17,
        closeHour: 3,
        tags: ["nightlife", "entertainment"],
      },
    ],

    specialFeatures: [
      "Wuse Market",
      "Business Fair",
      "Nightlife",
      "Shopping District",
    ],

    tags: ["commercial", "market", "nightlife"],
  },

  {
    id: "wuse-2",
    name: "Wuse 2",
    neighborhood: "Wuse 2",
    description:
      "A stylish urban district filled with restaurants, lounges, fashion businesses and premium entertainment.",
    icon: "🌆",
    atmosphere: "Stylish and energetic",
    trafficLevel: "high",
    safetyLevel: "high",
    propertyAvailable: true,

    activities: [
      commonActivities.socialize,
      commonActivities.photograph,
      commonActivities.networking,
      {
        id: "fashion-shopping-wuse-2",
        name: "Fashion Shopping",
        description: "Browse premium fashion stores.",
        category: "shopping",
        icon: "👗",
        energyCost: 4,
        reward: 200,
        reputationGain: 2,
        experienceGain: 12,
        durationMinutes: 25,
        tags: ["fashion", "shopping"],
      },
      {
        id: "wuse-2-nightlife",
        name: "Nightlife",
        description: "Visit lounges and meet other players.",
        category: "entertainment",
        icon: "🎵",
        energyCost: 5,
        reward: 350,
        reputationGain: 3,
        experienceGain: 18,
        durationMinutes: 30,
        tags: ["nightlife", "social"],
      },
    ],

    businesses: [
      {
        id: "wuse-2-fashion",
        name: "Style Avenue",
        type: "fashion",
        description: "Premium fashion and styling businesses.",
        icon: "👔",
        playerOwned: false,
        openHour: 9,
        closeHour: 22,
        tags: ["fashion", "style"],
      },
      {
        id: "wuse-2-lounge",
        name: "Capital Lounge District",
        type: "entertainment",
        description: "Premium lounges and nightlife.",
        icon: "🍸",
        playerOwned: false,
        openHour: 17,
        closeHour: 3,
        tags: ["lounge", "nightlife"],
      },
    ],

    specialFeatures: [
      "Fashion District",
      "Premium Restaurants",
      "Nightlife",
      "Social Events",
    ],

    tags: ["premium", "fashion", "nightlife"],
  },

  {
    id: "jabi",
    name: "Jabi",
    neighborhood: "Jabi",
    description:
      "A lively lakeside district where players can relax, socialize, shop and enjoy outdoor activities.",
    icon: "🌊",
    atmosphere: "Relaxed and social",
    trafficLevel: "medium",
    safetyLevel: "high",
    propertyAvailable: true,

    activities: [
      commonActivities.socialize,
      commonActivities.explore,
      commonActivities.photograph,
      {
        id: "jabi-lake",
        name: "Visit Jabi Lake",
        description: "Enjoy the lake and meet players around the waterfront.",
        category: "entertainment",
        icon: "🌊",
        energyCost: 5,
        reward: 250,
        reputationGain: 2,
        experienceGain: 15,
        durationMinutes: 30,
        tags: ["lake", "social", "outdoors"],
      },
      {
        id: "jabi-car-meet",
        name: "Attend Car Meet",
        description: "Show off vehicles and meet other car enthusiasts.",
        category: "entertainment",
        icon: "🏎️",
        energyCost: 4,
        reward: 300,
        reputationGain: 3,
        experienceGain: 20,
        durationMinutes: 30,
        tags: ["cars", "social", "event"],
      },
    ],

    businesses: [
      {
        id: "jabi-lake-front",
        name: "Jabi Lake Front",
        type: "entertainment",
        description: "Outdoor entertainment and social activities.",
        icon: "🌴",
        playerOwned: false,
        openHour: 7,
        closeHour: 23,
        tags: ["lake", "outdoor"],
      },
      {
        id: "jabi-performance-garage",
        name: "Performance Garage District",
        type: "automotive",
        description: "Vehicle tuning and performance businesses.",
        icon: "🔧",
        playerOwned: false,
        openHour: 8,
        closeHour: 21,
        tags: ["cars", "tuning"],
      },
    ],

    specialFeatures: [
      "Jabi Lake",
      "Car Meets",
      "Waterfront Events",
      "Performance Garages",
    ],

    tags: ["lake", "social", "cars"],
  },

  {
    id: "maitama",
    name: "Maitama",
    neighborhood: "Maitama",
    description:
      "An exclusive district known for luxury homes, embassies, premium businesses and high-status players.",
    icon: "🏛️",
    atmosphere: "Exclusive and luxurious",
    trafficLevel: "medium",
    safetyLevel: "high",
    propertyAvailable: true,

    activities: [
      commonActivities.socialize,
      commonActivities.photograph,
      commonActivities.networking,
      {
        id: "maitama-networking",
        name: "Elite Networking",
        description: "Meet wealthy players and high-level entrepreneurs.",
        category: "business",
        icon: "🤝",
        energyCost: 5,
        reward: 1200,
        reputationGain: 6,
        experienceGain: 35,
        durationMinutes: 40,
        tags: ["elite", "business", "networking"],
      },
      {
        id: "luxury-shopping",
        name: "Luxury Shopping",
        description: "Visit premium stores and luxury businesses.",
        category: "shopping",
        icon: "💎",
        energyCost: 5,
        reward: 500,
        reputationGain: 4,
        experienceGain: 25,
        durationMinutes: 35,
        tags: ["luxury", "shopping"],
      },
    ],

    businesses: [
      {
        id: "maitama-luxury-motors",
        name: "Capital Luxury Motors",
        type: "automotive",
        description: "Luxury vehicle showroom.",
        icon: "🚘",
        playerOwned: false,
        openHour: 9,
        closeHour: 19,
        tags: ["luxury", "cars"],
      },
      {
        id: "maitama-business-club",
        name: "Maitama Business Club",
        type: "business",
        description: "Exclusive networking venue.",
        icon: "🥂",
        playerOwned: false,
        openHour: 10,
        closeHour: 23,
        tags: ["business", "elite"],
      },
    ],

    specialFeatures: [
      "Luxury District",
      "Premium Properties",
      "Elite Networking",
      "Luxury Motors",
    ],

    tags: ["luxury", "elite", "property"],
  },

  {
    id: "gwarinpa",
    name: "Gwarinpa",
    neighborhood: "Gwarinpa",
    description:
      "A large residential district with families, apartments, shops, restaurants and community life.",
    icon: "🏘️",
    atmosphere: "Residential and lively",
    trafficLevel: "high",
    safetyLevel: "high",
    propertyAvailable: true,

    activities: [
      commonActivities.socialize,
      commonActivities.explore,
      commonActivities.photograph,
      {
        id: "community-market",
        name: "Community Market",
        description: "Shop and interact with local businesses.",
        category: "shopping",
        icon: "🛒",
        energyCost: 4,
        reward: 200,
        reputationGain: 2,
        experienceGain: 10,
        durationMinutes: 20,
        tags: ["market", "community"],
      },
      {
        id: "community-sports",
        name: "Play Community Sports",
        description: "Join other players for casual sports.",
        category: "fitness",
        icon: "⚽",
        energyCost: 8,
        reward: 300,
        reputationGain: 3,
        experienceGain: 20,
        durationMinutes: 35,
        tags: ["sports", "fitness", "social"],
      },
    ],

    businesses: [
      {
        id: "gwarinpa-family-market",
        name: "Gwarinpa Community Market",
        type: "market",
        description: "Everyday shopping and local businesses.",
        icon: "🏪",
        playerOwned: false,
        openHour: 7,
        closeHour: 22,
        tags: ["market", "community"],
      },
      {
        id: "gwarinpa-sports-center",
        name: "Gwarinpa Sports Center",
        type: "fitness",
        description: "Sports and fitness activities.",
        icon: "🏋️",
        playerOwned: false,
        openHour: 6,
        closeHour: 22,
        tags: ["fitness", "sports"],
      },
    ],

    specialFeatures: [
      "Residential Areas",
      "Community Sports",
      "Local Markets",
      "Family Activities",
    ],

    tags: ["residential", "community", "family"],
  },

  {
    id: "cbd",
    name: "Central Business District",
    neighborhood: "CBD",
    description:
      "The heart of Abuja's corporate world with offices, government buildings, hotels and major business opportunities.",
    icon: "🏢",
    atmosphere: "Corporate and fast-paced",
    trafficLevel: "very-high",
    safetyLevel: "high",
    propertyAvailable: false,

    activities: [
      commonActivities.networking,
      commonActivities.photograph,
      commonActivities.explore,
      {
        id: "corporate-meeting",
        name: "Corporate Meeting",
        description: "Attend a professional meeting and pursue business opportunities.",
        category: "business",
        icon: "📊",
        energyCost: 6,
        reward: 1500,
        reputationGain: 7,
        experienceGain: 40,
        durationMinutes: 45,
        tags: ["corporate", "business"],
      },
      {
        id: "job-interview",
        name: "Attend Job Interview",
        description: "Look for higher-paying career opportunities.",
        category: "career",
        icon: "💼",
        energyCost: 5,
        reward: 800,
        reputationGain: 5,
        experienceGain: 30,
        durationMinutes: 30,
        tags: ["career", "job"],
      },
    ],

    businesses: [
      {
        id: "cbd-corporate-towers",
        name: "Capital Corporate Towers",
        type: "corporate",
        description: "Major offices and professional businesses.",
        icon: "🏢",
        playerOwned: false,
        openHour: 7,
        closeHour: 20,
        tags: ["corporate", "office"],
      },
      {
        id: "cbd-five-star-hotel",
        name: "Capital Grand Hotel",
        type: "hotel",
        description: "Luxury accommodation and events.",
        icon: "🏨",
        playerOwned: false,
        openHour: 0,
        closeHour: 24,
        tags: ["hotel", "luxury"],
      },
    ],

    specialFeatures: [
      "Corporate Towers",
      "Government District",
      "Luxury Hotels",
      "Business Opportunities",
    ],

    tags: ["corporate", "business", "government"],
  },

  {
    id: "asokoro",
    name: "Asokoro",
    neighborhood: "Asokoro",
    description:
      "An upscale residential and diplomatic area with premium homes and exclusive social spaces.",
    icon: "🏡",
    atmosphere: "Quiet and prestigious",
    trafficLevel: "low",
    safetyLevel: "high",
    propertyAvailable: true,

    activities: [
      commonActivities.socialize,
      commonActivities.photograph,
      commonActivities.networking,
      {
        id: "asokoro-private-event",
        name: "Attend Private Event",
        description: "Attend an exclusive invitation-only event.",
        category: "entertainment",
        icon: "🎟️",
        energyCost: 5,
        reward: 1000,
        reputationGain: 6,
        experienceGain: 35,
        durationMinutes: 45,
        tags: ["exclusive", "event"],
      },
    ],

    businesses: [
      {
        id: "asokoro-estate",
        name: "Asokoro Estate District",
        type: "property",
        description: "Premium residential properties.",
        icon: "🏰",
        playerOwned: false,
        openHour: 0,
        closeHour: 24,
        tags: ["property", "luxury"],
      },
      {
        id: "asokoro-private-club",
        name: "Asokoro Private Club",
        type: "entertainment",
        description: "Exclusive social venue.",
        icon: "🥂",
        playerOwned: false,
        openHour: 12,
        closeHour: 2,
        tags: ["exclusive", "social"],
      },
    ],

    specialFeatures: [
      "Luxury Estates",
      "Private Events",
      "Exclusive Clubs",
      "Premium Property",
    ],

    tags: ["luxury", "residential", "exclusive"],
  },

  {
    id: "kado",
    name: "Kado",
    neighborhood: "Kado",
    description:
      "A growing district with major automotive businesses, residential areas and new development.",
    icon: "🚘",
    atmosphere: "Growing and modern",
    trafficLevel: "medium",
    safetyLevel: "high",
    propertyAvailable: true,

    activities: [
      commonActivities.explore,
      commonActivities.photograph,
      commonActivities.socialize,
      {
        id: "car-shopping",
        name: "Browse Car Showrooms",
        description: "Inspect premium vehicles and dealerships.",
        category: "shopping",
        icon: "🚗",
        energyCost: 3,
        reward: 250,
        reputationGain: 2,
        experienceGain: 15,
        durationMinutes: 25,
        tags: ["cars", "shopping"],
      },
      {
        id: "test-drive-area",
        name: "Test Drive",
        description: "Take an available vehicle for a drive.",
        category: "transport",
        icon: "🏎️",
        energyCost: 6,
        reward: 350,
        reputationGain: 2,
        experienceGain: 20,
        durationMinutes: 30,
        tags: ["cars", "driving"],
      },
    ],

    businesses: [
      {
        id: "kado-auto-gallery",
        name: "Abuja Auto Gallery",
        type: "automotive",
        description: "Premium and exotic vehicle showroom.",
        icon: "🏎️",
        playerOwned: false,
        openHour: 9,
        closeHour: 19,
        tags: ["cars", "luxury", "supercars"],
      },
      {
        id: "kado-development",
        name: "Kado Development Zone",
        type: "property",
        description: "New property and construction opportunities.",
        icon: "🏗️",
        playerOwned: false,
        openHour: 8,
        closeHour: 18,
        tags: ["construction", "property"],
      },
    ],

    specialFeatures: [
      "Exotic Car Showrooms",
      "Test Drives",
      "New Developments",
      "Property Opportunities",
    ],

    tags: ["cars", "property", "development"],
  },
];

export function getLocationWorld(
  locationId: string
): LocationWorld | undefined {
  return LOCATION_WORLDS.find(
    (location) => location.id === locationId
  );
}

export function getLocationActivities(
  locationId: string
): LocationWorldActivity[] {
  return getLocationWorld(locationId)?.activities ?? [];
}

export function getLocationBusinesses(
  locationId: string
): LocationWorldBusiness[] {
  return getLocationWorld(locationId)?.businesses ?? [];
}

export function getActivitiesByCategory(
  locationId: string,
  category: LocationWorldCategory
): LocationWorldActivity[] {
  return getLocationActivities(locationId).filter(
    (activity) => activity.category === category
  );
}

export function searchLocationActivities(
  locationId: string,
  searchTerm: string
): LocationWorldActivity[] {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return getLocationActivities(locationId);
  }

  return getLocationActivities(locationId).filter((activity) => {
    const searchable = [
      activity.name,
      activity.description,
      activity.category,
      ...activity.tags,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });
}

export function isBusinessOpen(
  business: LocationWorldBusiness,
  hour: number
): boolean {
  if (business.openHour === business.closeHour) {
    return true;
  }

  if (business.closeHour > business.openHour) {
    return hour >= business.openHour && hour < business.closeHour;
  }

  return hour >= business.openHour || hour < business.closeHour;
}

export function getOpenBusinesses(
  locationId: string,
  hour: number
): LocationWorldBusiness[] {
  return getLocationBusinesses(locationId).filter((business) =>
    isBusinessOpen(business, hour)
  );
}

export function getLocationsByTag(
  tag: string
): LocationWorld[] {
  const normalizedTag = tag.trim().toLowerCase();

  return LOCATION_WORLDS.filter((location) =>
    location.tags.some(
      (locationTag) =>
        locationTag.toLowerCase() === normalizedTag
    )
  );
}

export function getPropertyLocations(): LocationWorld[] {
  return LOCATION_WORLDS.filter(
    (location) => location.propertyAvailable
  );
}

export function getHighTrafficLocations(): LocationWorld[] {
  return LOCATION_WORLDS.filter(
    (location) =>
      location.trafficLevel === "high" ||
      location.trafficLevel === "very-high"
  );
}

export function getSafeLocations(): LocationWorld[] {
  return LOCATION_WORLDS.filter(
    (location) => location.safetyLevel === "high"
  );
}