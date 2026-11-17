"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import CharacterAvatar from "@/components/character/CharacterAvatar";
import type { Appearance } from "@/lib/character/appearance";
import { getLocationById } from "@/lib/game/locations";
import { loadPersistentPlayerState, loadPlayerState, savePersistentPlayerState } from "@/lib/game/player";
import { useLife } from "@/lib/life/client";
import { LIFE_ACTIVITIES, abujaClock, activityBlock, placeStatus } from "@/lib/life/needs";
import {
  CITY_SPOTS,
  ENTER_DISTANCE,
  ROADS,
  WORLD_SIZE,
  doorOf,
  spotFor,
  type CitySpot,
} from "@/lib/world/cityLayout";

const WALK_SPEED = 230; // world px per second
const RUN_SPEED = 420;
const POS_KEY = "abujaLifeCityPos";

// Deterministic scenery so server and browser match.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function onRoad(x: number, y: number) {
  return ROADS.some(([x1, y1, x2, y2]) =>
    x1 === x2 ? Math.abs(x - x1) < 60 && y >= y1 - 60 && y <= y2 + 60 : Math.abs(y - y1) < 60 && x >= x1 - 60 && x <= x2 + 60
  );
}

function insideSpot(x: number, y: number, pad = 40) {
  return CITY_SPOTS.some((s) => Math.abs(x - s.x) < s.w / 2 + pad && Math.abs(y - s.y) < s.h / 2 + pad);
}

const rand = seeded(7);
const TREES = Array.from({ length: 260 }, () => ({ x: rand() * WORLD_SIZE, y: rand() * WORLD_SIZE, s: 0.7 + rand() * 0.7 }))
  .filter((t) => !onRoad(t.x, t.y) && !insideSpot(t.x, t.y))
  .slice(0, 170);

const WALKERS = Array.from({ length: 18 }, (_, i) => {
  const [x1, y1, x2, y2] = ROADS[i % ROADS.length];
  const t = rand();
  return {
    x: x1 + (x2 - x1) * t + (x1 === x2 ? 40 : 0),
    y: y1 + (y2 - y1) * t + (y1 === y2 ? 40 : 0),
    dx: x1 === x2 ? 0 : 120 + rand() * 160,
    dy: y1 === y2 ? 0 : 120 + rand() * 160,
    dur: 6 + rand() * 8,
    emoji: ["🧍🏾", "🧍🏿‍♀️", "🚶🏾", "🚶🏽‍♀️", "🧍🏽‍♂️", "🚶🏿"][i % 6],
  };
});

export default function CityWalkPage() {
  const router = useRouter();
  const life = useLife();
  const worldRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const pos = useRef({ x: 1250, y: 1650 });
  const input = useRef({ x: 0, y: 0 });
  const keys = useRef(new Set<string>());
  const facing = useRef(1);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const [moving, setMoving] = useState(false);
  const [nearId, setNearId] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<Partial<Appearance> | null>(null);
  const [currentId, setCurrentId] = useState("garki");
  const [entering, setEntering] = useState(false);
  const [hour, setHour] = useState(12);

  // Joystick state
  const stickBase = useRef<{ x: number; y: number; id: number } | null>(null);
  const [stick, setStick] = useState<{ bx: number; by: number; kx: number; ky: number } | null>(null);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  // Start position: last spot on the street, or the door of where you are.
  useEffect(() => {
    const local = loadPlayerState();
    setCurrentId(local.currentLocationId);
    let start = (() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(POS_KEY) ?? "null");
        if (saved && typeof saved.x === "number") return saved as { x: number; y: number };
      } catch {
        // ignore
      }
      return null;
    })();
    if (!start) {
      const spot = spotFor(local.currentLocationId) ?? spotFor("garki")!;
      start = doorOf(spot);
    }
    pos.current = start;

    fetch("/api/character", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAppearance(d?.appearance ?? null))
      .catch(() => null);

    void loadPersistentPlayerState().then((p) => setCurrentId(p.currentLocationId));
    setHour(abujaClock().hour);
    const t = window.setInterval(() => setHour(abujaClock().hour), 60_000);
    return () => window.clearInterval(t);
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "shift"].includes(k)) {
        keys.current.add(k);
        if (k.startsWith("arrow")) e.preventDefault();
      }
      if (k === "e" || k === "enter") document.getElementById("city-enter")?.click();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Game loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let wasMoving = false;
    let lastNear: string | null = null;
    let saveTimer = 0;

    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      const k = keys.current;
      let ix = input.current.x;
      let iy = input.current.y;
      if (k.has("arrowleft") || k.has("a")) ix -= 1;
      if (k.has("arrowright") || k.has("d")) ix += 1;
      if (k.has("arrowup") || k.has("w")) iy -= 1;
      if (k.has("arrowdown") || k.has("s")) iy += 1;
      const len = Math.hypot(ix, iy);
      if (len > 1) {
        ix /= len;
        iy /= len;
      }
      const isMoving = len > 0.08;
      const speed = runningRef.current || k.has("shift") ? RUN_SPEED : WALK_SPEED;

      if (isMoving) {
        const nx = Math.max(40, Math.min(WORLD_SIZE - 40, pos.current.x + ix * speed * dt));
        const ny = Math.max(40, Math.min(WORLD_SIZE - 40, pos.current.y + iy * speed * dt));
        // Buildings are solid: slide along walls.
        const blockedX = insideSpot(nx, pos.current.y, -10);
        const blockedY = insideSpot(pos.current.x, ny, -10);
        if (!blockedX) pos.current.x = nx;
        if (!blockedY) pos.current.y = ny;
        if (Math.abs(ix) > 0.15) facing.current = ix < 0 ? -1 : 1;
        saveTimer += dt;
        if (saveTimer > 1) {
          saveTimer = 0;
          try {
            sessionStorage.setItem(POS_KEY, JSON.stringify(pos.current));
          } catch {
            // ignore
          }
        }
      }
      if (isMoving !== wasMoving) {
        wasMoving = isMoving;
        setMoving(isMoving);
      }

      // Camera
      const view = viewRef.current;
      if (view && worldRef.current && playerRef.current) {
        const vw = view.clientWidth;
        const vh = view.clientHeight;
        const cx = Math.max(0, Math.min(WORLD_SIZE - vw, pos.current.x - vw / 2));
        const cy = Math.max(0, Math.min(WORLD_SIZE - vh, pos.current.y - vh / 2));
        worldRef.current.style.transform = `translate3d(${-cx}px, ${-cy}px, 0)`;
        playerRef.current.style.transform = `translate3d(${pos.current.x - 40}px, ${pos.current.y - 100}px, 0)`;
        if (avatarRef.current) avatarRef.current.style.transform = `scaleX(${facing.current})`;
        playerRef.current.style.zIndex = String(Math.round(pos.current.y));
      }
      if (dotRef.current) {
        dotRef.current.style.left = `${(pos.current.x / WORLD_SIZE) * 100}%`;
        dotRef.current.style.top = `${(pos.current.y / WORLD_SIZE) * 100}%`;
      }

      // Nearest door
      let near: string | null = null;
      let best = ENTER_DISTANCE;
      for (const spot of CITY_SPOTS) {
        const d = doorOf(spot);
        const dist = Math.hypot(d.x - pos.current.x, d.y - pos.current.y);
        if (dist < best) {
          best = dist;
          near = spot.locationId;
        }
      }
      if (near !== lastNear) {
        lastNear = near;
        setNearId(near);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Touch joystick (anywhere on the left half of the screen)
  function onPointerDown(e: ReactPointerEvent) {
    if ((e.target as HTMLElement).closest("button,a")) return;
    stickBase.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setStick({ bx: e.clientX, by: e.clientY, kx: e.clientX, ky: e.clientY });
  }
  function onPointerMove(e: ReactPointerEvent) {
    const base = stickBase.current;
    if (!base || base.id !== e.pointerId) return;
    const dx = e.clientX - base.x;
    const dy = e.clientY - base.y;
    const dist = Math.min(56, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const kx = base.x + Math.cos(angle) * dist;
    const ky = base.y + Math.sin(angle) * dist;
    input.current = { x: (kx - base.x) / 56, y: (ky - base.y) / 56 };
    setStick({ bx: base.x, by: base.y, kx, ky });
  }
  function onPointerUp(e: ReactPointerEvent) {
    if (stickBase.current?.id !== e.pointerId) return;
    stickBase.current = null;
    input.current = { x: 0, y: 0 };
    setStick(null);
  }

  async function enter(locationId: string) {
    setEntering(true);
    try {
      sessionStorage.setItem(POS_KEY, JSON.stringify(pos.current));
    } catch {
      // ignore
    }
    const current = loadPlayerState();
    if (current.currentLocationId !== locationId) {
      await savePersistentPlayerState({ ...current, currentLocationId: locationId });
      window.dispatchEvent(new Event("abujaLifePlayerUpdated"));
    }
    router.push("/game");
  }

  const night = hour >= 19 || hour < 6;
  const dusk = hour === 18 || hour === 6;
  const nearSpot = nearId ? spotFor(nearId) : undefined;
  const nearLocation = nearId ? getLocationById(nearId) : undefined;
  const nearStatus = nearId ? placeStatus(nearId) : null;
  const nearActivities = useMemo(
    () =>
      nearId
        ? LIFE_ACTIVITIES.filter((a) => activityBlock(a, nearId) !== "Not available here").slice(0, 4)
        : [],
    [nearId]
  );

  return (
    <main
      ref={viewRef}
      className="fixed inset-0 touch-none select-none overflow-hidden bg-[#5f8f3e] text-white"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <style>{`
        @keyframes cw-walk{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes cw-car-x{from{transform:translateX(0)}to{transform:translateX(var(--d))}}
        @keyframes cw-car-y{from{transform:translateY(0)}to{transform:translateY(var(--d))}}
        @keyframes cw-npc{0%,100%{transform:translate(0,0)}50%{transform:translate(var(--dx),var(--dy))}}
        @keyframes cw-ripple{0%,100%{opacity:.25}50%{opacity:.6}}
        @keyframes cw-glow{0%,100%{opacity:.6}50%{opacity:1}}
        .cw-bob{animation:cw-walk .35s ease-in-out infinite}
      `}</style>

      {/* WORLD */}
      <div
        ref={worldRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{ width: WORLD_SIZE, height: WORLD_SIZE }}
      >
        {/* grass texture */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, #6fa04a 0, transparent 40%), radial-gradient(circle at 70% 60%, #57873a 0, transparent 45%), repeating-linear-gradient(45deg, #5f8f3e 0 18px, #64953f 18px 36px)",
          }}
        />

        {/* roads */}
        {ROADS.map(([x1, y1, x2, y2], i) => {
          const vertical = x1 === x2;
          const style = vertical
            ? { left: x1 - 28, top: y1, width: 56, height: y2 - y1 }
            : { left: x1, top: y1 - 28, width: x2 - x1, height: 56 };
          return (
            <div key={i} className="absolute bg-[#3b3f46] shadow-[0_0_0_6px_#c9c2b1]" style={style}>
              <div
                className="absolute opacity-70"
                style={
                  vertical
                    ? { left: 26, top: 0, bottom: 0, width: 4, backgroundImage: "repeating-linear-gradient(180deg,#fde68a 0 22px,transparent 22px 44px)" }
                    : { top: 26, left: 0, right: 0, height: 4, backgroundImage: "repeating-linear-gradient(90deg,#fde68a 0 22px,transparent 22px 44px)" }
                }
              />
            </div>
          );
        })}

        {/* cars */}
        {ROADS.slice(0, 7).map(([x1, y1, x2, y2], i) => {
          const vertical = x1 === x2;
          const length = vertical ? y2 - y1 : x2 - x1;
          return (
            <div
              key={`car${i}`}
              className="absolute text-3xl"
              style={
                {
                  left: vertical ? x1 - (i % 2 ? 22 : -2) : x1,
                  top: vertical ? y1 : y1 - (i % 2 ? 26 : 2),
                  "--d": `${length}px`,
                  animation: `${vertical ? "cw-car-y" : "cw-car-x"} ${9 + i * 1.7}s linear ${-i * 2}s infinite ${i % 2 ? "reverse" : "normal"}`,
                } as CSSProperties
              }
            >
              <span style={{ display: "inline-block", transform: vertical ? "rotate(90deg)" : i % 2 ? "scaleX(-1)" : "none" }}>
                {["🚕", "🚗", "🚌", "🛺", "🚙", "🏍️", "🚐"][i % 7]}
              </span>
            </div>
          );
        })}

        {/* trees */}
        {TREES.map((t, i) => (
          <div
            key={`t${i}`}
            className="absolute"
            style={{ left: t.x, top: t.y, fontSize: 30 * t.s, zIndex: Math.round(t.y) }}
          >
            {i % 5 === 0 ? "🌴" : "🌳"}
          </div>
        ))}

        {/* places */}
        {CITY_SPOTS.map((spot) => (
          <Building key={spot.locationId} spot={spot} night={night} highlight={spot.locationId === nearId} current={spot.locationId === currentId} />
        ))}

        {/* people */}
        {WALKERS.map((w, i) => (
          <div
            key={`w${i}`}
            className="absolute text-2xl"
            style={
              {
                left: w.x,
                top: w.y,
                zIndex: Math.round(w.y),
                "--dx": `${w.dx}px`,
                "--dy": `${w.dy}px`,
                animation: `cw-npc ${w.dur}s ease-in-out ${-i}s infinite`,
              } as CSSProperties
            }
          >
            {w.emoji}
          </div>
        ))}

        {/* me */}
        <div ref={playerRef} className="absolute left-0 top-0 h-[110px] w-20">
          <div ref={avatarRef}>
            <div className={moving ? "cw-bob" : ""}>
              <CharacterAvatar appearance={appearance} size={104} animated={!moving} />
            </div>
          </div>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-black">
            YOU
          </div>
        </div>
      </div>

      {/* day / night */}
      <div
        className="pointer-events-none absolute inset-0 transition-colors duration-[3000ms]"
        style={{
          background: night ? "rgba(8,12,40,0.55)" : dusk ? "rgba(120,50,20,0.22)" : "transparent",
          mixBlendMode: night ? "multiply" : "normal",
        }}
      />

      {/* HUD: top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex flex-col gap-2">
          <Link href="/game" className="rounded-2xl bg-black/60 px-3 py-2 text-xs font-black backdrop-blur">
            ← City menu
          </Link>
          <div className="rounded-2xl bg-black/60 px-3 py-2 text-xs font-black backdrop-blur">
            {life.moodInfo.emoji} {life.mood}% · ₦{Math.round(life.cash).toLocaleString()}
          </div>
        </div>

        {/* minimap */}
        <div className="pointer-events-none relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-white/30 bg-[#4b7a30]/90 shadow-xl">
          {ROADS.map(([x1, y1, x2, y2], i) => (
            <div
              key={i}
              className="absolute bg-white/40"
              style={{
                left: `${(Math.min(x1, x2) / WORLD_SIZE) * 100}%`,
                top: `${(Math.min(y1, y2) / WORLD_SIZE) * 100}%`,
                width: x1 === x2 ? 2 : `${((x2 - x1) / WORLD_SIZE) * 100}%`,
                height: y1 === y2 ? 2 : `${((y2 - y1) / WORLD_SIZE) * 100}%`,
              }}
            />
          ))}
          {CITY_SPOTS.map((s) => (
            <div
              key={s.locationId}
              className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm"
              style={{ left: `${(s.x / WORLD_SIZE) * 100}%`, top: `${(s.y / WORLD_SIZE) * 100}%`, background: s.color }}
            />
          ))}
          <div ref={dotRef} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-500 shadow" />
        </div>
      </div>

      {/* hint */}
      {!nearId && !stick && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 text-center text-xs font-bold text-white/80 drop-shadow">
          Drag anywhere to walk · walk up to a door to enter
        </div>
      )}

      {/* joystick */}
      {stick && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <div
            className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 bg-black/25"
            style={{ left: stick.bx, top: stick.by }}
          />
          <div
            className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-lg"
            style={{ left: stick.kx, top: stick.ky }}
          />
        </div>
      )}

      {/* run toggle */}
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        className={`absolute bottom-5 left-4 z-40 h-16 w-16 rounded-full border-2 text-2xl font-black shadow-xl ${
          running ? "border-amber-200 bg-amber-400 text-black" : "border-white/30 bg-black/60"
        }`}
        aria-label="Run"
      >
        🏃🏾
      </button>

      {/* enter card */}
      {nearSpot && nearLocation && nearStatus && (
        <div className="absolute inset-x-3 bottom-24 z-40 mx-auto max-w-sm rounded-3xl border border-white/15 bg-[#0b1020]/90 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nearLocation.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-black">{nearLocation.name}</div>
              <div className={`text-xs font-bold ${nearStatus.open ? "text-emerald-300" : "text-red-300"}`}>
                {nearStatus.open ? "● " : "○ "}
                {nearStatus.text}
              </div>
            </div>
          </div>
          {nearActivities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {nearActivities.map((a) => (
                <span key={a.id} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">
                  {a.icon} {a.label}
                </span>
              ))}
            </div>
          )}
          <button
            id="city-enter"
            type="button"
            disabled={entering}
            onClick={() => enter(nearSpot.locationId)}
            className="mt-3 w-full rounded-2xl border-b-4 border-orange-800 bg-gradient-to-b from-amber-300 to-orange-500 py-3 font-black uppercase tracking-wider text-black active:translate-y-0.5 active:border-b-2 disabled:opacity-60"
          >
            {entering ? "Going in..." : `Enter ${nearLocation.name}`}
          </button>
        </div>
      )}
    </main>
  );
}

function Building({ spot, night, highlight, current }: { spot: CitySpot; night: boolean; highlight: boolean; current: boolean }) {
  const location = getLocationById(spot.locationId);
  const status = placeStatus(spot.locationId);
  const left = spot.x - spot.w / 2;
  const top = spot.y - spot.h / 2;
  const lit = night && status.open;

  let body: ReactNode;
  switch (spot.kind) {
    case "lake":
      body = (
        <div className="absolute inset-0 rounded-[45%] border-4 border-[#d6c79a] bg-gradient-to-br from-sky-400 to-blue-700">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute h-1 w-16 rounded-full bg-white/60"
              style={{ left: 40 + i * 70, top: 60 + i * 50, animation: `cw-ripple ${2 + i}s ease-in-out infinite` }}
            />
          ))}
          <div className="absolute bottom-6 right-10 text-3xl">🛶</div>
        </div>
      );
      break;
    case "park":
      body = (
        <div className="absolute inset-0 rounded-3xl border-4 border-[#d6c79a] bg-[#4f9a3a]">
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/80 ring-4 ring-white/40" />
          {["🌳", "🌸", "🌳", "🌴", "🌳"].map((t, i) => (
            <span key={i} className="absolute text-3xl" style={{ left: 20 + (i % 3) * 80, top: 20 + Math.floor(i / 3) * 120 }}>
              {t}
            </span>
          ))}
        </div>
      );
      break;
    case "stadium":
      body = (
        <div className="absolute inset-0 rounded-[50%] border-8 border-slate-300 bg-emerald-600">
          <div className="absolute inset-8 rounded-[50%] border-2 border-white/70" />
          <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-white/70" />
        </div>
      );
      break;
    case "airport":
      body = (
        <div className="absolute inset-0 rounded-xl bg-slate-400">
          <div className="absolute inset-x-4 top-1/2 h-14 -translate-y-1/2 bg-slate-700">
            <div className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2" style={{ backgroundImage: "repeating-linear-gradient(90deg,#fff 0 20px,transparent 20px 40px)" }} />
          </div>
          <div className="absolute right-10 top-8 rotate-45 text-4xl">✈️</div>
        </div>
      );
      break;
    case "houses":
      body = (
        <div className="absolute inset-0 grid grid-cols-3 gap-3 rounded-2xl bg-[#8fb86a] p-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="relative rounded-md bg-[#f1e4c9] shadow-md">
              <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-md" style={{ background: spot.color }} />
              <div className={`absolute bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 ${lit ? "bg-yellow-300 shadow-[0_0_10px_#fde047]" : "bg-slate-500"}`} />
            </div>
          ))}
        </div>
      );
      break;
    case "market":
      body = (
        <div className="absolute inset-0 grid grid-cols-4 gap-1.5 rounded-xl bg-[#c9a76b] p-2">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="rounded-sm" style={{ background: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"][i % 4] }} />
          ))}
        </div>
      );
      break;
    case "street":
      body = (
        <div className="absolute inset-0 flex items-center justify-around rounded-xl bg-[#7c5a3a] px-2">
          {["🍢", "🍛", "🥤", "🌽"].map((f) => (
            <div key={f} className="flex h-14 w-10 items-center justify-center rounded-t-xl bg-amber-500 text-xl shadow" >
              {f}
            </div>
          ))}
        </div>
      );
      break;
    case "station":
      body = (
        <div className="absolute inset-0 rounded-xl bg-slate-600 p-2">
          <div className="flex h-full items-center justify-around text-3xl">🚕🚕</div>
        </div>
      );
      break;
    case "mosque":
      body = (
        <div className="absolute inset-0">
          <div className="absolute inset-x-6 bottom-0 top-16 rounded-t-lg bg-[#e7e0cf] shadow-lg" />
          <div className="absolute left-1/2 top-2 h-28 w-28 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 shadow-[0_0_30px_rgba(251,191,36,0.6)]" />
          <div className="absolute bottom-0 left-2 h-full w-4 rounded-t-full bg-[#e7e0cf]" />
          <div className="absolute bottom-0 right-2 h-full w-4 rounded-t-full bg-[#e7e0cf]" />
        </div>
      );
      break;
    case "campus":
    case "tower":
    default:
      body = (
        <div className="absolute inset-0 rounded-lg shadow-[8px_12px_0_rgba(0,0,0,0.25)]" style={{ background: spot.color }}>
          <div className="absolute inset-3 grid grid-cols-6 gap-1.5">
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className="rounded-[2px]"
                style={{
                  background: lit && (i * 7) % 3 !== 0 ? "#fde68a" : "rgba(255,255,255,0.35)",
                  boxShadow: lit && (i * 7) % 3 !== 0 ? "0 0 6px #fde68a" : "none",
                }}
              />
            ))}
          </div>
        </div>
      );
  }

  const door = doorOf(spot);

  return (
    <>
      <div className="absolute" style={{ left, top, width: spot.w, height: spot.h, zIndex: Math.round(top) }}>
        {body}
        {/* sign */}
        <div
          className={`absolute -top-9 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-xl border-2 px-3 py-1 text-sm font-black shadow-lg ${
            highlight ? "scale-110 border-amber-300 bg-amber-400 text-black" : "border-white/30 bg-black/70 text-white"
          }`}
        >
          {location?.icon} {location?.name}
          <span
            className={`ml-1 h-2.5 w-2.5 rounded-full ${status.open ? "bg-emerald-400" : "bg-red-500"}`}
            style={status.open ? { animation: "cw-glow 2s ease-in-out infinite" } : undefined}
          />
          {current && <span className="ml-1 rounded bg-red-500 px-1 text-[9px] text-white">YOU WERE HERE</span>}
        </div>
      </div>
      {/* door mat */}
      <div
        className={`absolute h-6 w-16 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 ${
          highlight ? "border-amber-200 bg-amber-400/80" : "border-white/30 bg-[#7a5a3a]"
        }`}
        style={{ left: door.x, top: door.y - 20, zIndex: Math.round(door.y) - 30 }}
      />
    </>
  );
}
