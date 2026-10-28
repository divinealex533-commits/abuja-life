"use client";

import MakeupArtistPanel from "@/components/game/MakeupArtistPanel";

export default function MakeupArtistPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <MakeupArtistPanel />

        <div className="mt-6 flex justify-center">
          <a
            href="/beauty-marketplace"
            className="rounded-2xl border border-purple-400/30 bg-purple-500/10 px-6 py-3 text-sm font-black text-purple-300 transition hover:bg-purple-500/20 hover:text-white"
          >
            💎 Open Beauty Marketplace
          </a>
        </div>
      </div>
    </main>
  );
}
