"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BusinessCard } from "@/components/business/SponsoredBusinesses";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_DISTRICTS,
  type PublicListing,
} from "@/lib/business/catalog";

export default function DirectoryPage() {
  const [listings, setListings] = useState<PublicListing[] | null>(null);
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ limit: "50" });
    if (district) params.set("district", district);
    fetch(`/api/businesses?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setListings(d?.listings ?? []))
      .catch(() => setListings([]));
  }, [district]);

  const shown = useMemo(
    () => (listings ?? []).filter((l) => !category || l.category === category),
    [listings, category]
  );

  const select = "rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white";

  return (
    <main className="min-h-screen bg-[#06100c] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#06100c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/game" className="text-xs font-black text-white/60">← BACK TO GAME</Link>
          <div className="text-sm font-black">Abuja Business Directory</div>
          <Link href="/advertise" className="text-xs font-black text-amber-300">Advertise</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-black sm:text-4xl">Real places in Abuja</h1>
        <p className="mt-2 text-sm text-white/50">
          Restaurants, salons, boutiques and more. Check in every day for rewards, and show their offers in-store.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <select className={select} value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">All districts</option>
            {BUSINESS_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <select className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>

        {listings === null ? (
          <div className="mt-8 h-40 animate-pulse rounded-3xl bg-white/5" />
        ) : shown.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/15 p-10 text-center">
            <div className="text-4xl">🏪</div>
            <p className="mt-3 text-sm text-white/60">No businesses here yet.</p>
            <Link href="/advertise" className="mt-4 inline-block font-black text-amber-300">Own a business? Advertise →</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((listing) => (
              <BusinessCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
