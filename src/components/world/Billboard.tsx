"use client";

import { useEffect, useState } from "react";

export interface BillboardData {
  id: string;
  advertiser: string;
  headline: string;
  subtext: string;
  link_url: string | null;
  color: string;
  slot: number;
}

let cache: Promise<BillboardData[]> | null = null;

/** Active billboards, fetched once per page load. */
export function useBillboards(): BillboardData[] {
  const [boards, setBoards] = useState<BillboardData[]>([]);
  useEffect(() => {
    cache ??= fetch("/api/billboards")
      .then((r) => r.json())
      .then((d) => (Array.isArray(d.billboards) ? d.billboards : []))
      .catch(() => []);
    let alive = true;
    cache.then((b) => alive && setBoards(b));
    return () => {
      alive = false;
    };
  }, []);
  return boards;
}

/** A single lit billboard face. */
export function BillboardFace({ board, compact = false }: { board: BillboardData; compact?: boolean }) {
  const inner = (
    <div
      className={`relative overflow-hidden rounded-xl border-4 border-slate-800 text-left shadow-2xl ${compact ? "p-3" : "p-4"}`}
      style={{ background: `linear-gradient(135deg, ${board.color}, #111827 140%)` }}
    >
      <div className="absolute right-2 top-1.5 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/80">
        Ad
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/75">{board.advertiser}</div>
      <div className={`font-black leading-tight text-white drop-shadow ${compact ? "text-base" : "text-xl"}`}>
        {board.headline}
      </div>
      {board.subtext && <div className="mt-0.5 text-xs font-semibold text-white/85">{board.subtext}</div>}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-60" />
    </div>
  );
  return board.link_url ? (
    <a href={board.link_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}

/** Row of billboards for the game screen. Hidden when none are rented. */
export function BillboardStrip() {
  const boards = useBillboards();
  if (boards.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {boards.map((b) => (
          <div key={b.id} className="w-64 shrink-0 snap-start">
            <BillboardFace board={b} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
