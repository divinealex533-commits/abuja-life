// src/lib/game/inventory.ts

export type InventoryCategory =
  | "clothing"
  | "food"
  | "electronics"
  | "tools"
  | "vehicle"
  | "property"
  | "business"
  | "event"
  | "collectible"
  | "special";

export type InventoryRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: InventoryCategory;
  rarity: InventoryRarity;
  icon: string;
  value: number;
  stackable: boolean;
  maxStack?: number;
  usable?: boolean;
  tags: string[];
}

export interface OwnedInventoryItem {
  itemId: string;
  quantity: number;
  acquiredAt: string;
  condition: number;
}

export const INVENTORY_STORAGE_KEY =
  "abujaLifeInventory";

export const INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "basic-tshirt",
    name: "Basic T-Shirt",
    description: "A simple everyday Abuja Life T-shirt.",
    category: "clothing",
    rarity: "common",
    icon: "👕",
    value: 5000,
    stackable: false,
    tags: ["clothing", "casual"],
  },

  {
    id: "designer-outfit",
    name: "Designer Outfit",
    description: "A stylish outfit for premium social events.",
    category: "clothing",
    rarity: "rare",
    icon: "🧥",
    value: 85000,
    stackable: false,
    tags: ["clothing", "fashion", "premium"],
  },

  {
    id: "bottled-water",
    name: "Bottled Water",
    description: "Restores a small amount of energy.",
    category: "food",
    rarity: "common",
    icon: "💧",
    value: 500,
    stackable: true,
    maxStack: 20,
    usable: true,
    tags: ["food", "energy"],
  },

  {
    id: "jollof-rice",
    name: "Jollof Rice",
    description: "A proper Abuja meal that restores energy.",
    category: "food",
    rarity: "common",
    icon: "🍛",
    value: 2500,
    stackable: true,
    maxStack: 10,
    usable: true,
    tags: ["food", "energy", "abuja"],
  },

  {
    id: "smartphone",
    name: "Smartphone",
    description: "A modern phone used for communication and city activities.",
    category: "electronics",
    rarity: "uncommon",
    icon: "📱",
    value: 180000,
    stackable: false,
    tags: ["electronics", "phone", "social"],
  },

  {
    id: "professional-camera",
    name: "Professional Camera",
    description: "A professional camera useful for photography work.",
    category: "tools",
    rarity: "rare",
    icon: "📷",
    value: 750000,
    stackable: false,
    tags: ["camera", "photography", "job"],
  },

  {
    id: "toolkit",
    name: "Professional Toolkit",
    description: "A useful collection of tools for technical jobs.",
    category: "tools",
    rarity: "uncommon",
    icon: "🧰",
    value: 85000,
    stackable: false,
    tags: ["tools", "work"],
  },

  {
    id: "business-license",
    name: "Business License",
    description: "Proof that a player has registered a business.",
    category: "business",
    rarity: "rare",
    icon: "📜",
    value: 25000,
    stackable: false,
    tags: ["business", "license"],
  },

  {
    id: "house-key",
    name: "House Key",
    description: "A key connected to a player property.",
    category: "property",
    rarity: "uncommon",
    icon: "🔑",
    value: 1000,
    stackable: false,
    tags: ["property", "house"],
  },

  {
    id: "event-pass",
    name: "VIP Event Pass",
    description: "Access to a special Abuja Life event.",
    category: "event",
    rarity: "epic",
    icon: "🎟️",
    value: 50000,
    stackable: true,
    maxStack: 5,
    tags: ["event", "vip"],
  },

  {
    id: "abuja-treasure",
    name: "Abuja Treasure",
    description: "A mysterious collectible discovered during a city treasure hunt.",
    category: "collectible",
    rarity: "legendary",
    icon: "💎",
    value: 500000,
    stackable: false,
    tags: ["treasure", "event", "collectible"],
  },

  {
    id: "city-challenge-trophy",
    name: "City Challenge Trophy",
    description: "Proof that the player conquered an Abuja City Challenge.",
    category: "collectible",
    rarity: "epic",
    icon: "🏆",
    value: 150000,
    stackable: false,
    tags: ["achievement", "event", "trophy"],
  },
];

export function getInventoryItem(
  itemId: string
): InventoryItem | undefined {
  return INVENTORY_ITEMS.find(
    (item) => item.id === itemId
  );
}

export function getInventoryItemsByCategory(
  category: InventoryCategory
): InventoryItem[] {
  return INVENTORY_ITEMS.filter(
    (item) => item.category === category
  );
}

export function searchInventoryItems(
  query: string
): InventoryItem[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return INVENTORY_ITEMS;
  }

  return INVENTORY_ITEMS.filter((item) => {
    return (
      item.name.toLowerCase().includes(normalized) ||
      item.description
        .toLowerCase()
        .includes(normalized) ||
      item.tags.some((tag) =>
        tag.toLowerCase().includes(normalized)
      )
    );
  });
}

export function loadInventory(): OwnedInventoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(
      INVENTORY_STORAGE_KEY
    );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => {
      return (
        item &&
        typeof item.itemId === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0
      );
    });
  } catch {
    return [];
  }
}

export function saveInventory(
  inventory: OwnedInventoryItem[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    INVENTORY_STORAGE_KEY,
    JSON.stringify(inventory)
  );

  window.dispatchEvent(
    new Event("abujaLifeInventoryUpdated")
  );
}

export function getOwnedItem(
  itemId: string
): OwnedInventoryItem | undefined {
  return loadInventory().find(
    (item) => item.itemId === itemId
  );
}

export function getItemQuantity(
  itemId: string
): number {
  return getOwnedItem(itemId)?.quantity ?? 0;
}

export function hasItem(
  itemId: string,
  quantity = 1
): boolean {
  return getItemQuantity(itemId) >= quantity;
}

export function addItem(
  itemId: string,
  quantity = 1
): boolean {
  if (quantity <= 0) {
    return false;
  }

  const item = getInventoryItem(itemId);

  if (!item) {
    return false;
  }

  const inventory = loadInventory();
  const existing = inventory.find(
    (entry) => entry.itemId === itemId
  );

  if (existing) {
    if (!item.stackable) {
      return false;
    }

    const maxStack = item.maxStack ?? Infinity;

    if (
      existing.quantity + quantity >
      maxStack
    ) {
      return false;
    }

    existing.quantity += quantity;
  } else {
    inventory.push({
      itemId,
      quantity: item.stackable
        ? Math.min(quantity, item.maxStack ?? quantity)
        : 1,
      acquiredAt: new Date().toISOString(),
      condition: 100,
    });
  }

  saveInventory(inventory);

  return true;
}

export function removeItem(
  itemId: string,
  quantity = 1
): boolean {
  if (quantity <= 0) {
    return false;
  }

  const inventory = loadInventory();

  const index = inventory.findIndex(
    (item) => item.itemId === itemId
  );

  if (index === -1) {
    return false;
  }

  if (inventory[index].quantity < quantity) {
    return false;
  }

  inventory[index].quantity -= quantity;

  if (inventory[index].quantity <= 0) {
    inventory.splice(index, 1);
  }

  saveInventory(inventory);

  return true;
}

export function useItem(
  itemId: string
): boolean {
  const item = getInventoryItem(itemId);

  if (!item || !item.usable) {
    return false;
  }

  return removeItem(itemId, 1);
}

export function updateItemCondition(
  itemId: string,
  condition: number
): boolean {
  const inventory = loadInventory();

  const ownedItem = inventory.find(
    (item) => item.itemId === itemId
  );

  if (!ownedItem) {
    return false;
  }

  ownedItem.condition = Math.max(
    0,
    Math.min(100, condition)
  );

  saveInventory(inventory);

  return true;
}

export function getInventoryValue(): number {
  return loadInventory().reduce(
    (total, ownedItem) => {
      const item = getInventoryItem(
        ownedItem.itemId
      );

      if (!item) {
        return total;
      }

      return (
        total +
        item.value * ownedItem.quantity
      );
    },
    0
  );
}

export function getInventoryCount(): number {
  return loadInventory().reduce(
    (total, item) =>
      total + item.quantity,
    0
  );
}

export function getUniqueInventoryCount(): number {
  return loadInventory().length;
}

export function clearInventory(): void {
  saveInventory([]);
}