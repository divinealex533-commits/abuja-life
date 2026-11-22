"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import WalkingCharacter, { type DanceMove } from "@/components/character/WalkingCharacter";
import { randomAppearance, type Appearance } from "@/lib/character/appearance";

export interface ScenePlayer {
  id: string;
  name: string;
  appearance: unknown;
  dance: DanceMove;
  vip: boolean;
}

interface Npc {
  id: string;
  appearance: Appearance;
  dance: DanceMove;
  x: number;
  y: number;
  size: number;
  prop?: string;
  delay: number;
}

const STAGE_W = 780;
const STAGE_H = 760;

// Where players stand on the dance floor (feet position), front rows first.
const FLOOR_SLOTS: [number, number][] = [
  [390, 560], [300, 545], [480, 545], [345, 655], [435, 655], [225, 640], [555, 640],
  [255, 470], [525, 470], [390, 455], [300, 720], [480, 720],
];
const VIP_SLOTS: [number, number][] = [[300, 215], [380, 220], [460, 215], [540, 205], [235, 205]];

const CHATTER = [
  "Omo, this DJ too sabi! 🔥",
  "Who get this party? 👀",
  "Abeg spray me small 😂",
  "This jollof hot die!",
  "You dey come VIP?",
  "You look fine today 😍",
  "Make we dance this one!",
  "Na my song be this!! 🎶",
  "Bring more drinks! 🍾",
  "Wahala for who no dey here 😂",
  "Shey you go spray?",
  "Odogwu don land! 👑",
];

/** The club: VIP balcony, DJ, LED dance floor, bar and lounge, with a live crowd. */
export default function PartyScene({
  colors,
  title,
  players,
  me,
  musicOn,
  onTapPlayer,
  overlay,
  onJoinVip,
  iAmVip,
  vipPrice,
}: {
  colors: readonly string[];
  title: string;
  players: ScenePlayer[];
  me: string | null;
  musicOn: boolean;
  onTapPlayer: (id: string) => void;
  /** Notes and emotes drawn over a player's head. */
  overlay: (id: string) => ReactNode;
  onJoinVip: () => void;
  iAmVip: boolean;
  vipPrice: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [talk, setTalk] = useState<{ id: string; text: string } | null>(null);
  const [tick, setTick] = useState(0);

  // Build the crowd on the client so every visit looks a bit different.
  useEffect(() => {
    const dances: DanceMove[] = ["shaku", "zanku", "gwara", "azonto", "buga", "chill"];
    const crowd: Npc[] = [];
    const add = (id: string, x: number, y: number, size: number, dance: DanceMove, prop?: string) =>
      crowd.push({ id, appearance: randomAppearance(), dance, x, y, size, prop, delay: Math.random() * 1.2 });
    // dance floor fillers (back rows)
    add("f1", 210, 420, 96, dances[0]);
    add("f2", 570, 420, 96, dances[2]);
    add("f3", 330, 390, 88, dances[1]);
    add("f4", 450, 390, 88, dances[3]);
    add("f5", 160, 520, 100, dances[4]);
    add("f6", 620, 520, 100, dances[5]);
    // bar
    add("bartender", 70, 505, 92, "chill", "🍸");
    add("bar1", 40, 690, 100, "toast", "🍺");
    add("bar2", 118, 700, 100, "chill");
    // lounge: couples toasting and talking
    add("l1", 680, 610, 100, "toast", "🥂");
    add("l2", 740, 615, 100, "toast", "🥂");
    add("l3", 700, 725, 104, "chill");
    // VIP NPCs on the sofa area
    add("v1", 610, 200, 82, "toast", "🍾");
    add("bouncer", 690, 250, 96, "chill");
    setNpcs(crowd);
  }, []);

  // Someone says something every few seconds.
  const npcsRef = useRef<Npc[]>([]);
  npcsRef.current = npcs;
  useEffect(() => {
    const t = window.setInterval(() => {
      setTick((n) => n + 1);
      const talkers = npcsRef.current.filter((n) => n.id !== "bouncer");
      const who = talkers[Math.floor(Math.random() * talkers.length)];
      if (who) setTalk({ id: who.id, text: CHATTER[Math.floor(Math.random() * CHATTER.length)] });
    }, 2800);
    return () => window.clearInterval(t);
  }, []);

  // Start scrolled to the middle of the club on phones.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (STAGE_W - el.clientWidth) / 2;
  }, []);

  const floor = players.filter((p) => !p.vip);
  const vip = players.filter((p) => p.vip);

  const person = (key: string, x: number, y: number, size: number, node: ReactNode, extra?: ReactNode, onClick?: () => void) => (
    <div
      key={key}
      className="absolute"
      style={{ left: x, top: y - size, transform: "translateX(-50%)", zIndex: Math.round(y) }}
      onClick={onClick}
    >
      {node}
      {extra}
    </div>
  );

  return (
    <div ref={scroller} className="relative w-full overflow-x-auto overflow-y-hidden">
      <style>{`
        @keyframes ps-tile{0%,100%{opacity:.25}50%{opacity:.85}}
        @keyframes ps-beam{0%{transform:rotate(-30deg)}100%{transform:rotate(30deg)}}
        @keyframes ps-pop{0%{transform:translate(-50%,6px) scale(.7);opacity:0}15%{transform:translate(-50%,0) scale(1);opacity:1}85%{opacity:1}100%{opacity:0}}
        @keyframes ps-neon{0%,100%{opacity:1}92%{opacity:1}94%{opacity:.4}96%{opacity:1}}
        @keyframes ps-speaker{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
      `}</style>

      <div className="relative" style={{ width: STAGE_W, height: STAGE_H }}>
        {/* walls */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#0b0716 0%,#140b26 40%,#0a0614 100%)" }} />
        <div
          className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap text-3xl font-black italic"
          style={{
            color: colors[0],
            textShadow: `0 0 10px ${colors[0]}, 0 0 30px ${colors[1]}`,
            animation: "ps-neon 5s linear infinite",
          }}
        >
          {title}
        </div>

        {/* light beams */}
        {colors.map((c, i) => (
          <div
            key={c + i}
            className="pointer-events-none absolute top-[260px] h-[520px] w-28 origin-top opacity-25 blur-md"
            style={{
              left: 330 + i * 60,
              background: `linear-gradient(${c}, transparent)`,
              animation: `ps-beam ${2.6 + i * 0.7}s ease-in-out ${i * 0.5}s infinite alternate`,
            }}
          />
        ))}

        {/* VIP balcony */}
        <div className="absolute left-[140px] top-[70px] h-[160px] w-[580px] rounded-t-3xl border-x-4 border-t-4 border-amber-400/70 bg-gradient-to-b from-[#3b1d0a] to-[#1b0f05]">
          <div className="absolute inset-x-6 top-4 h-14 rounded-2xl bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] shadow-inner" />
          <div className="absolute left-4 top-2 rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-black text-black">👑 VIP SECTION</div>
          <div className="absolute right-24 top-6 text-2xl">🍾🧊</div>
        </div>
        {/* balcony rail */}
        <div className="absolute left-[140px] top-[226px] h-3 w-[580px] rounded bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.7)]" style={{ zIndex: 260 }} />
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="absolute top-[229px] h-8 w-1 bg-amber-300/80" style={{ left: 150 + i * 50, zIndex: 260 }} />
        ))}
        {/* velvet rope + stairs */}
        <div className="absolute left-[640px] top-[235px] h-[60px] w-[70px] bg-[repeating-linear-gradient(180deg,#334155_0_10px,#1e293b_10px_20px)]" />
        <div className="absolute left-[650px] top-[262px] h-1.5 w-12 rounded-full bg-red-700" style={{ zIndex: 300 }} />

        {!iAmVip && (
          <button
            type="button"
            onClick={onJoinVip}
            className="absolute left-[430px] top-[120px] -translate-x-1/2 rounded-full border-2 border-amber-200 bg-gradient-to-b from-amber-300 to-amber-600 px-4 py-2 text-sm font-black text-black shadow-[0_0_24px_rgba(251,191,36,0.6)]"
            style={{ zIndex: 400 }}
          >
            👑 Enter VIP · {vipPrice}
          </button>
        )}

        {/* DJ booth */}
        <div className="absolute left-[300px] top-[262px] w-[180px] rounded-t-2xl border-2 border-slate-600 bg-gradient-to-b from-slate-800 to-slate-950 p-2 text-center" style={{ zIndex: 270 }}>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">🎧 DJ Abuja</div>
          <div className="mt-1 flex justify-center gap-0.5">
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                className="w-1 rounded-full"
                style={{
                  height: musicOn ? 5 + ((i * 7 + tick * 3) % 6) * 4 : 4,
                  background: colors[i % colors.length],
                  transition: "height .3s",
                }}
              />
            ))}
          </div>
        </div>
        {/* speakers */}
        {[250, 530].map((x) => (
          <div
            key={x}
            className="absolute top-[262px] flex h-[70px] w-[46px] flex-col items-center justify-around rounded-lg bg-slate-900 ring-2 ring-slate-700"
            style={{ left: x, zIndex: 270, animation: musicOn ? "ps-speaker .58s ease-in-out infinite" : "none" }}
          >
            <span className="h-6 w-6 rounded-full bg-slate-700 ring-2 ring-slate-500" />
            <span className="h-4 w-4 rounded-full bg-slate-700 ring-2 ring-slate-500" />
          </div>
        ))}

        {/* LED dance floor */}
        <div
          className="absolute left-[150px] top-[345px] grid h-[400px] w-[480px] grid-cols-8 gap-1 rounded-2xl bg-black/60 p-1"
          style={{ transform: "perspective(600px) rotateX(18deg)", transformOrigin: "50% 100%" }}
        >
          {Array.from({ length: 64 }, (_, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                background: colors[(i + Math.floor(i / 8)) % colors.length],
                animation: `ps-tile ${1 + ((i * 37) % 7) / 5}s ease-in-out ${((i * 13) % 10) / 10}s infinite`,
              }}
            />
          ))}
        </div>

        {/* bar */}
        <div className="absolute left-0 top-[330px] h-[170px] w-[150px] rounded-tr-2xl bg-gradient-to-b from-[#2a1606] to-[#1a0e04] p-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-200/70">Bar</div>
          <div className="mt-1 grid grid-cols-5 gap-1 text-lg">
            {Array.from("🍾🍷🍸🥃🍹🍺🥂🍾🍷🍸").map((b, i) => (
              <span key={i}>{b}</span>
            ))}
          </div>
        </div>
        <div className="absolute left-0 top-[520px] h-[44px] w-[160px] rounded-r-xl bg-gradient-to-b from-[#7c4a1e] to-[#4a2a0e] shadow-lg" style={{ zIndex: 515 }} />

        {/* lounge */}
        <div className="absolute right-0 top-[520px] h-[60px] w-[150px] rounded-l-3xl bg-gradient-to-b from-[#6d28d9] to-[#3b0764] shadow-lg" />
        <div className="absolute right-[40px] top-[560px] h-5 w-16 rounded-full bg-[#1f2937]" />
        <div className="absolute right-[48px] top-[540px] text-xl">🍾🍓</div>

        {/* NPCs */}
        {npcs.map((n) =>
          person(
            n.id,
            n.x,
            n.y,
            n.size,
            <WalkingCharacter appearance={n.appearance} facing="down" walking={false} dance={n.dance} delay={n.delay} size={n.size} />,
            <>
              {n.prop && (
                <span className="absolute text-lg" style={{ right: -4, top: n.size * 0.28 }}>
                  {n.prop}
                </span>
              )}
              {n.id === "bouncer" && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-black/70 px-1 text-[9px] font-black">SECURITY</span>
              )}
              {talk?.id === n.id && <Bubble key={tick} text={talk.text} />}
            </>
          )
        )}

        {/* VIP players */}
        {vip.slice(0, VIP_SLOTS.length).map((p, i) => {
          const [x, y] = VIP_SLOTS[i];
          return person(
            p.id,
            x,
            y,
            96,
            <WalkingCharacter appearance={p.appearance as never} facing="down" walking={false} dance={p.dance} size={96} />,
            <PlayerTag name={p.id === me ? "You" : p.name} vip>{overlay(p.id)}</PlayerTag>,
            () => onTapPlayer(p.id)
          );
        })}

        {/* players on the floor */}
        {floor.slice(0, FLOOR_SLOTS.length).map((p, i) => {
          const [x, y] = FLOOR_SLOTS[i];
          return person(
            p.id,
            x,
            y,
            118,
            <WalkingCharacter appearance={p.appearance as never} facing="down" walking={false} dance={p.dance} size={118} />,
            <PlayerTag name={p.id === me ? "You" : p.name}>{overlay(p.id)}</PlayerTag>,
            () => onTapPlayer(p.id)
          );
        })}
      </div>
    </div>
  );
}

function Bubble({ text }: { text: string }) {
  return (
    <div
      className="pointer-events-none absolute -top-9 left-1/2 whitespace-nowrap rounded-2xl rounded-bl-none bg-white px-2.5 py-1 text-[11px] font-bold text-black shadow-lg"
      style={{ animation: "ps-pop 2.7s ease-out forwards", zIndex: 999 } as CSSProperties}
    >
      {text}
    </div>
  );
}

function PlayerTag({ name, vip = false, children }: { name: string; vip?: boolean; children: ReactNode }) {
  return (
    <>
      <div
        className={`absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black ${
          vip ? "bg-amber-400 text-black" : "bg-black/70 text-white"
        }`}
      >
        {vip ? "👑 " : ""}
        {name}
      </div>
      <div className="pointer-events-none absolute inset-0">{children}</div>
    </>
  );
}
