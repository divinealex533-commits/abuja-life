"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  addItem,
  getInventoryCount,
  getInventoryItem,
  getInventoryItemsByCategory,
  getInventoryValue,
  loadInventory,
  removeItem,
  saveInventory,
  useItem,
  type InventoryCategory,
  type OwnedInventoryItem,
} from "@/lib/game/inventory";

const CATEGORIES: Array<{
  id: "all" | InventoryCategory;
  label: string;
  icon: string;
}> = [
  {
    id: "all",
    label: "All Items",
    icon: "🎒",
  },
  {
    id: "clothing",
    label: "Clothing",
    icon: "👕",
  },
  {
    id: "food",
    label: "Food",
    icon: "🍛",
  },
  {
    id: "electronics",
    label: "Electronics",
    icon: "📱",
  },
  {
    id: "tools",
    label: "Tools",
    icon: "🧰",
  },
  {
    id: "vehicle",
    label: "Vehicle",
    icon: "🚗",
  },
  {
    id: "property",
    label: "Property",
    icon: "🏠",
  },
  {
    id: "business",
    label: "Business",
    icon: "💼",
  },
  {
    id: "event",
    label: "Events",
    icon: "🎟️",
  },
  {
    id: "collectible",
    label: "Collectibles",
    icon: "🏆",
  },
  {
    id: "special",
    label: "Special",
    icon: "✨",
  },
];

function formatMoney(value: number) {
  return `₦${value.toLocaleString()}`;
}

function getRarityStyle(rarity: string) {
  switch (rarity) {
    case "legendary":
      return "border-yellow-400/40 bg-yellow-400/10 text-yellow-300";

    case "epic":
      return "border-purple-400/40 bg-purple-400/10 text-purple-300";

    case "rare":
      return "border-blue-400/40 bg-blue-400/10 text-blue-300";

    case "uncommon":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";

    default:
      return "border-white/10 bg-white/5 text-white/50";
  }
}

function getConditionStyle(condition: number) {
  if (condition >= 80) {
    return "text-emerald-300";
  }

  if (condition >= 50) {
    return "text-yellow-300";
  }

  if (condition >= 25) {
    return "text-orange-300";
  }

  return "text-red-300";
}

export default function InventoryPage() {
  const [inventory, setInventory] =
    useState<OwnedInventoryItem[]>([]);

  const [category, setCategory] = useState<
    "all" | InventoryCategory
  >("all");

  const [selectedItemId, setSelectedItemId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  useEffect(() => {
    setInventory(loadInventory());

    function handleInventoryUpdate() {
      setInventory(loadInventory());
    }

    window.addEventListener(
      "abujaLifeInventoryUpdated",
      handleInventoryUpdate
    );

    return () => {
      window.removeEventListener(
        "abujaLifeInventoryUpdated",
        handleInventoryUpdate
      );
    };
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  const filteredInventory = useMemo(() => {
    if (category === "all") {
      return inventory;
    }

    const categoryItems = new Set(
      getInventoryItemsByCategory(category).map(
        (item) => item.id
      )
    );

    return inventory.filter((owned) =>
      categoryItems.has(owned.itemId)
    );
  }, [inventory, category]);

  const selectedItem = selectedItemId
    ? getInventoryItem(selectedItemId)
    : undefined;

  const selectedOwned = selectedItemId
    ? inventory.find(
        (item) => item.itemId === selectedItemId
      )
    : undefined;

  const inventoryValue = useMemo(
    () => getInventoryValue(),
    [inventory]
  );

  const itemCount = useMemo(
    () => getInventoryCount(),
    [inventory]
  );

  const uniqueItemCount = inventory.length;

  function refreshInventory() {
    setInventory(loadInventory());
  }

  function handleUse(itemId: string) {
    const item = getInventoryItem(itemId);

    if (!item) {
      return;
    }

    if (!item.usable) {
      setMessage(
        `${item.name} cannot be used right now.`
      );
      return;
    }

    const success = useItem(itemId);

    if (!success) {
      setMessage(
        `You don't have ${item.name} available to use.`
      );
      return;
    }

    refreshInventory();

    setMessage(`${item.name} used successfully.`);

    setSelectedItemId(null);
  }

  function handleRemove(itemId: string) {
    const item = getInventoryItem(itemId);

    if (!item) {
      return;
    }

    const success = removeItem(itemId, 1);

    if (!success) {
      setMessage(
        `Unable to remove ${item.name}.`
      );
      return;
    }

    refreshInventory();

    setMessage(
      `1 × ${item.name} removed from inventory.`
    );

    const remaining = loadInventory().find(
      (owned) => owned.itemId === itemId
    );

    if (!remaining) {
      setSelectedItemId(null);
    }
  }

  function handlePreviewItem() {
    const success = addItem(
      "designer-outfit",
      1
    );

    if (!success) {
      setMessage(
        "Designer Outfit could not be added. You may already own it."
      );
      return;
    }

    refreshInventory();

    setMessage(
      "Designer Outfit added to your inventory."
    );
  }

  function handleClearPreview() {
    saveInventory([]);
    refreshInventory();
    setSelectedItemId(null);
    setMessage("Inventory cleared.");
  }

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07110f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-xl font-black">
              ABUJA{" "}
              <span className="text-emerald-400">
                LIFE
              </span>
            </div>

            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Inventory
            </div>
          </div>

          <Link
            href="/game"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold transition hover:bg-white/10"
          >
            ← Back to City
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* TITLE */}
        <section className="mb-6">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
            Your belongings
          </div>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            Inventory
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Everything you collect throughout Abuja
            appears here. Manage your clothing, food,
            electronics, tools, property items, event
            rewards and rare collectibles.
          </p>
        </section>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
            {message}
          </div>
        )}

        {/* STATS */}
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs text-white/40">
              TOTAL ITEMS
            </div>

            <div className="mt-2 text-2xl font-black">
              {itemCount}
            </div>

            <div className="mt-1 text-xs text-white/30">
              Including stacked quantities
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs text-white/40">
              UNIQUE ITEMS
            </div>

            <div className="mt-2 text-2xl font-black">
              {uniqueItemCount}
            </div>

            <div className="mt-1 text-xs text-white/30">
              Different items owned
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs text-white/40">
              INVENTORY VALUE
            </div>

            <div className="mt-2 text-2xl font-black text-emerald-300">
              {formatMoney(inventoryValue)}
            </div>

            <div className="mt-1 text-xs text-white/30">
              Current item value
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs text-white/40">
              CATEGORIES
            </div>

            <div className="mt-2 text-2xl font-black">
              {CATEGORIES.length - 1}
            </div>

            <div className="mt-1 text-xs text-white/30">
              Item categories available
            </div>
          </div>
        </section>

        {/* CATEGORY FILTER */}
        <section className="mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setCategory(item.id)
                }
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                  category === item.id
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* INVENTORY GRID */}
        {filteredInventory.length > 0 ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredInventory.map((owned) => {
              const item = getInventoryItem(
                owned.itemId
              );

              if (!item) {
                return null;
              }

              return (
                <button
                  key={owned.itemId}
                  type="button"
                  onClick={() =>
                    setSelectedItemId(
                      owned.itemId
                    )
                  }
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-5xl">
                      {item.icon}
                    </div>

                    <div
                      className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase ${getRarityStyle(
                        item.rarity
                      )}`}
                    >
                      {item.rarity}
                    </div>
                  </div>

                  <div className="mt-5">
                    <h2 className="font-black">
                      {item.name}
                    </h2>

                    <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
                      {item.category}
                    </div>

                    <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/40">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-white/30">
                        QUANTITY
                      </div>

                      <div className="mt-1 font-black">
                        ×{owned.quantity}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-white/30">
                        VALUE
                      </div>

                      <div className="mt-1 font-black text-emerald-300">
                        {formatMoney(
                          item.value *
                            owned.quantity
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="text-white/30">
                        CONDITION
                      </span>

                      <span
                        className={`font-black ${getConditionStyle(
                          owned.condition
                        )}`}
                      >
                        {owned.condition}%
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              owned.condition
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </section>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="text-5xl">🎒</div>

            <h2 className="mt-4 text-xl font-black">
              Nothing here yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Explore Abuja, visit businesses, complete
              jobs and participate in city events to
              collect items.
            </p>

            <Link
              href="/game"
              className="mt-6 inline-flex rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-300"
            >
              Explore Abuja
            </Link>
          </div>
        )}

        {/* TEMPORARY DEVELOPMENT PREVIEW */}
        <section className="mt-8 rounded-3xl border border-yellow-400/10 bg-yellow-400/[0.03] p-5">
          <div className="text-xs font-black uppercase tracking-widest text-yellow-300">
            Inventory Development Preview
          </div>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-white/40">
            Temporary development controls only.
            Later, shops, businesses, jobs and city
            events will be responsible for adding items.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePreviewItem}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              + Add Designer Outfit
            </button>

            <button
              type="button"
              onClick={handleClearPreview}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Clear Inventory
            </button>
          </div>
        </section>
      </div>

      {/* ITEM MODAL */}
      {selectedItem && selectedOwned && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm md:items-center"
          onClick={() =>
            setSelectedItemId(null)
          }
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d1b17] p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-5xl">
                  {selectedItem.icon}
                </div>

                <h2 className="mt-4 text-2xl font-black">
                  {selectedItem.name}
                </h2>

                <div
                  className={`mt-2 inline-block rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getRarityStyle(
                    selectedItem.rarity
                  )}`}
                >
                  {selectedItem.rarity}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedItemId(null)
                }
                className="rounded-xl bg-white/5 px-3 py-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-white/60">
              {selectedItem.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <div className="text-[10px] text-white/30">
                  ITEM VALUE
                </div>

                <div className="mt-1 font-black text-emerald-300">
                  {formatMoney(
                    selectedItem.value
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <div className="text-[10px] text-white/30">
                  QUANTITY
                </div>

                <div className="mt-1 font-black">
                  ×{selectedOwned.quantity}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <div className="text-[10px] text-white/30">
                  CONDITION
                </div>

                <div
                  className={`mt-1 font-black ${getConditionStyle(
                    selectedOwned.condition
                  )}`}
                >
                  {selectedOwned.condition}%
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <div className="text-[10px] text-white/30">
                  CATEGORY
                </div>

                <div className="mt-1 font-black capitalize">
                  {selectedItem.category}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white/5 p-4">
              <div className="text-[10px] font-black uppercase tracking-wider text-white/30">
                Tags
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-white/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {selectedItem.usable ? (
                <button
                  type="button"
                  onClick={() =>
                    handleUse(
                      selectedItem.id
                    )
                  }
                  className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-black transition hover:bg-emerald-300"
                >
                  ⚡ Use Item
                </button>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-bold text-white/40">
                  Item is not usable
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  handleRemove(
                    selectedItem.id
                  )
                }
                className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 font-black text-red-300 transition hover:bg-red-400/20"
              >
                Remove 1 Item
              </button>
            </div>

            <div className="mt-4 text-center text-[10px] text-white/20">
              Acquired{" "}
              {new Date(
                selectedOwned.acquiredAt
              ).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}