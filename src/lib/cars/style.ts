// Abuja Life — how each car is drawn: body shape and paint colours.

import type { Vehicle } from "@/lib/game/vehicles";

export type CarBody = "sedan" | "suv" | "sports" | "super" | "luxury";

export function bodyFor(vehicle: Pick<Vehicle, "class" | "name" | "tags">): CarBody {
  const name = vehicle.name.toLowerCase();
  const tags = vehicle.tags.map((t) => t.toLowerCase());
  if (vehicle.class === "suv" || tags.includes("suv") || /cullinan|bentayga|range rover|gle|g-wagon|prado|land cruiser/.test(name)) {
    return "suv";
  }
  if (vehicle.class === "supercar" || vehicle.class === "hypercar") return "super";
  if (vehicle.class === "sports" || vehicle.class === "performance") return "sports";
  if (vehicle.class === "luxury") return "luxury";
  return "sedan";
}

export const PAINTS = [
  { id: "black", label: "Midnight Black", hex: "#111827" },
  { id: "white", label: "Pearl White", hex: "#f1f5f9" },
  { id: "silver", label: "Lunar Silver", hex: "#9ca3af" },
  { id: "red", label: "Racing Red", hex: "#dc2626" },
  { id: "blue", label: "Abuja Blue", hex: "#1d4ed8" },
  { id: "green", label: "Naija Green", hex: "#047857" },
  { id: "gold", label: "Champagne Gold", hex: "#b8902f" },
  { id: "orange", label: "Lava Orange", hex: "#ea580c" },
  { id: "purple", label: "Royal Purple", hex: "#6d28d9" },
] as const;

export function paintHex(id: string | null | undefined): string {
  return PAINTS.find((p) => p.id === id)?.hex ?? PAINTS[0].hex;
}

/** Default paint for a car: luxury cars come in black, sports cars in red. */
export function defaultPaint(body: CarBody): string {
  if (body === "super") return "orange";
  if (body === "sports") return "red";
  if (body === "luxury" || body === "suv") return "black";
  return "silver";
}

/** Saved in the garage as an upgrade tag, e.g. "paint:red". */
export function paintFromUpgrades(upgrades: string[] | undefined): string | null {
  const tag = upgrades?.find((u) => u.startsWith("paint:"));
  return tag ? tag.slice(6) : null;
}
