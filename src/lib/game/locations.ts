// Abuja Life — World Locations
// Core locations used by the game world.
// Distances are gameplay distances, not intended as exact real-world routing.

export interface GameLocation {
  id: string;
  name: string;
  neighborhood: string;
  description: string;
  icon: string;
  type:
    | "residential"
    | "shopping"
    | "business"
    | "entertainment"
    | "food"
    | "transport"
    | "education"
    | "health"
    | "government"
    | "nature"
    | "nightlife";
  unlockLevel: number;
}

export interface LocationConnection {
  from: string;
  to: string;
  distanceKm: number;
}

export const ABUJA_LOCATIONS: GameLocation[] = [
  {
    id: "garki",
    name: "Garki",
    neighborhood: "Garki",
    description:
      "A busy part of Abuja filled with homes, shops, offices and everyday city life.",
    icon: "🏙️",
    type: "business",
    unlockLevel: 1,
  },
  {
    id: "wuse",
    name: "Wuse",
    neighborhood: "Wuse",
    description:
      "A major commercial district packed with markets, businesses and restaurants.",
    icon: "🛍️",
    type: "shopping",
    unlockLevel: 1,
  },
  {
    id: "wuse-2",
    name: "Wuse 2",
    neighborhood: "Wuse 2",
    description:
      "A lively district known for restaurants, entertainment and nightlife.",
    icon: "🌃",
    type: "nightlife",
    unlockLevel: 1,
  },
  {
    id: "maitama",
    name: "Maitama",
    neighborhood: "Maitama",
    description:
      "An upscale district with luxury homes, businesses and high-profile activity.",
    icon: "🏡",
    type: "residential",
    unlockLevel: 1,
  },
  {
    id: "jabi",
    name: "Jabi",
    neighborhood: "Jabi",
    description:
      "A popular area with shopping, restaurants, entertainment and the lake.",
    icon: "🌊",
    type: "entertainment",
    unlockLevel: 1,
  },
  {
    id: "jabi-lake",
    name: "Jabi Lake",
    neighborhood: "Jabi",
    description:
      "A major social spot where players can relax, meet people and attend events.",
    icon: "🏞️",
    type: "nature",
    unlockLevel: 1,
  },
  {
    id: "gwarinpa",
    name: "Gwarinpa",
    neighborhood: "Gwarinpa",
    description:
      "A large residential district with homes, shops and everyday activities.",
    icon: "🏘️",
    type: "residential",
    unlockLevel: 1,
  },
  {
    id: "cbd",
    name: "Central Business District",
    neighborhood: "CBD",
    description:
      "The heart of Abuja's business and government activity.",
    icon: "🏢",
    type: "government",
    unlockLevel: 1,
  },
  {
    id: "millennium-park",
    name: "Millennium Park",
    neighborhood: "Central Abuja",
    description:
      "A beautiful public park and a major location for city events.",
    icon: "🌳",
    type: "nature",
    unlockLevel: 1,
  },
  {
    id: "stadium",
    name: "Abuja Stadium",
    neighborhood: "Central Abuja",
    description:
      "A major sports venue for matches, competitions and special events.",
    icon: "🏟️",
    type: "entertainment",
    unlockLevel: 1,
  },
  {
    id: "airport",
    name: "Nnamdi Azikiwe Airport",
    neighborhood: "Airport District",
    description:
      "Abuja's main airport and a busy transport hub.",
    icon: "✈️",
    type: "transport",
    unlockLevel: 1,
  },
  {
    id: "university",
    name: "Abuja University",
    neighborhood: "Gwagwalada",
    description:
      "A university area where education, student life and special events happen.",
    icon: "🎓",
    type: "education",
    unlockLevel: 1,
  },
  {
    id: "wuse-market",
    name: "Wuse Market",
    neighborhood: "Wuse",
    description:
      "A huge marketplace where players can shop, work and run businesses.",
    icon: "🛒",
    type: "shopping",
    unlockLevel: 1,
  },
  {
    id: "food-street",
    name: "Food Street",
    neighborhood: "Wuse 2",
    description:
      "A busy food district filled with vendors, restaurants and social activity.",
    icon: "🍽️",
    type: "food",
    unlockLevel: 1,
  },
  {
    id: "taxi-stand",
    name: "City Taxi Stand",
    neighborhood: "Garki",
    description:
      "A transport hub where taxi drivers pick up passengers.",
    icon: "🚕",
    type: "transport",
    unlockLevel: 1,
  },
];

export const LOCATION_CONNECTIONS: LocationConnection[] = [
  {
    from: "garki",
    to: "cbd",
    distanceKm: 3,
  },
  {
    from: "garki",
    to: "wuse",
    distanceKm: 5,
  },
  {
    from: "garki",
    to: "millennium-park",
    distanceKm: 4,
  },
  {
    from: "garki",
    to: "stadium",
    distanceKm: 5,
  },
  {
    from: "wuse",
    to: "wuse-2",
    distanceKm: 2,
  },
  {
    from: "wuse",
    to: "wuse-market",
    distanceKm: 1,
  },
  {
    from: "wuse-2",
    to: "food-street",
    distanceKm: 1,
  },
  {
    from: "wuse-2",
    to: "jabi",
    distanceKm: 5,
  },
  {
    from: "jabi",
    to: "jabi-lake",
    distanceKm: 2,
  },
  {
    from: "jabi",
    to: "gwarinpa",
    distanceKm: 6,
  },
  {
    from: "maitama",
    to: "wuse",
    distanceKm: 4,
  },
  {
    from: "maitama",
    to: "cbd",
    distanceKm: 4,
  },
  {
    from: "maitama",
    to: "millennium-park",
    distanceKm: 3,
  },
  {
    from: "cbd",
    to: "millennium-park",
    distanceKm: 2,
  },
  {
    from: "cbd",
    to: "stadium",
    distanceKm: 4,
  },
  {
    from: "gwarinpa",
    to: "jabi",
    distanceKm: 6,
  },
  {
    from: "airport",
    to: "garki",
    distanceKm: 8,
  },
  {
    from: "university",
    to: "airport",
    distanceKm: 20,
  },
];

export function getLocationById(
  locationId: string
): GameLocation | undefined {
  return ABUJA_LOCATIONS.find(
    (location) => location.id === locationId
  );
}

export function getLocationsByType(
  type: GameLocation["type"]
): GameLocation[] {
  return ABUJA_LOCATIONS.filter(
    (location) => location.type === type
  );
}

export function getConnectionsFrom(
  locationId: string
): LocationConnection[] {
  return LOCATION_CONNECTIONS.filter(
    (connection) => connection.from === locationId
  );
}

export function getConnection(
  from: string,
  to: string
): LocationConnection | undefined {
  return LOCATION_CONNECTIONS.find(
    (connection) =>
      (connection.from === from &&
        connection.to === to) ||
      (connection.from === to &&
        connection.to === from)
  );
}