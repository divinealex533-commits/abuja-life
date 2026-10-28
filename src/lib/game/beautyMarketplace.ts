"use client";

export type BeautySupplierTier =
  | "standard"
  | "premium"
  | "luxury"
  | "elite";

export type BeautyProductCategory =
  | "human-hair"
  | "frontal"
  | "closure"
  | "bone-straight"
  | "curly"
  | "water-wave"
  | "colored"
  | "luxury";

export type BeautyProductCondition =
  | "new"
  | "refurbished"
  | "revamped";

export type BeautyOrderStatus =
  | "pending"
  | "accepted"
  | "stock-purchased"
  | "processing"
  | "ready"
  | "delivered"
  | "cancelled";

export type BeautyBusinessType =
  | "wig-studio"
  | "beauty-salon"
  | "makeup-studio"
  | "full-beauty-business";

export interface BeautySupplier {
  id: string;
  name: string;
  tier: BeautySupplierTier;
  location: string;
  description: string;
  reliability: number;
  deliveryDays: number;
  marketplaceFeePercent: number;
  products: string[];
  premium: boolean;
}

export interface BeautyProduct {
  id: string;
  supplierId: string;
  name: string;
  category: BeautyProductCategory;
  wigType: string;
  description: string;
  condition: BeautyProductCondition;
  lengthInches: number;
  supplierPrice: number;
  recommendedPrice: number;
  premiumPrice: number;
  stock: number;
  qualityScore: number;
  supplierDeliveryDays: number;
  tags: string[];
}

export interface BeautyCustomerOrder {
  id: string;
  customerName: string;
  location: string;
  productId: string;
  productName: string;
  category: BeautyProductCategory;
  requestedLength: number;
  quantity: number;
  supplierCost: number;
  sellingPrice: number;
  deliveryFee: number;
  marketplaceFee: number;
  expectedProfit: number;
  status: BeautyOrderStatus;
  createdAt: number;
  deadlineSeconds: number;
  vip: boolean;
}

export interface BeautyBusinessState {
  businessType: BeautyBusinessType;
  businessName: string;
  cash: number;
  inventory: Record<string, number>;
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  completedOrders: number;
  reputation: number;
  level: number;
  experience: number;
}

export interface BeautyOrderCalculation {
  supplierCost: number;
  sellingPrice: number;
  deliveryFee: number;
  marketplaceFee: number;
  grossRevenue: number;
  expectedProfit: number;
  profitMarginPercent: number;
}

const BEAUTY_SUPPLIERS: BeautySupplier[] = [
  {
    id: "golden-crown",
    name: "GOLDEN CROWN BEAUTY",
    tier: "premium",
    location: "Wuse 2, Abuja",
    description:
      "Premium human-hair supplier serving Abuja beauty businesses with reliable stock and fast local delivery.",
    reliability: 92,
    deliveryDays: 1,
    marketplaceFeePercent: 4,
    products: [
      "golden-crown-body-wave",
      "golden-crown-bone-straight",
      "golden-crown-water-wave",
      "golden-crown-frontal",
    ],
    premium: true,
  },
  {
    id: "maitama-luxe",
    name: "MAITAMA LUXE HAIR",
    tier: "luxury",
    location: "Maitama, Abuja",
    description:
      "High-end luxury hair supplier specialising in premium frontal, closure and custom wig collections.",
    reliability: 96,
    deliveryDays: 1,
    marketplaceFeePercent: 6,
    products: [
      "maitama-luxe-bone-straight",
      "maitama-luxe-frontal",
      "maitama-luxe-closure",
      "maitama-luxe-curly",
    ],
    premium: true,
  },
  {
    id: "abuja-signature",
    name: "ABUJA SIGNATURE HAIR",
    tier: "premium",
    location: "Central Abuja",
    description:
      "A trusted Abuja supplier for stylish everyday and event-ready wigs.",
    reliability: 90,
    deliveryDays: 2,
    marketplaceFeePercent: 4,
    products: [
      "signature-water-wave",
      "signature-curly",
      "signature-colored",
      "signature-bob",
    ],
    premium: true,
  },
  {
    id: "wuse-beauty-depot",
    name: "WUSE BEAUTY DEPOT",
    tier: "standard",
    location: "Wuse, Abuja",
    description:
      "Affordable beauty supplier for growing salons and new wig businesses.",
    reliability: 84,
    deliveryDays: 2,
    marketplaceFeePercent: 3,
    products: [
      "wuse-bone-straight",
      "wuse-curly",
      "wuse-closure",
      "wuse-bob",
    ],
    premium: false,
  },
  {
    id: "royal-crown-elite",
    name: "ROYAL CROWN ELITE",
    tier: "elite",
    location: "Asokoro, Abuja",
    description:
      "Elite supplier for VIP clients, celebrity styling and high-value custom wig orders.",
    reliability: 98,
    deliveryDays: 2,
    marketplaceFeePercent: 8,
    products: [
      "royal-crown-luxury",
      "royal-crown-vip-straight",
      "royal-crown-vip-wave",
    ],
    premium: true,
  },
];

const BEAUTY_PRODUCTS: BeautyProduct[] = [
  {
    id: "golden-crown-body-wave",
    supplierId: "golden-crown",
    name: "Golden Crown Body Wave",
    category: "human-hair",
    wigType: "body-wave",
    description:
      "Premium body-wave human hair suitable for custom wig construction and luxury revamps.",
    condition: "new",
    lengthInches: 18,
    supplierPrice: 38000,
    recommendedPrice: 52000,
    premiumPrice: 62000,
    stock: 12,
    qualityScore: 91,
    supplierDeliveryDays: 1,
    tags: ["human-hair", "body-wave", "premium", "18-inch"],
  },
  {
    id: "golden-crown-bone-straight",
    supplierId: "golden-crown",
    name: "Golden Crown Bone Straight",
    category: "bone-straight",
    wigType: "bone-straight",
    description:
      "Silky bone-straight human hair for sleek luxury looks.",
    condition: "new",
    lengthInches: 20,
    supplierPrice: 45000,
    recommendedPrice: 62000,
    premiumPrice: 75000,
    stock: 10,
    qualityScore: 94,
    supplierDeliveryDays: 1,
    tags: ["bone-straight", "human-hair", "sleek", "20-inch"],
  },
  {
    id: "golden-crown-water-wave",
    supplierId: "golden-crown",
    name: "Golden Crown Water Wave",
    category: "water-wave",
    wigType: "water-wave",
    description:
      "Soft premium water-wave hair designed for full and glamorous looks.",
    condition: "new",
    lengthInches: 20,
    supplierPrice: 42000,
    recommendedPrice: 58000,
    premiumPrice: 70000,
    stock: 9,
    qualityScore: 92,
    supplierDeliveryDays: 1,
    tags: ["water-wave", "human-hair", "premium", "20-inch"],
  },
  {
    id: "golden-crown-frontal",
    supplierId: "golden-crown",
    name: "Golden Crown HD Frontal",
    category: "frontal",
    wigType: "hd-frontal",
    description:
      "HD frontal designed for natural-looking premium wig installations.",
    condition: "new",
    lengthInches: 18,
    supplierPrice: 30000,
    recommendedPrice: 42000,
    premiumPrice: 52000,
    stock: 15,
    qualityScore: 93,
    supplierDeliveryDays: 1,
    tags: ["frontal", "hd-lace", "human-hair"],
  },
  {
    id: "maitama-luxe-bone-straight",
    supplierId: "maitama-luxe",
    name: "Maitama Luxe Signature Straight",
    category: "bone-straight",
    wigType: "luxury-straight",
    description:
      "Luxury-grade straight hair designed for high-value clients.",
    condition: "new",
    lengthInches: 24,
    supplierPrice: 78000,
    recommendedPrice: 105000,
    premiumPrice: 135000,
    stock: 6,
    qualityScore: 98,
    supplierDeliveryDays: 1,
    tags: ["luxury", "bone-straight", "24-inch", "vip"],
  },
  {
    id: "maitama-luxe-frontal",
    supplierId: "maitama-luxe",
    name: "Maitama Luxe HD Frontal",
    category: "frontal",
    wigType: "hd-frontal",
    description:
      "Luxury HD frontal for premium custom wig production.",
    condition: "new",
    lengthInches: 22,
    supplierPrice: 55000,
    recommendedPrice: 75000,
    premiumPrice: 95000,
    stock: 7,
    qualityScore: 97,
    supplierDeliveryDays: 1,
    tags: ["luxury", "frontal", "hd-lace", "22-inch"],
  },
  {
    id: "maitama-luxe-closure",
    supplierId: "maitama-luxe",
    name: "Maitama Luxe Closure",
    category: "closure",
    wigType: "hd-closure",
    description:
      "Premium HD closure for elegant custom wig designs.",
    condition: "new",
    lengthInches: 20,
    supplierPrice: 42000,
    recommendedPrice: 58000,
    premiumPrice: 72000,
    stock: 8,
    qualityScore: 96,
    supplierDeliveryDays: 1,
    tags: ["luxury", "closure", "hd-lace", "20-inch"],
  },
  {
    id: "maitama-luxe-curly",
    supplierId: "maitama-luxe",
    name: "Maitama Luxe Deep Curly",
    category: "curly",
    wigType: "deep-curly",
    description:
      "Luxury deep-curly human hair for premium beauty transformations.",
    condition: "new",
    lengthInches: 22,
    supplierPrice: 69000,
    recommendedPrice: 92000,
    premiumPrice: 120000,
    stock: 5,
    qualityScore: 97,
    supplierDeliveryDays: 1,
    tags: ["luxury", "curly", "22-inch", "vip"],
  },
  {
    id: "signature-water-wave",
    supplierId: "abuja-signature",
    name: "Abuja Signature Water Wave",
    category: "water-wave",
    wigType: "water-wave",
    description:
      "Stylish premium water-wave hair for everyday and event clients.",
    condition: "new",
    lengthInches: 18,
    supplierPrice: 34000,
    recommendedPrice: 48000,
    premiumPrice: 58000,
    stock: 11,
    qualityScore: 89,
    supplierDeliveryDays: 2,
    tags: ["water-wave", "premium", "18-inch"],
  },
  {
    id: "signature-curly",
    supplierId: "abuja-signature",
    name: "Abuja Signature Curly",
    category: "curly",
    wigType: "curly",
    description:
      "Soft curly hair for playful and glamorous customer looks.",
    condition: "new",
    lengthInches: 18,
    supplierPrice: 36000,
    recommendedPrice: 50000,
    premiumPrice: 60000,
    stock: 10,
    qualityScore: 90,
    supplierDeliveryDays: 2,
    tags: ["curly", "premium", "18-inch"],
  },
  {
    id: "signature-colored",
    supplierId: "abuja-signature",
    name: "Abuja Signature Wine Red",
    category: "colored",
    wigType: "wine-red",
    description:
      "Pre-coloured wine-red human hair for bold Abuja nightlife looks.",
    condition: "new",
    lengthInches: 18,
    supplierPrice: 40000,
    recommendedPrice: 55000,
    premiumPrice: 68000,
    stock: 7,
    qualityScore: 88,
    supplierDeliveryDays: 2,
    tags: ["colored", "wine-red", "human-hair"],
  },
  {
    id: "signature-bob",
    supplierId: "abuja-signature",
    name: "Abuja Signature Bob",
    category: "human-hair",
    wigType: "bob",
    description:
      "Ready-to-style bob hair for customers who want a clean modern look.",
    condition: "new",
    lengthInches: 12,
    supplierPrice: 26000,
    recommendedPrice: 38000,
    premiumPrice: 45000,
    stock: 14,
    qualityScore: 86,
    supplierDeliveryDays: 2,
    tags: ["bob", "human-hair", "short-hair"],
  },
  {
    id: "wuse-bone-straight",
    supplierId: "wuse-beauty-depot",
    name: "Wuse Beauty Bone Straight",
    category: "bone-straight",
    wigType: "bone-straight",
    description:
      "Affordable bone-straight hair for entry-level beauty businesses.",
    condition: "new",
    lengthInches: 18,
    supplierPrice: 24000,
    recommendedPrice: 34000,
    premiumPrice: 40000,
    stock: 20,
    qualityScore: 82,
    supplierDeliveryDays: 2,
    tags: ["bone-straight", "affordable", "18-inch"],
  },
  {
    id: "wuse-curly",
    supplierId: "wuse-beauty-depot",
    name: "Wuse Beauty Curly",
    category: "curly",
    wigType: "curly",
    description:
      "Affordable curly hair for growing salons.",
    condition: "new",
    lengthInches: 16,
    supplierPrice: 22000,
    recommendedPrice: 32000,
    premiumPrice: 38000,
    stock: 18,
    qualityScore: 80,
    supplierDeliveryDays: 2,
    tags: ["curly", "affordable", "16-inch"],
  },
  {
    id: "wuse-closure",
    supplierId: "wuse-beauty-depot",
    name: "Wuse Beauty Closure",
    category: "closure",
    wigType: "closure",
    description:
      "Affordable closure for starter wig makers.",
    condition: "new",
    lengthInches: 16,
    supplierPrice: 18000,
    recommendedPrice: 27000,
    premiumPrice: 33000,
    stock: 20,
    qualityScore: 79,
    supplierDeliveryDays: 2,
    tags: ["closure", "affordable", "16-inch"],
  },
  {
    id: "wuse-bob",
    supplierId: "wuse-beauty-depot",
    name: "Wuse Beauty Bob",
    category: "human-hair",
    wigType: "bob",
    description:
      "Affordable bob collection for everyday customers.",
    condition: "new",
    lengthInches: 10,
    supplierPrice: 16000,
    recommendedPrice: 25000,
    premiumPrice: 30000,
    stock: 18,
    qualityScore: 78,
    supplierDeliveryDays: 2,
    tags: ["bob", "affordable", "10-inch"],
  },
  {
    id: "royal-crown-luxury",
    supplierId: "royal-crown-elite",
    name: "Royal Crown Diamond Collection",
    category: "luxury",
    wigType: "luxury-custom",
    description:
      "Elite custom hair collection for VIP customers and celebrity-level orders.",
    condition: "new",
    lengthInches: 26,
    supplierPrice: 120000,
    recommendedPrice: 165000,
    premiumPrice: 220000,
    stock: 3,
    qualityScore: 100,
    supplierDeliveryDays: 2,
    tags: ["elite", "luxury", "26-inch", "vip", "celebrity"],
  },
  {
    id: "royal-crown-vip-straight",
    supplierId: "royal-crown-elite",
    name: "Royal Crown VIP Straight",
    category: "luxury",
    wigType: "vip-straight",
    description:
      "Elite straight hair for VIP events, executives and celebrity clients.",
    condition: "new",
    lengthInches: 24,
    supplierPrice: 105000,
    recommendedPrice: 145000,
    premiumPrice: 190000,
    stock: 4,
    qualityScore: 99,
    supplierDeliveryDays: 2,
    tags: ["elite", "vip", "straight", "24-inch"],
  },
  {
    id: "royal-crown-vip-wave",
    supplierId: "royal-crown-elite",
    name: "Royal Crown VIP Wave",
    category: "luxury",
    wigType: "vip-wave",
    description:
      "Elite wave collection designed for premium red-carpet looks.",
    condition: "new",
    lengthInches: 24,
    supplierPrice: 110000,
    recommendedPrice: 150000,
    premiumPrice: 200000,
    stock: 3,
    qualityScore: 99,
    supplierDeliveryDays: 2,
    tags: ["elite", "vip", "wave", "24-inch"],
  },
];

const BEAUTY_CUSTOMER_ORDERS: BeautyCustomerOrder[] = [
  {
    id: "order-wuse-body-wave",
    customerName: "Amaka",
    location: "Wuse 2",
    productId: "golden-crown-body-wave",
    productName: "Golden Crown Body Wave",
    category: "human-hair",
    requestedLength: 18,
    quantity: 1,
    supplierCost: 38000,
    sellingPrice: 52000,
    deliveryFee: 2500,
    marketplaceFee: 2080,
    expectedProfit: 14380,
    status: "pending",
    createdAt: Date.now(),
    deadlineSeconds: 180,
    vip: false,
  },
  {
    id: "order-jabi-water-wave",
    customerName: "Zainab",
    location: "Jabi",
    productId: "signature-water-wave",
    productName: "Abuja Signature Water Wave",
    category: "water-wave",
    requestedLength: 18,
    quantity: 1,
    supplierCost: 34000,
    sellingPrice: 48000,
    deliveryFee: 3000,
    marketplaceFee: 1920,
    expectedProfit: 15080,
    status: "pending",
    createdAt: Date.now(),
    deadlineSeconds: 210,
    vip: false,
  },
  {
    id: "order-maitama-luxe",
    customerName: "Fatima",
    location: "Maitama",
    productId: "maitama-luxe-bone-straight",
    productName: "Maitama Luxe Signature Straight",
    category: "bone-straight",
    requestedLength: 24,
    quantity: 1,
    supplierCost: 78000,
    sellingPrice: 105000,
    deliveryFee: 4500,
    marketplaceFee: 6300,
    expectedProfit: 25200,
    status: "pending",
    createdAt: Date.now(),
    deadlineSeconds: 240,
    vip: true,
  },
  {
    id: "order-asokoro-vip",
    customerName: "Daniela",
    location: "Asokoro",
    productId: "royal-crown-luxury",
    productName: "Royal Crown Diamond Collection",
    category: "luxury",
    requestedLength: 26,
    quantity: 1,
    supplierCost: 120000,
    sellingPrice: 165000,
    deliveryFee: 7000,
    marketplaceFee: 13200,
    expectedProfit: 38800,
    status: "pending",
    createdAt: Date.now(),
    deadlineSeconds: 300,
    vip: true,
  },
];

const DEFAULT_BUSINESS_STATE: BeautyBusinessState = {
  businessType: "wig-studio",
  businessName: "New Beauty Studio",
  cash: 10000,
  inventory: {},
  totalRevenue: 0,
  totalProfit: 0,
  totalOrders: 0,
  completedOrders: 0,
  reputation: 0,
  level: 1,
  experience: 0,
};

export function getAllBeautySuppliers(): BeautySupplier[] {
  return [...BEAUTY_SUPPLIERS];
}

export function getBeautySupplier(
  supplierId: string
): BeautySupplier | null {
  return (
    BEAUTY_SUPPLIERS.find(
      (supplier) => supplier.id === supplierId
    ) ?? null
  );
}

export function getAllBeautyProducts(): BeautyProduct[] {
  return [...BEAUTY_PRODUCTS];
}

export function getBeautyProduct(
  productId: string
): BeautyProduct | null {
  return (
    BEAUTY_PRODUCTS.find(
      (product) => product.id === productId
    ) ?? null
  );
}

export function getBeautyProductsBySupplier(
  supplierId: string
): BeautyProduct[] {
  return BEAUTY_PRODUCTS.filter(
    (product) => product.supplierId === supplierId
  );
}

export function getBeautyProductsByCategory(
  category: BeautyProductCategory
): BeautyProduct[] {
  return BEAUTY_PRODUCTS.filter(
    (product) => product.category === category
  );
}

export function getPremiumBeautyProducts(): BeautyProduct[] {
  return BEAUTY_PRODUCTS.filter((product) => {
    const supplier = getBeautySupplier(product.supplierId);

    return (
      product.qualityScore >= 90 ||
      supplier?.premium === true
    );
  });
}

export function getLuxuryBeautyProducts(): BeautyProduct[] {
  return BEAUTY_PRODUCTS.filter(
    (product) =>
      product.category === "luxury" ||
      product.qualityScore >= 97
  );
}

export function getAllBeautyCustomerOrders(): BeautyCustomerOrder[] {
  return [...BEAUTY_CUSTOMER_ORDERS];
}

export function getBeautyCustomerOrder(
  orderId: string
): BeautyCustomerOrder | null {
  return (
    BEAUTY_CUSTOMER_ORDERS.find(
      (order) => order.id === orderId
    ) ?? null
  );
}

export function calculateBeautyOrder(
  product: BeautyProduct,
  quantity = 1,
  customSellingPrice?: number
): BeautyOrderCalculation {
  const supplier = getBeautySupplier(product.supplierId);

  const safeQuantity = Math.max(
    1,
    Math.floor(quantity)
  );

  const supplierCost =
    product.supplierPrice * safeQuantity;

  const sellingPrice =
    typeof customSellingPrice === "number"
      ? Math.max(
          product.supplierPrice * safeQuantity,
          Math.floor(customSellingPrice)
        )
      : product.recommendedPrice * safeQuantity;

  const deliveryFee =
    supplier?.tier === "elite"
      ? 7000
      : supplier?.tier === "luxury"
        ? 4500
        : supplier?.tier === "premium"
          ? 3000
          : 2000;

  const marketplaceRate =
    (supplier?.marketplaceFeePercent ?? 4) / 100;

  const marketplaceFee = Math.round(
    sellingPrice * marketplaceRate
  );

  const grossRevenue = sellingPrice + deliveryFee;

  const expectedProfit =
    grossRevenue -
    supplierCost -
    marketplaceFee;

  const profitMarginPercent =
    sellingPrice > 0
      ? Math.round(
          (expectedProfit / sellingPrice) * 100
        )
      : 0;

  return {
    supplierCost,
    sellingPrice,
    deliveryFee,
    marketplaceFee,
    grossRevenue,
    expectedProfit,
    profitMarginPercent,
  };
}

export function calculateBeautyProfit(
  sellingPrice: number,
  supplierCost: number,
  marketplaceFeePercent = 4,
  deliveryFee = 0
): number {
  const marketplaceFee = Math.round(
    sellingPrice * (marketplaceFeePercent / 100)
  );

  return (
    sellingPrice +
    deliveryFee -
    supplierCost -
    marketplaceFee
  );
}

export function calculateMarketplaceFee(
  amount: number,
  feePercent: number
): number {
  return Math.max(
    0,
    Math.round(amount * (feePercent / 100))
  );
}

export function canPurchaseBeautyStock(
  cash: number,
  product: BeautyProduct,
  quantity = 1
): boolean {
  const safeQuantity = Math.max(
    1,
    Math.floor(quantity)
  );

  return (
    product.stock >= safeQuantity &&
    cash >= product.supplierPrice * safeQuantity
  );
}

export function calculateBeautyExperience(
  profit: number,
  qualityScore: number,
  vip = false
): number {
  const profitXp = Math.floor(
    Math.max(0, profit) / 1000
  );

  const qualityXp = Math.floor(
    Math.max(0, qualityScore - 70) / 2
  );

  const vipBonus = vip ? 50 : 0;

  return Math.max(
    10,
    profitXp + qualityXp + vipBonus
  );
}

export function calculateBeautyReputation(
  qualityScore: number,
  vip = false
): number {
  const base = Math.max(
    1,
    Math.floor((qualityScore - 50) / 5)
  );

  return base + (vip ? 5 : 0);
}

export function getBeautyBusinessLevel(
  experience: number
): number {
  if (experience >= 10000) return 10;
  if (experience >= 7500) return 9;
  if (experience >= 5500) return 8;
  if (experience >= 4000) return 7;
  if (experience >= 2800) return 6;
  if (experience >= 1900) return 5;
  if (experience >= 1200) return 4;
  if (experience >= 700) return 3;
  if (experience >= 300) return 2;

  return 1;
}

export function getBeautyBusinessRank(
  level: number
): string {
  if (level >= 10) return "Beauty Empire Owner";
  if (level >= 9) return "Celebrity Beauty Mogul";
  if (level >= 8) return "Luxury Beauty Director";
  if (level >= 7) return "Elite Beauty Entrepreneur";
  if (level >= 6) return "Premium Beauty Owner";
  if (level >= 5) return "Senior Beauty Entrepreneur";
  if (level >= 4) return "Professional Beauty Owner";
  if (level >= 3) return "Growing Beauty Entrepreneur";
  if (level >= 2) return "Beauty Business Owner";

  return "Beauty Business Starter";
}

export function getSupplierTierLabel(
  tier: BeautySupplierTier
): string {
  const labels: Record<BeautySupplierTier, string> = {
    standard: "Standard Supplier",
    premium: "Premium Supplier",
    luxury: "Luxury Supplier",
    elite: "Elite Supplier",
  };

  return labels[tier];
}

export function getBeautyOrderStatusLabel(
  status: BeautyOrderStatus
): string {
  const labels: Record<BeautyOrderStatus, string> = {
    pending: "Pending",
    accepted: "Accepted",
    "stock-purchased": "Stock Purchased",
    processing: "Processing",
    ready: "Ready",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[status];
}

export function getDefaultBeautyBusinessState(): BeautyBusinessState {
  return {
    ...DEFAULT_BUSINESS_STATE,
    inventory: {},
  };
}

export function addBeautyInventory(
  state: BeautyBusinessState,
  productId: string,
  quantity: number
): BeautyBusinessState {
  const safeQuantity = Math.max(
    0,
    Math.floor(quantity)
  );

  return {
    ...state,
    inventory: {
      ...state.inventory,
      [productId]:
        (state.inventory[productId] ?? 0) +
        safeQuantity,
    },
  };
}

export function removeBeautyInventory(
  state: BeautyBusinessState,
  productId: string,
  quantity: number
): BeautyBusinessState {
  const currentQuantity =
    state.inventory[productId] ?? 0;

  const nextQuantity = Math.max(
    0,
    currentQuantity -
      Math.max(0, Math.floor(quantity))
  );

  return {
    ...state,
    inventory: {
      ...state.inventory,
      [productId]: nextQuantity,
    },
  };
}

export function getBeautyInventoryCount(
  state: BeautyBusinessState,
  productId: string
): number {
  return state.inventory[productId] ?? 0;
}

export function purchaseBeautyStock(
  state: BeautyBusinessState,
  productId: string,
  quantity: number
):
  | {
      success: true;
      state: BeautyBusinessState;
      totalCost: number;
    }
  | {
      success: false;
      state: BeautyBusinessState;
      totalCost: 0;
      message: string;
    } {
  const product = getBeautyProduct(productId);

  if (!product) {
    return {
      success: false,
      state,
      totalCost: 0,
      message: "Beauty product not found.",
    };
  }

  const safeQuantity = Math.max(
    1,
    Math.floor(quantity)
  );

  const totalCost =
    product.supplierPrice * safeQuantity;

  if (product.stock < safeQuantity) {
    return {
      success: false,
      state,
      totalCost: 0,
      message: "Supplier does not have enough stock.",
    };
  }

  if (state.cash < totalCost) {
    return {
      success: false,
      state,
      totalCost: 0,
      message: "You do not have enough cash.",
    };
  }

  const nextState = addBeautyInventory(
    {
      ...state,
      cash: state.cash - totalCost,
    },
    productId,
    safeQuantity
  );

  return {
    success: true,
    state: nextState,
    totalCost,
  };
}

export function completeBeautyCustomerOrder(
  state: BeautyBusinessState,
  order: BeautyCustomerOrder
):
  | {
      success: true;
      state: BeautyBusinessState;
      profit: number;
      experience: number;
      reputation: number;
    }
  | {
      success: false;
      state: BeautyBusinessState;
      profit: 0;
      experience: 0;
      reputation: 0;
      message: string;
    } {
  const inventory =
    getBeautyInventoryCount(
      state,
      order.productId
    );

  if (inventory < order.quantity) {
    return {
      success: false,
      state,
      profit: 0,
      experience: 0,
      reputation: 0,
      message:
        "You need to purchase the required stock first.",
    };
  }

  const product = getBeautyProduct(
    order.productId
  );

  if (!product) {
    return {
      success: false,
      state,
      profit: 0,
      experience: 0,
      reputation: 0,
      message: "The product attached to this order no longer exists.",
    };
  }

  const supplier = getBeautySupplier(
    product.supplierId
  );

  const marketplaceFeePercent =
    supplier?.marketplaceFeePercent ?? 4;

  const profit = calculateBeautyProfit(
    order.sellingPrice * order.quantity,
    order.supplierCost * order.quantity,
    marketplaceFeePercent,
    order.deliveryFee
  );

  const experience =
    calculateBeautyExperience(
      profit,
      product.qualityScore,
      order.vip
    );

  const reputation =
    calculateBeautyReputation(
      product.qualityScore,
      order.vip
    );

  const nextExperience =
    state.experience + experience;

  const nextLevel =
    getBeautyBusinessLevel(nextExperience);

  let nextState =
    removeBeautyInventory(
      state,
      order.productId,
      order.quantity
    );

  nextState = {
    ...nextState,
    cash:
      nextState.cash +
      order.sellingPrice * order.quantity +
      order.deliveryFee -
      calculateMarketplaceFee(
        order.sellingPrice * order.quantity,
        marketplaceFeePercent
      ),
    totalRevenue:
      nextState.totalRevenue +
      order.sellingPrice * order.quantity,
    totalProfit:
      nextState.totalProfit + profit,
    totalOrders:
      nextState.totalOrders + 1,
    completedOrders:
      nextState.completedOrders + 1,
    reputation:
      nextState.reputation + reputation,
    experience: nextExperience,
    level: nextLevel,
  };

  return {
    success: true,
    state: nextState,
    profit,
    experience,
    reputation,
  };
}

export function getBeautyBusinessSummary(
  state: BeautyBusinessState
) {
  return {
    businessName: state.businessName,
    businessType: state.businessType,
    cash: state.cash,
    inventoryItems: Object.values(
      state.inventory
    ).reduce(
      (total, quantity) => total + quantity,
      0
    ),
    totalRevenue: state.totalRevenue,
    totalProfit: state.totalProfit,
    totalOrders: state.totalOrders,
    completedOrders: state.completedOrders,
    reputation: state.reputation,
    experience: state.experience,
    level: getBeautyBusinessLevel(
      state.experience
    ),
    rank: getBeautyBusinessRank(
      getBeautyBusinessLevel(
        state.experience
      )
    ),
  };
}
