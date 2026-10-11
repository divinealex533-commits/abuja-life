import {
  getInventoryItem,
  addItem,
  type InventoryCategory,
} from "@/lib/game/inventory";
import {
  loadPlayerState,
  savePlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export type ShopCategory =
  | "fashion"
  | "food"
  | "electronics"
  | "tools"
  | "business"
  | "property"
  | "events"
  | "luxury";

export interface Shop {
  id: string;
  name: string;
  description: string;
  locationId: string;
  category: ShopCategory;
  icon: string;
  openHour: number;
  closeHour: number;
  tags: string[];
}

export interface ShopProduct {
  itemId: string;
  shopId: string;
  price: number;
  featured?: boolean;
}

export const SHOPS: Shop[] = [
  {
    id: "abuja-fashion-house",
    name: "Abuja Fashion House",
    description:
      "Modern Abuja fashion, everyday clothing and premium outfits.",
    locationId: "wuse-2",
    category: "fashion",
    icon: "👕",
    openHour: 9,
    closeHour: 21,
    tags: ["fashion", "clothing", "wuse-2"],
  },
  {
    id: "abuja-food-mart",
    name: "Abuja Food Mart",
    description:
      "Quick meals, drinks and food items for players on the move.",
    locationId: "garki",
    category: "food",
    icon: "🍛",
    openHour: 7,
    closeHour: 22,
    tags: ["food", "market", "garki"],
  },
  {
    id: "capital-electronics",
    name: "Capital Electronics",
    description:
      "Phones, cameras and modern electronics for work and city life.",
    locationId: "wuse",
    category: "electronics",
    icon: "📱",
    openHour: 9,
    closeHour: 20,
    tags: ["electronics", "technology", "wuse"],
  },
  {
    id: "abuja-tool-center",
    name: "Abuja Tool Center",
    description:
      "Professional equipment and tools for careers and businesses.",
    locationId: "garki",
    category: "tools",
    icon: "🧰",
    openHour: 8,
    closeHour: 19,
    tags: ["tools", "jobs", "business"],
  },
  {
    id: "capital-business-office",
    name: "Capital Business Office",
    description:
      "Business documentation and professional supplies.",
    locationId: "cbd",
    category: "business",
    icon: "📜",
    openHour: 8,
    closeHour: 18,
    tags: ["business", "cbd", "career"],
  },
  {
    id: "abuja-events-store",
    name: "Abuja Events Store",
    description:
      "VIP passes and access items for special city events.",
    locationId: "jabi",
    category: "events",
    icon: "🎟️",
    openHour: 10,
    closeHour: 23,
    tags: ["events", "vip", "jabi"],
  },
  {
    id: "abuja-luxury-gallery",
    name: "Abuja Luxury Gallery",
    description:
      "Rare collectibles and premium lifestyle items.",
    locationId: "maitama",
    category: "luxury",
    icon: "💎",
    openHour: 10,
    closeHour: 21,
    tags: ["luxury", "premium", "maitama"],
  },
];

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    shopId: "abuja-fashion-house",
    itemId: "basic-tshirt",
    price: 5000,
  },
  {
    shopId: "abuja-fashion-house",
    itemId: "designer-outfit",
    price: 85000,
    featured: true,
  },

  {
    shopId: "abuja-food-mart",
    itemId: "bottled-water",
    price: 500,
  },
  {
    shopId: "abuja-food-mart",
    itemId: "jollof-rice",
    price: 2500,
    featured: true,
  },

  {
    shopId: "capital-electronics",
    itemId: "smartphone",
    price: 180000,
    featured: true,
  },
  {
    shopId: "capital-electronics",
    itemId: "professional-camera",
    price: 750000,
    featured: true,
  },

  {
    shopId: "abuja-tool-center",
    itemId: "toolkit",
    price: 85000,
    featured: true,
  },

  {
    shopId: "capital-business-office",
    itemId: "business-license",
    price: 25000,
    featured: true,
  },

  {
    shopId: "abuja-events-store",
    itemId: "event-pass",
    price: 50000,
    featured: true,
  },

  {
    shopId: "abuja-luxury-gallery",
    itemId: "abuja-treasure",
    price: 500000,
    featured: true,
  },
  {
    shopId: "abuja-luxury-gallery",
    itemId: "city-challenge-trophy",
    price: 150000,
    featured: true,
  },
];

export function getShopById(
  shopId: string
): Shop | undefined {
  return SHOPS.find((shop) => shop.id === shopId);
}

export function getShopProducts(
  shopId: string
): ShopProduct[] {
  return SHOP_PRODUCTS.filter(
    (product) => product.shopId === shopId
  );
}

export function getShopProduct(
  shopId: string,
  itemId: string
): ShopProduct | undefined {
  return SHOP_PRODUCTS.find(
    (product) =>
      product.shopId === shopId &&
      product.itemId === itemId
  );
}

export function getShopsByLocation(
  locationId: string
): Shop[] {
  return SHOPS.filter(
    (shop) => shop.locationId === locationId
  );
}

export function getShopsByCategory(
  category: ShopCategory
): Shop[] {
  return SHOPS.filter(
    (shop) => shop.category === category
  );
}

export function isShopOpen(
  shop: Shop,
  hour: number
): boolean {
  if (shop.openHour < shop.closeHour) {
    return (
      hour >= shop.openHour &&
      hour < shop.closeHour
    );
  }

  return (
    hour >= shop.openHour ||
    hour < shop.closeHour
  );
}

export function getProductItem(
  product: ShopProduct
) {
  return getInventoryItem(product.itemId);
}

export function getProductCategory(
  product: ShopProduct
): InventoryCategory | undefined {
  return getInventoryItem(product.itemId)?.category;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  player: PlayerGameState;
}

export function purchaseShopProduct(
  shopId: string,
  itemId: string
): PurchaseResult {
  const player = loadPlayerState();

  const product = getShopProduct(shopId, itemId);

  if (!product) {
    return {
      success: false,
      message: "This item is not sold at this shop.",
      player,
    };
  }

  const item = getInventoryItem(itemId);

  if (!item) {
    return {
      success: false,
      message: "This item no longer exists.",
      player,
    };
  }

  if (player.cash < product.price) {
    return {
      success: false,
      message: `You need ₦${product.price.toLocaleString()} to buy ${item.name}.`,
      player,
    };
  }

  const added = addItem(itemId, 1);

  if (!added) {
    return {
      success: false,
      message:
        "You already have this item or your inventory cannot hold another one.",
      player,
    };
  }

  const updatedPlayer: PlayerGameState = {
    ...player,
    cash: player.cash - product.price,
  };

  savePlayerState(updatedPlayer);

  return {
    success: true,
    message: `${item.name} purchased successfully.`,
    player: updatedPlayer,
  };
}