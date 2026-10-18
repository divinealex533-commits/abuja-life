export type ShopkeeperProduct = {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  basePrice: number;
  demand: "low" | "medium" | "high";
};

export type ShopkeeperOrder = {
  id: string;
  productId: string;
  customer: string;
  quantity: number;
  patience: number;
};

export const SHOPKEEPER_PRODUCTS: ShopkeeperProduct[] = [
  {
    id: "water",
    name: "Bottled Water",
    emoji: "💧",
    baseCost: 150,
    basePrice: 250,
    demand: "high",
  },
  {
    id: "soft-drink",
    name: "Soft Drink",
    emoji: "🥤",
    baseCost: 250,
    basePrice: 450,
    demand: "high",
  },
  {
    id: "bread",
    name: "Bread",
    emoji: "🍞",
    baseCost: 450,
    basePrice: 700,
    demand: "high",
  },
  {
    id: "rice",
    name: "Rice Bag",
    emoji: "🍚",
    baseCost: 12000,
    basePrice: 15000,
    demand: "medium",
  },
  {
    id: "clothing",
    name: "Casual Clothing",
    emoji: "👕",
    baseCost: 3500,
    basePrice: 5000,
    demand: "medium",
  },
  {
    id: "electronics",
    name: "Small Electronics",
    emoji: "📱",
    baseCost: 18000,
    basePrice: 24000,
    demand: "low",
  },
  {
    id: "toiletries",
    name: "Toiletries",
    emoji: "🧴",
    baseCost: 1200,
    basePrice: 1900,
    demand: "medium",
  },
];

const CUSTOMERS = [
  "Amina",
  "Chinedu",
  "Fatima",
  "Emeka",
  "Zainab",
  "Tunde",
  "Maryam",
  "David",
];

export const SHOPKEEPER_ORDERS: ShopkeeperOrder[] = Array.from(
  { length: 12 },
  (_, index) => {
    const product =
      SHOPKEEPER_PRODUCTS[index % SHOPKEEPER_PRODUCTS.length];

    return {
      id: `shop-order-${index + 1}`,
      productId: product.id,
      customer: CUSTOMERS[index % CUSTOMERS.length],
      quantity: 1 + (index % 3),
      patience: 72 - (index % 4) * 8,
    };
  }
);

export function getShopkeeperProduct(id: string) {
  return (
    SHOPKEEPER_PRODUCTS.find((product) => product.id === id) ?? null
  );
}

export function calculateShopkeeperSale(
  order: ShopkeeperOrder,
  sellingPrice: number,
  serviceScore: number
) {
  const product = getShopkeeperProduct(order.productId);

  if (!product) return null;

  const priceRatio = sellingPrice / product.basePrice;

  const fairPrice = Math.max(
    1,
    Math.round(product.basePrice * order.quantity)
  );

  const total = Math.round(sellingPrice * order.quantity);

  const cost = Math.round(product.baseCost * order.quantity);

  let satisfaction = serviceScore;

  if (priceRatio <= 0.9) {
    satisfaction += 12;
  } else if (priceRatio <= 1.05) {
    satisfaction += 8;
  } else if (priceRatio <= 1.2) {
    satisfaction -= 8;
  } else {
    satisfaction -= 22;
  }

  if (product.demand === "high") {
    satisfaction += 6;
  }

  if (product.demand === "low") {
    satisfaction -= 4;
  }

  satisfaction = Math.max(
    0,
    Math.min(100, Math.round(satisfaction))
  );

  if (satisfaction < 35) {
    return {
      accepted: false,
      total: 0,
      profit: 0,
      satisfaction,
      fairPrice,
    };
  }

  const tip =
    satisfaction >= 90
      ? Math.round(total * 0.08)
      : satisfaction >= 75
        ? Math.round(total * 0.04)
        : 0;

  const revenue = total + tip;

  return {
    accepted: true,
    total: revenue,
    profit: revenue - cost,
    satisfaction,
    tip,
    fairPrice,
  };
}
