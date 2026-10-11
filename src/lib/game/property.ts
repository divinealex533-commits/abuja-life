import {
  House,
  OwnedHouse,
  FurnitureItem,
  getHouseById,
  getFurnitureById,
  canBuyHouse,
  calculateHouseValue,
} from "@/lib/game/houses";

export interface PropertyPurchaseResult {
  success: boolean;
  message: string;
  ownedHouse: OwnedHouse | null;
  remainingCash: number;
}

export interface PropertyUpgradeResult {
  success: boolean;
  message: string;
  ownedHouse: OwnedHouse;
  cost: number;
}

export function purchaseHouse(
  houseId: string,
  cash: number,
  reputation: number
): PropertyPurchaseResult {
  const house = getHouseById(houseId);

  if (!house) {
    return {
      success: false,
      message: "Property not found.",
      ownedHouse: null,
      remainingCash: cash,
    };
  }

  const purchaseCheck = canBuyHouse(house, cash, reputation);

  if (!purchaseCheck) {
    return {
      success: false,
      message:  "You cannot purchase this house.",
      ownedHouse: null,
      remainingCash: cash,
    };
  }

  const now = new Date().toISOString();

  const ownedHouse: OwnedHouse = {
    houseId: house.id,
    purchasedAt: now,
    interiorStyle: house.availableStyles[0] ?? "basic",
    interiorLevel: 1,
    securityLevel: house.features.securityLevel,
    furnitureValue: 0,
    propertyValue: house.propertyValue,
    renovations: [],
    furniture: [],
    lastRentPaidAt: now,
  };

  return {
    success: true,
    message: `${house.name} is now yours!`,
    ownedHouse,
    remainingCash: cash - house.purchasePrice,
  };
}

export function addFurnitureToHouse(
  ownedHouse: OwnedHouse,
  furnitureId: string
): PropertyUpgradeResult {
  const furniture = getFurnitureById(furnitureId);

  if (!furniture) {
    return {
      success: false,
      message: "Furniture item not found.",
      ownedHouse,
      cost: 0,
    };
  }

  if (ownedHouse.furniture.includes(furniture.id)) {
    return {
      success: false,
      message: "You already own this furniture.",
      ownedHouse,
      cost: 0,
    };
  }

  const updatedFurniture = [
    ...ownedHouse.furniture,
    furniture.id,
  ];

  const updatedHouse: OwnedHouse = {
    ...ownedHouse,
    furniture: updatedFurniture,
    furnitureValue:
      ownedHouse.furnitureValue + furniture.price,
    propertyValue: calculateHouseValue(
  getHouseById(ownedHouse.houseId)!,
  updatedFurniture,
  ownedHouse.interiorLevel
),
  };

  return {
    success: true,
    message: `${furniture.name} added to your house.`,
    ownedHouse: updatedHouse,
    cost: furniture.price,
  };
}

export function upgradeHouseInterior(
  ownedHouse: OwnedHouse,
  house: House
): PropertyUpgradeResult {
  if (ownedHouse.interiorLevel >= house.maxInteriorLevel) {
    return {
      success: false,
      message: "Your interior is already fully upgraded.",
      ownedHouse,
      cost: 0,
    };
  }

  const nextLevel = ownedHouse.interiorLevel + 1;
  const cost = Math.round(
    house.purchasePrice * 0.025 * nextLevel
  );

  const updatedHouse: OwnedHouse = {
    ...ownedHouse,
    interiorLevel: nextLevel,
    propertyValue: calculateHouseValue(
  house,
  ownedHouse.furniture,
  nextLevel
)
  };

  return {
    success: true,
    message: `Interior upgraded to level ${nextLevel}.`,
    ownedHouse: updatedHouse,
    cost,
  };
}

export function upgradeHouseSecurity(
  ownedHouse: OwnedHouse,
  house: House
): PropertyUpgradeResult {
  const maxSecurity = 10;

  if (ownedHouse.securityLevel >= maxSecurity) {
    return {
      success: false,
      message: "Security is already at maximum level.",
      ownedHouse,
      cost: 0,
    };
  }

  const nextLevel = ownedHouse.securityLevel + 1;
  const cost = 250_000 * nextLevel;

  const updatedHouse: OwnedHouse = {
    ...ownedHouse,
    securityLevel: nextLevel,
    propertyValue: calculateHouseValue(
  house,
  ownedHouse.furniture,
ownedHouse.interiorLevel
),
  };

  return {
    success: true,
    message: `Security upgraded to level ${nextLevel}.`,
    ownedHouse: updatedHouse,
    cost,
  };
}