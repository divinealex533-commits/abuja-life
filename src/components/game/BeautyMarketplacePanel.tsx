"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  calculateBeautyOrder,
  calculateBeautyProfit,
  getAllBeautyCustomerOrders,
  getAllBeautyProducts,
  getAllBeautySuppliers,
  getBeautyProductsBySupplier,
  getBeautySupplier,
  getBeautyBusinessRank,
  getBeautyBusinessLevel,
  getBeautyInventoryCount,
  getDefaultBeautyBusinessState,
  purchaseBeautyStock,
  completeBeautyCustomerOrder,
  type BeautyBusinessState,
  type BeautyCustomerOrder,
  type BeautyProduct,
  type BeautySupplier,
} from "@/lib/game/beautyMarketplace";
import {
  loadPersistentPlayerState,
  savePlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

type Screen =
  | "home"
  | "suppliers"
  | "products"
  | "orders"
  | "product"
  | "order";

type OrderStatus =
  | BeautyCustomerOrder["status"]
  | "accepted"
  | "stock-purchased"
  | "delivered";

function formatNGN(value: number) {
  return `₦${Math.round(value).toLocaleString("en-NG")}`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes <= 0) return `${remaining}s`;
  return `${minutes}m ${remaining}s`;
}

function getSupplierTierStyle(tier: BeautySupplier["tier"]) {
  switch (tier) {
    case "elite":
      return "border-yellow-400/40 bg-yellow-400/10 text-yellow-300";
    case "luxury":
      return "border-purple-400/40 bg-purple-400/10 text-purple-300";
    case "premium":
      return "border-cyan-400/40 bg-cyan-400/10 text-cyan-300";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function getStatusStyle(status: OrderStatus) {
  switch (status) {
    case "delivered":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "stock-purchased":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
    case "accepted":
      return "border-purple-400/30 bg-purple-400/10 text-purple-300";
    case "processing":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "ready":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "cancelled":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    default:
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }
}

export default function BeautyMarketplacePanel() {
  const [screen, setScreen] = useState<Screen>("home");
  const [player, setPlayer] = useState<PlayerGameState | null>(null);
  const [business, setBusiness] = useState<BeautyBusinessState>(
    getDefaultBeautyBusinessState()
  );

  const [suppliers] = useState<BeautySupplier[]>(() =>
    getAllBeautySuppliers()
  );

  const [products] = useState<BeautyProduct[]>(() =>
    getAllBeautyProducts()
  );

  const [orders] = useState<BeautyCustomerOrder[]>(() =>
    getAllBeautyCustomerOrders()
  );

  const [orderStates, setOrderStates] = useState<Record<string, OrderStatus>>(
    () => {
      const initial: Record<string, OrderStatus> = {};

      getAllBeautyCustomerOrders().forEach((order) => {
        initial[order.id] = order.status;
      });

      return initial;
    }
  );

  const [selectedSupplier, setSelectedSupplier] =
    useState<BeautySupplier | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<BeautyProduct | null>(null);

  const [selectedOrder, setSelectedOrder] =
    useState<BeautyCustomerOrder | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(0);

  const [productFilter, setProductFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");

  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    const loadedPlayer = loadPersistentPlayerState();

    setPlayer(loadedPlayer);

    setBusiness((current) => ({
      ...current,
      cash: loadedPlayer.cash,
    }));
  }, []);

  const inventoryCount = useMemo(
    () => getBeautyInventoryCount(business),
    [business]
  );

  const businessLevel = useMemo(
    () => getBeautyBusinessLevel(business),
    [business]
  );

  const businessRank = useMemo(
    () => getBeautyBusinessRank(business),
    [business]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        productFilter === "all" || product.category === productFilter;

      const supplierMatch =
        supplierFilter === "all" || product.supplierId === supplierFilter;

      return categoryMatch && supplierMatch;
    });
  }, [products, productFilter, supplierFilter]);

  const showNotice = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    setNotice({ type, message });

    window.setTimeout(() => {
      setNotice(null);
    }, 4000);
  };

  const syncPlayerCash = (cash: number) => {
    if (!player) return;

    const updatedPlayer: PlayerGameState = {
      ...player,
      cash,
    };

    setPlayer(updatedPlayer);
    savePlayerState(updatedPlayer);
  };

  const openProduct = (product: BeautyProduct) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSellingPrice(product.recommendedSellingPrice);
    setScreen("product");
  };

  const openOrder = (order: BeautyCustomerOrder) => {
    setSelectedOrder(order);
    setScreen("order");
  };

  const handleBuyStock = () => {
    if (!selectedProduct || !player) return;

    if (quantity < 1) {
      showNotice("error", "Choose at least one item.");
      return;
    }

    const totalCost = selectedProduct.supplierPrice * quantity;

    if (player.cash < totalCost) {
      showNotice(
        "error",
        `You need ${formatNGN(totalCost)} to buy this stock.`
      );
      return;
    }

    const result = purchaseBeautyStock(
      business,
      selectedProduct.id,
      quantity
    );

    if (!result.success) {
      showNotice("error", result.message);
      return;
    }

    setBusiness(result.state);
    syncPlayerCash(result.state.cash);

    showNotice(
      "success",
      `${quantity} × ${selectedProduct.name} added to your beauty inventory.`
    );

    setQuantity(1);
  };

  const acceptOrder = (order: BeautyCustomerOrder) => {
    const currentStatus = orderStates[order.id] ?? order.status;

    if (currentStatus !== "pending") {
      showNotice("info", "This customer order has already been accepted.");
      return;
    }

    setOrderStates((current) => ({
      ...current,
      [order.id]: "accepted",
    }));

    showNotice(
      "success",
      `${order.customerName}'s order has been accepted.`
    );
  };

  const buyOrderStock = (order: BeautyCustomerOrder) => {
    if (!player) return;

    const currentStatus = orderStates[order.id] ?? order.status;

    if (currentStatus !== "accepted") {
      showNotice("info", "Accept the customer order first.");
      return;
    }

    const product = products.find(
      (item) => item.id === order.productId
    );

    if (!product) {
      showNotice("error", "The required product could not be found.");
      return;
    }

    if (player.cash < product.supplierPrice) {
      showNotice(
        "error",
        `You need ${formatNGN(
          product.supplierPrice
        )} to purchase the customer's stock.`
      );
      return;
    }

    const result = purchaseBeautyStock(
      business,
      product.id,
      1
    );

    if (!result.success) {
      showNotice("error", result.message);
      return;
    }

    setBusiness(result.state);
    syncPlayerCash(result.state.cash);

    setOrderStates((current) => ({
      ...current,
      [order.id]: "stock-purchased",
    }));

    showNotice(
      "success",
      `${product.name} purchased from ${getBeautySupplier(
        product.supplierId
      )?.name ?? "supplier"}.`
    );
  };

  const deliverOrder = (order: BeautyCustomerOrder) => {
    const currentStatus = orderStates[order.id] ?? order.status;

    if (currentStatus !== "stock-purchased") {
      showNotice(
        "info",
        "Purchase the required stock before delivering this order."
      );
      return;
    }

    const result = completeBeautyCustomerOrder(
      business,
      order.id
    );

    if (!result.success) {
      showNotice("error", result.message);
      return;
    }

    setBusiness(result.state);
    syncPlayerCash(result.state.cash);

    setOrderStates((current) => ({
      ...current,
      [order.id]: "delivered",
    }));

    showNotice(
      "success",
      `${order.customerName}'s order was delivered successfully. You earned ${formatNGN(
        result.profit ?? 0
      )} profit.`
    );
  };

  const renderHeader = () => (
    <div className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/70 via-black to-fuchsia-950/40 p-5 shadow-2xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-purple-300">
            <span>✦</span>
            Beauty Business
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Abuja Beauty Marketplace
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Buy premium beauty stock, serve customer orders, revamp wigs,
            grow your reputation and turn your beauty business into a
            serious Abuja empire.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
          <StatCard
            label="Cash"
            value={formatNGN(player?.cash ?? business.cash)}
            icon="💰"
          />

          <StatCard
            label="Inventory"
            value={String(inventoryCount)}
            icon="📦"
          />

          <StatCard
            label="Level"
            value={String(businessLevel)}
            icon="⭐"
          />

          <StatCard
            label="Rank"
            value={businessRank}
            icon="👑"
          />
        </div>
      </div>
    </div>
  );

  const renderNavigation = () => (
    <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2">
      {[
        ["home", "🏠", "Business"],
        ["suppliers", "🏪", "Suppliers"],
        ["products", "💇🏾‍♀️", "Products"],
        ["orders", "🛍️", "Customer Orders"],
      ].map(([id, icon, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setScreen(id as Screen)}
          className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition ${
            screen === id ||
            (id === "products" &&
              (screen === "product" || screen === "products")) ||
            (id === "orders" &&
              (screen === "order" || screen === "orders"))
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );

  const renderHome = () => {
    const pendingOrders = orders.filter(
      (order) =>
        (orderStates[order.id] ?? order.status) !== "delivered"
    );

    const premiumProducts = products.filter(
      (product) =>
        product.category === "luxury" ||
        product.tier === "luxury" ||
        product.tier === "elite"
    );

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            icon="🏪"
            title="Supplier Network"
            description="Work with premium Abuja suppliers and source quality stock."
            button="Browse Suppliers"
            onClick={() => setScreen("suppliers")}
          />

          <DashboardCard
            icon="💎"
            title="Premium Stock"
            description="Buy high-value wigs and beauty products for bigger margins."
            button="Shop Stock"
            onClick={() => setScreen("products")}
          />

          <DashboardCard
            icon="🛍️"
            title="Customer Orders"
            description={`${pendingOrders.length} customer orders are waiting for your business.`}
            button="Manage Orders"
            onClick={() => setScreen("orders")}
          />
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                High Value
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Luxury Beauty Opportunities
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setProductFilter("all");
                setSupplierFilter("all");
                setScreen("products");
              }}
              className="text-sm font-bold text-purple-300 hover:text-purple-200"
            >
              View all →
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {premiumProducts.slice(0, 3).map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => openProduct(product)}
                className="group rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-purple-500/5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-purple-300">
                    {product.tier}
                  </span>

                  <span className="text-xl">💎</span>
                </div>

                <h3 className="font-bold text-white">
                  {product.name}
                </h3>

                <p className="mt-1 text-xs text-white/45">
                  {product.length} • {product.category}
                </p>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase text-white/40">
                      Supplier
                    </p>
                    <p className="text-sm font-bold text-white">
                      {formatNGN(product.supplierPrice)}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-emerald-300">
                    Up to {formatNGN(product.premiumSellingPrice)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-purple-400/20 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                Business Growth
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Build your beauty empire
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Start with affordable stock, complete customer orders,
                increase your reputation and unlock higher-value beauty
                opportunities.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setScreen("orders")}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:scale-[1.02]"
            >
              Start Selling
            </button>
          </div>
        </section>
      </div>
    );
  };

  const renderSuppliers = () => (
    <div>
      <SectionHeading
        eyebrow="Supplier Network"
        title="Choose your suppliers"
        description="Different suppliers offer different prices, reliability and profit opportunities."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((supplier) => {
          const supplierProducts = getBeautyProductsBySupplier(
            supplier.id
          );

          return (
            <div
              key={supplier.id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-purple-400/30"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">
                    {supplier.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/45">
                    📍 {supplier.location}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getSupplierTierStyle(
                    supplier.tier
                  )}`}
                >
                  {supplier.tier}
                </span>
              </div>

              <p className="mb-5 text-sm leading-6 text-white/60">
                {supplier.description}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <MiniStat
                  label="Reliability"
                  value={`${supplier.reliability}%`}
                />
                <MiniStat
                  label="Delivery"
                  value={`${supplier.deliveryDays}d`}
                />
                <MiniStat
                  label="Fee"
                  value={`${supplier.marketplaceFeePercent}%`}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setSupplierFilter(supplier.id);
                  setScreen("products");
                }}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-purple-500/10"
              >
                Browse {supplierProducts.length} Products →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div>
      <SectionHeading
        eyebrow="Beauty Stock"
        title="Shop beauty products"
        description="Source stock from Abuja suppliers and resell it to customers for profit."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <select
          value={supplierFilter}
          onChange={(event) => setSupplierFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-bold text-white outline-none"
        >
          <option value="all">All Suppliers</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>

        <select
          value={productFilter}
          onChange={(event) => setProductFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-bold text-white outline-none"
        >
          <option value="all">All Categories</option>
          <option value="human-hair">Human Hair</option>
          <option value="frontal">Frontal</option>
          <option value="closure">Closure</option>
          <option value="bone-straight">Bone Straight</option>
          <option value="curly">Curly</option>
          <option value="water-wave">Water Wave</option>
          <option value="colored">Colored</option>
          <option value="luxury">Luxury</option>
        </select>

        {(supplierFilter !== "all" || productFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSupplierFilter("all");
              setProductFilter("all");
              setSelectedSupplier(null);
            }}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => {
          const supplier = getBeautySupplier(product.supplierId);

          const expectedProfit = calculateBeautyProfit({
            supplierCost: product.supplierPrice,
            sellingPrice: product.recommendedSellingPrice,
            deliveryFee: 2500,
            marketplaceFeePercent:
              supplier?.marketplaceFeePercent ?? 0,
          });

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => openProduct(product)}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-purple-500/[0.04]"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getSupplierTierStyle(
                    product.tier
                  )}`}
                >
                  {product.tier}
                </span>

                <span className="text-2xl">💇🏾‍♀️</span>
              </div>

              <h3 className="font-black text-white">
                {product.name}
              </h3>

              <p className="mt-1 text-xs text-white/45">
                {product.length} • {product.category}
              </p>

              <p className="mt-3 text-xs text-white/40">
                {supplier?.name}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <PriceBox
                  label="Buy"
                  value={formatNGN(product.supplierPrice)}
                />

                <PriceBox
                  label="Sell"
                  value={formatNGN(product.recommendedSellingPrice)}
                />
              </div>

              <div className="mt-3 rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
                  Estimated Profit
                </p>
                <p className="mt-1 font-black text-emerald-300">
                  {formatNGN(expectedProfit)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <EmptyState
          icon="🔎"
          title="No products found"
          description="Try another supplier or category."
        />
      )}
    </div>
  );

  const renderProduct = () => {
    if (!selectedProduct) return null;

    const supplier = getBeautySupplier(selectedProduct.supplierId);

    const totalCost = selectedProduct.supplierPrice * quantity;

    const estimatedProfit = calculateBeautyProfit({
      supplierCost: selectedProduct.supplierPrice * quantity,
      sellingPrice: sellingPrice * quantity,
      deliveryFee: 2500,
      marketplaceFeePercent:
        supplier?.marketplaceFeePercent ?? 0,
    });

    return (
      <div>
        <button
          type="button"
          onClick={() => setScreen("products")}
          className="mb-5 text-sm font-bold text-white/50 hover:text-white"
        >
          ← Back to products
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/40 to-black p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getSupplierTierStyle(
                    selectedProduct.tier
                  )}`}
                >
                  {selectedProduct.tier}
                </span>

                <h2 className="mt-4 text-3xl font-black text-white">
                  {selectedProduct.name}
                </h2>

                <p className="mt-2 text-sm text-white/50">
                  {selectedProduct.length} •{" "}
                  {selectedProduct.category}
                </p>
              </div>

              <div className="text-4xl">💎</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBox
                label="Supplier"
                value={supplier?.name ?? "Unknown"}
              />
              <InfoBox
                label="Location"
                value={supplier?.location ?? "Abuja"}
              />
              <InfoBox
                label="Supplier Price"
                value={formatNGN(selectedProduct.supplierPrice)}
              />
              <InfoBox
                label="Recommended Price"
                value={formatNGN(
                  selectedProduct.recommendedSellingPrice
                )}
              />
              <InfoBox
                label="Premium Price"
                value={formatNGN(
                  selectedProduct.premiumSellingPrice
                )}
              />
              <InfoBox
                label="Stock Condition"
                value={selectedProduct.condition}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-black uppercase tracking-widest text-purple-300">
              Purchase Stock
            </p>

            <h3 className="mt-2 text-2xl font-black text-white">
              Add to your inventory
            </h3>

            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                Quantity
              </label>

              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.max(1, value - 1))
                  }
                  className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 text-xl font-black text-white"
                >
                  −
                </button>

                <div className="flex h-12 flex-1 items-center justify-center rounded-xl border border-white/10 bg-black font-black text-white">
                  {quantity}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => value + 1)
                  }
                  className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 text-xl font-black text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                Your Selling Price
              </label>

              <input
                type="number"
                min={selectedProduct.recommendedSellingPrice}
                value={sellingPrice}
                onChange={(event) =>
                  setSellingPrice(
                    Math.max(
                      selectedProduct.recommendedSellingPrice,
                      Number(event.target.value) || 0
                    )
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 font-bold text-white outline-none focus:border-purple-400/50"
              />
            </div>

            <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
              <Row
                label="Stock cost"
                value={formatNGN(totalCost)}
              />

              <Row
                label="Customer selling price"
                value={formatNGN(sellingPrice * quantity)}
              />

              <Row
                label="Estimated profit"
                value={formatNGN(estimatedProfit)}
                highlight
              />
            </div>

            <button
              type="button"
              onClick={handleBuyStock}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-4 text-sm font-black text-white shadow-xl shadow-purple-500/20 transition hover:scale-[1.01]"
            >
              Buy Stock — {formatNGN(totalCost)}
            </button>

            <p className="mt-3 text-center text-xs text-white/35">
              Your current cash:{" "}
              {formatNGN(player?.cash ?? business.cash)}
            </p>
          </section>
        </div>
      </div>
    );
  };

  const renderOrders = () => (
    <div>
      <SectionHeading
        eyebrow="Customer Business"
        title="Customer orders"
        description="Accept orders, purchase the required stock, then deliver to collect your revenue and profit."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((order) => {
          const status = orderStates[order.id] ?? order.status;
          const product = products.find(
            (item) => item.id === order.productId
          );

          return (
            <div
              key={order.id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusStyle(
                      status
                    )}`}
                  >
                    {status.replace("-", " ")}
                  </span>

                  <h3 className="mt-4 text-xl font-black text-white">
                    {order.customerName}
                  </h3>

                  <p className="mt-1 text-xs text-white/45">
                    📍 {order.location}
                  </p>
                </div>

                {order.isVIP && (
                  <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase text-yellow-300">
                    VIP
                  </span>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-white/40">
                  Requested Product
                </p>

                <p className="mt-1 font-black text-white">
                  {product?.name ?? order.productId}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MiniStat
                    label="Customer Pays"
                    value={formatNGN(order.sellingPrice)}
                  />

                  <MiniStat
                    label="Delivery"
                    value={formatNGN(order.deliveryFee)}
                  />

                  <MiniStat
                    label="Expected Profit"
                    value={formatNGN(order.expectedProfit)}
                  />

                  <MiniStat
                    label="Deadline"
                    value={formatTime(order.deadlineSeconds)}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openOrder(order)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
                >
                  View
                </button>

                {status === "pending" && (
                  <button
                    type="button"
                    onClick={() => acceptOrder(order)}
                    className="flex-1 rounded-2xl bg-purple-500 px-4 py-3 text-sm font-black text-white hover:bg-purple-400"
                  >
                    Accept
                  </button>
                )}

                {status === "accepted" && (
                  <button
                    type="button"
                    onClick={() => buyOrderStock(order)}
                    className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-black hover:bg-cyan-400"
                  >
                    Buy Stock
                  </button>
                )}

                {status === "stock-purchased" && (
                  <button
                    type="button"
                    onClick={() => deliverOrder(order)}
                    className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400"
                  >
                    Deliver
                  </button>
                )}

                {status === "delivered" && (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300">
                    ✓ Completed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderOrder = () => {
    if (!selectedOrder) return null;

    const status =
      orderStates[selectedOrder.id] ?? selectedOrder.status;

    const product = products.find(
      (item) => item.id === selectedOrder.productId
    );

    const supplier = product
      ? getBeautySupplier(product.supplierId)
      : undefined;

    return (
      <div>
        <button
          type="button"
          onClick={() => setScreen("orders")}
          className="mb-5 text-sm font-bold text-white/50 hover:text-white"
        >
          ← Back to customer orders
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusStyle(
                    status
                  )}`}
                >
                  {status.replace("-", " ")}
                </span>

                <h2 className="mt-4 text-3xl font-black text-white">
                  {selectedOrder.customerName}
                </h2>

                <p className="mt-2 text-sm text-white/50">
                  📍 {selectedOrder.location}
                </p>
              </div>

              {selectedOrder.isVIP && (
                <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-xs font-black text-yellow-300">
                  👑 VIP CUSTOMER
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-purple-400/20 bg-purple-400/5 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-purple-300">
                Customer Request
              </p>

              <p className="mt-2 text-sm leading-7 text-white/70">
                {selectedOrder.description}
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoBox
                label="Product"
                value={product?.name ?? selectedOrder.productId}
              />

              <InfoBox
                label="Supplier"
                value={supplier?.name ?? "Unknown"}
              />

              <InfoBox
                label="Stock Cost"
                value={formatNGN(selectedOrder.supplierCost)}
              />

              <InfoBox
                label="Selling Price"
                value={formatNGN(selectedOrder.sellingPrice)}
              />

              <InfoBox
                label="Delivery Fee"
                value={formatNGN(selectedOrder.deliveryFee)}
              />

              <InfoBox
                label="Expected Profit"
                value={formatNGN(selectedOrder.expectedProfit)}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-purple-300">
              Order Workflow
            </p>

            <div className="mt-5 space-y-3">
              <WorkflowStep
                number="1"
                title="Accept Order"
                active={status === "pending"}
                complete={
                  status !== "pending"
                }
              />

              <WorkflowStep
                number="2"
                title="Purchase Supplier Stock"
                active={status === "accepted"}
                complete={
                  status === "stock-purchased" ||
                  status === "delivered"
                }
              />

              <WorkflowStep
                number="3"
                title="Prepare & Deliver"
                active={status === "stock-purchased"}
                complete={status === "delivered"}
              />
            </div>

            <div className="mt-6">
              {status === "pending" && (
                <button
                  type="button"
                  onClick={() => acceptOrder(selectedOrder)}
                  className="w-full rounded-2xl bg-purple-500 px-5 py-4 font-black text-white"
                >
                  Accept Customer Order
                </button>
              )}

              {status === "accepted" && (
                <button
                  type="button"
                  onClick={() => buyOrderStock(selectedOrder)}
                  className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black"
                >
                  Purchase Required Stock
                </button>
              )}

              {status === "stock-purchased" && (
                <button
                  type="button"
                  onClick={() => deliverOrder(selectedOrder)}
                  className="w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black"
                >
                  Complete & Deliver Order
                </button>
              )}

              {status === "delivered" && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-center">
                  <div className="text-3xl">🎉</div>
                  <p className="mt-2 font-black text-emerald-300">
                    Order Completed
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    Revenue and business profit have been added.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  };

  if (!player) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-white/10 bg-black">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />
          <p className="mt-4 text-sm text-white/50">
            Loading your beauty business...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {notice && (
        <div
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
            notice.type === "success"
              ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-200"
              : notice.type === "error"
              ? "border-red-400/30 bg-red-950/90 text-red-200"
              : "border-blue-400/30 bg-blue-950/90 text-blue-200"
          }`}
        >
          <p className="text-sm font-bold">{notice.message}</p>
        </div>
      )}

      {renderHeader()}
      {renderNavigation()}

      {screen === "home" && renderHome()}
      {screen === "suppliers" && renderSuppliers()}
      {screen === "products" && renderProducts()}
      {screen === "product" && renderProduct()}
      {screen === "orders" && renderOrders()}
      {screen === "order" && renderOrder()}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  description,
  button,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-purple-400/30">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black text-white">
        {title}
      </h3>

      <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/50">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white hover:bg-purple-500/10"
      >
        {button} →
      </button>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-black uppercase tracking-widest text-purple-300">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-3xl font-black text-white">
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
        {description}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black text-white">
        {value}
      </p>
    </div>
  );
}

function PriceBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black capitalize text-white">
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-white/45">{label}</span>

      <span
        className={`text-sm font-black ${
          highlight ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  active,
  complete,
}: {
  number: string;
  title: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 ${
        complete
          ? "border-emerald-400/20 bg-emerald-400/5"
          : active
          ? "border-purple-400/30 bg-purple-400/10"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
          complete
            ? "bg-emerald-400 text-black"
            : active
            ? "bg-purple-500 text-white"
            : "bg-white/10 text-white/40"
        }`}
      >
        {complete ? "✓" : number}
      </div>

      <span
        className={`text-sm font-bold ${
          complete
            ? "text-emerald-300"
            : active
            ? "text-white"
            : "text-white/40"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-4 font-black text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/45">{description}</p>
    </div>
  );
}
