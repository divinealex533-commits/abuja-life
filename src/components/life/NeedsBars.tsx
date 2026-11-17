"use client";

import { NEEDS, type Needs } from "@/lib/life/needs";

function barTone(value: number) {
  if (value >= 60) return "from-emerald-400 to-lime-300";
  if (value >= 30) return "from-amber-400 to-yellow-300";
  return "from-red-500 to-orange-400";
}

/** Coloured need bars. `compact` is for the phone and small spaces. */
export default function NeedsBars({
  needs,
  energy,
  maxEnergy,
  compact = false,
}: {
  needs: Needs;
  energy: number;
  maxEnergy: number;
  compact?: boolean;
}) {
  const energyPct = maxEnergy > 0 ? Math.round((energy / maxEnergy) * 100) : 0;
  const rows = [
    { id: "energy", label: "Energy", icon: "⚡", value: energyPct },
    ...NEEDS.map((n) => ({ id: n.id, label: n.label, icon: n.icon, value: Math.round(needs[n.id as keyof Needs]) })),
  ];

  return (
    <div className={compact ? "grid grid-cols-5 gap-1.5" : "grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5"}>
      {rows.map((row) => {
        const low = row.value < 25;
        return (
          <div key={row.id} title={`${row.label}: ${row.value}%`}>
            <div className={`flex items-center justify-between ${compact ? "text-[10px]" : "text-xs"} font-bold`}>
              <span className={low ? "animate-pulse text-red-300" : "text-white/70"}>
                {row.icon} {compact ? "" : row.label}
              </span>
              <span className={low ? "text-red-300" : "text-white/50"}>{row.value}</span>
            </div>
            <div className={`mt-1 overflow-hidden rounded-full bg-white/10 ${compact ? "h-1.5" : "h-2.5"}`}>
              <div
                className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ${barTone(row.value)}`}
                style={{ width: `${Math.max(3, row.value)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
