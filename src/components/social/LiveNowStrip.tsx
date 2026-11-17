"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import CharacterAvatar from "@/components/character/CharacterAvatar";
import { getPlatform } from "@/lib/social/platforms";

interface LivePlayer {
  id: string;
  username: string;
  displayName: string;
  appearance: unknown;
  platform: string;
  title: string;
  watchUrl: string;
}

/** "Live now" board on the game screen: players streaming right now. */
export default function LiveNowStrip() {
  const [live, setLive] = useState<LivePlayer[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/socials", { cache: "no-store" });
      const data = await res.json();
      setLive(Array.isArray(data.live) ? data.live : []);
      setIsAdmin(Boolean(data.isAdmin));
    } catch {
      // Live board is optional; stay quiet if it fails.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60_000);
    window.addEventListener("abujaLifeLiveUpdated", load);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("abujaLifeLiveUpdated", load);
    };
  }, [load]);

  async function stop(playerId: string) {
    await fetch("/api/socials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "admin-end-live", playerId }),
    });
    load();
  }

  if (!ready) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="rounded-3xl border border-red-500/25 bg-gradient-to-r from-red-950/60 via-[#140b1f] to-[#0b1220] p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            Live now in Abuja
          </h2>
          <Link href="/profile" className="text-xs font-bold text-pink-300 hover:text-pink-200">
            {live.length ? "Go live too →" : "Be the first to go live →"}
          </Link>
        </div>

        {live.length === 0 ? (
          <p className="mt-3 text-sm text-white/45">
            No one is streaming right now. Link your TikTok on your profile and press Go Live.
          </p>
        ) : (
          <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-1">
            {live.map((p) => {
              const platform = getPlatform(p.platform);
              return (
                <div
                  key={p.id}
                  className="relative w-36 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40"
                >
                  <a href={p.watchUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="flex h-28 items-end justify-center bg-gradient-to-b from-fuchsia-500/25 to-transparent">
                      <CharacterAvatar appearance={p.appearance as never} size={104} />
                    </div>
                    <span className="absolute left-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      Live
                    </span>
                    <div className="p-2.5">
                      <div className="truncate text-sm font-black">{p.displayName}</div>
                      <div className="truncate text-[11px] text-white/50">{p.title || `@${p.username}`}</div>
                      <div className="mt-2 rounded-lg bg-white/10 py-1.5 text-center text-[11px] font-black">
                        {platform?.icon} Watch on {platform?.label}
                      </div>
                    </div>
                  </a>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => stop(p.id)}
                      className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white/80 hover:bg-black"
                      title="Admin: remove from Live Now"
                    >
                      Stop
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
