// Abuja Life — walkable city layout. Rough real-life positions of each
// place, scaled into a 2400×2400 world. Gameplay map, not a survey.

export const WORLD_SIZE = 2400;

export interface CitySpot {
  locationId: string;
  /** Centre of the building/plot. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Building colour (roof). */
  color: string;
  /** Visual style of the plot. */
  kind: "tower" | "market" | "houses" | "park" | "lake" | "stadium" | "airport" | "campus" | "street" | "station" | "mosque";
}

export const CITY_SPOTS: CitySpot[] = [
  { locationId: "cbd", x: 1250, y: 1150, w: 260, h: 200, color: "#64748b", kind: "mosque" },
  { locationId: "garki", x: 1250, y: 1520, w: 240, h: 180, color: "#0ea5e9", kind: "tower" },
  { locationId: "taxi-stand", x: 1560, y: 1600, w: 150, h: 110, color: "#facc15", kind: "station" },
  { locationId: "wuse", x: 880, y: 1050, w: 220, h: 170, color: "#f97316", kind: "tower" },
  { locationId: "wuse-market", x: 760, y: 1320, w: 200, h: 150, color: "#ef4444", kind: "market" },
  { locationId: "wuse-2", x: 1000, y: 760, w: 220, h: 170, color: "#a855f7", kind: "tower" },
  { locationId: "food-street", x: 1300, y: 820, w: 180, h: 120, color: "#f59e0b", kind: "street" },
  { locationId: "maitama", x: 1550, y: 560, w: 260, h: 200, color: "#22c55e", kind: "houses" },
  { locationId: "millennium-park", x: 1720, y: 1000, w: 260, h: 220, color: "#16a34a", kind: "park" },
  { locationId: "jabi", x: 520, y: 820, w: 220, h: 170, color: "#ec4899", kind: "tower" },
  { locationId: "jabi-lake", x: 300, y: 1100, w: 300, h: 240, color: "#0284c7", kind: "lake" },
  { locationId: "gwarinpa", x: 380, y: 360, w: 300, h: 220, color: "#84cc16", kind: "houses" },
  { locationId: "stadium", x: 560, y: 1700, w: 260, h: 210, color: "#10b981", kind: "stadium" },
  { locationId: "university", x: 900, y: 2050, w: 260, h: 190, color: "#6366f1", kind: "campus" },
  { locationId: "airport", x: 1900, y: 2050, w: 380, h: 240, color: "#94a3b8", kind: "airport" },
];

/** Main roads as [x1, y1, x2, y2]; drawn 56px wide. */
export const ROADS: [number, number, number, number][] = [
  // ring
  [200, 600, 2200, 600],
  [200, 1400, 2200, 1400],
  [200, 1880, 2200, 1880],
  [700, 200, 700, 2300],
  [1450, 200, 1450, 2300],
  [2050, 600, 2050, 2300],
  // spokes
  [700, 1000, 1450, 1000],
  [1100, 600, 1100, 1400],
  [1450, 1700, 2050, 1700],
];

export function spotFor(locationId: string): CitySpot | undefined {
  return CITY_SPOTS.find((s) => s.locationId === locationId);
}

/** Point just outside a building's front door (bottom middle). */
export function doorOf(spot: CitySpot): { x: number; y: number } {
  return { x: spot.x, y: spot.y + spot.h / 2 + 34 };
}

export const ENTER_DISTANCE = 90;
