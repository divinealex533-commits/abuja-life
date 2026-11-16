"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AD_PLANS,
  categoryInfo,
  districtLabel,
  whatsappLink,
  type PublicListing,
} from "@/lib/business/catalog";
import { syncPlayerSnapshot } from "@/lib/vip/client";

function trackContact(listingId: string) {
  void fetch("/api/businesses/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, action: "contact" }),
    keepalive: true,
  });
}

export function BusinessCard({ listing }: { listing: PublicListing }) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const plan = AD_PLANS[listing.plan];
  const premium = listing.plan === "premium";

  async function checkIn() {
    setBusy(true);
    setMessage(null);
    try {
      const r = await fetch("/api/businesses/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, action: "visit" }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        setMessage({ text: d?.error || "Couldn't check in.", ok: false });
      } else {
        if (d?.player) syncPlayerSnapshot(d.player);
        setMessage({ text: `Checked in! ${d.rewardText}`, ok: true });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`flex flex-col rounded-3xl border p-5 ${
        premium
          ? "border-amber-400/40 bg-gradient-to-br from-amber-400/[0.12] to-black/40"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">{listing.emoji}</div>
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${premium ? "bg-amber-400 text-black" : "bg-white/10 text-white/60"}`}>
          {plan.badge}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-black">{listing.name}</h3>
      <div className="text-xs font-bold text-white/45">
        {categoryInfo(listing.category).emoji} {categoryInfo(listing.category).label} · 📍 {districtLabel(listing.district)}
      </div>
      <p className="mt-2 flex-1 text-sm leading-6 text-white/65">{listing.description}</p>
      {listing.address && <p className="mt-2 text-xs text-white/45">🏠 {listing.address}</p>}

      {listing.offerText && (
        <div className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200">
          🎁 {listing.offerText}
        </div>
      )}

      {message && (
        <div className={`mt-3 text-xs font-bold ${message.ok ? "text-emerald-300" : "text-red-300"}`}>{message.text}</div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={checkIn}
          className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-black hover:bg-emerald-300 disabled:opacity-50"
        >
          📍 CHECK IN
        </button>
        {listing.whatsapp && (
          <a
            href={whatsappLink(listing.whatsapp, listing.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackContact(listing.id)}
            className="rounded-xl bg-[#25D366] px-3 py-2 text-xs font-black text-black"
          >
            WhatsApp
          </a>
        )}
        {listing.phone && (
          <a href={`tel:${listing.phone.replace(/\s/g, "")}`} onClick={() => trackContact(listing.id)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black">
            Call
          </a>
        )}
        {listing.instagram && (
          <a
            href={`https://instagram.com/${listing.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackContact(listing.id)}
            className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black"
          >
            Instagram
          </a>
        )}
      </div>
    </article>
  );
}

/**
 * Real businesses that advertise in this district (or featured ones city-wide).
 *   <SponsoredBusinesses district="wuse-2" />
 *   <SponsoredBusinesses featured />
 */
export default function SponsoredBusinesses({
  district,
  featured = false,
  limit = 6,
  className = "",
}: {
  district?: string;
  featured?: boolean;
  limit?: number;
  className?: string;
}) {
  const [listings, setListings] = useState<PublicListing[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (district) params.set("district", district);
    if (featured) params.set("minPlan", "featured");

    fetch(`/api/businesses?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setListings(d?.listings ?? []))
      .catch(() => setListings([]));
  }, [district, featured, limit]);

  if (listings === null) return null;

  return (
    <section className={`rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 sm:p-8 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
            Real Abuja businesses
          </div>
          <h2 className="mt-1 text-2xl font-black">
            {featured ? "Featured places in Abuja" : `Places in ${district ? districtLabel(district) : "Abuja"}`}
          </h2>
          <p className="mt-1 text-sm text-white/45">Check in daily for energy and reputation. Show offers in-store.</p>
        </div>
        <div className="flex gap-3 text-xs font-black">
          <Link href="/directory" className="text-emerald-300">All businesses →</Link>
          <Link href="/advertise" className="text-amber-300">Advertise here</Link>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
          No businesses here yet.{" "}
          <Link href="/advertise" className="font-black text-amber-300">Own a business? Be the first →</Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <BusinessCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}
