"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** The quick hands-on games that pop up during a work shift. */
export type MiniGameKind = "plate" | "count" | "timing" | "bolts" | "dodge" | "match";

/** Which mini-games each career plays. */
export function miniGamesFor(careerId: string): MiniGameKind[] {
  switch (careerId) {
    case "mama-put":
      return ["plate", "plate", "count", "plate"];
    case "pos-agent":
      return ["count", "match", "count", "count"];
    case "mechanic":
      return ["bolts", "timing", "bolts", "match"];
    case "keke-rider":
      return ["dodge", "count", "dodge", "dodge"];
    case "nurse":
    case "surgeon":
      return ["timing", "match", "timing", "bolts"];
    case "pharmacist":
      return ["match", "count", "match", "timing"];
    case "luxury-car-dealer":
    case "real-estate-agent":
    case "diplomat":
      return ["timing", "match", "count", "timing"];
    case "oil-gas-engineer":
      return ["timing", "bolts", "timing", "match"];
    case "startup-founder":
      return ["bolts", "match", "timing", "count"];
    default:
      return ["timing", "bolts", "match", "count"];
  }
}

const SECONDS: Record<MiniGameKind, number> = { plate: 9, count: 9, timing: 6, bolts: 6, dodge: 8, match: 6 };

const TITLES: Record<MiniGameKind, (careerId: string) => string> = {
  plate: () => "Serve the order!",
  count: (c) => (c === "keke-rider" ? "Give the correct change!" : c === "mama-put" ? "Collect the right money!" : "Count out the cash!"),
  timing: (c) =>
    c === "surgeon" ? "Steady hands: cut in the green!" : c === "nurse" ? "Inject at the right moment!" : c === "oil-gas-engineer" ? "Release the pressure in the green!" : c === "mechanic" ? "Torque it just right!" : "Tap when it's in the green!",
  bolts: (c) => (c === "startup-founder" ? "Fix the bugs in order!" : c === "surgeon" || c === "nurse" ? "Check the vitals in order!" : "Tighten the bolts 1→4!"),
  dodge: () => "Dodge the potholes!",
  match: (c) =>
    c === "pharmacist" || c === "nurse" || c === "surgeon" ? "Pick the right medicine!" : c === "pos-agent" ? "Spot the real alert!" : c === "mechanic" ? "Grab the right part!" : "Find the match!",
};

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ShiftMiniGame({
  kind,
  careerId,
  onDone,
}: {
  kind: MiniGameKind;
  careerId: string;
  onDone: (success: boolean) => void;
}) {
  const limit = SECONDS[kind];
  const [left, setLeft] = useState(limit);
  const finished = useRef(false);

  const finish = (ok: boolean) => {
    if (finished.current) return;
    finished.current = true;
    onDone(ok);
  };

  useEffect(() => {
    const started = Date.now();
    const t = window.setInterval(() => {
      const remaining = limit - (Date.now() - started) / 1000;
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(t);
        finish(false);
      }
    }, 100);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-black">{TITLES[kind](careerId)}</div>
        <div className={`rounded-full px-3 py-1 text-sm font-black ${left < 3 ? "animate-pulse bg-red-500" : "bg-white/10"}`}>
          ⏱ {Math.max(0, Math.ceil(left))}s
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-amber-400 transition-[width] duration-100" style={{ width: `${Math.max(0, (left / limit) * 100)}%` }} />
      </div>
      <div className="relative mt-4 flex-1">
        {kind === "plate" && <PlateGame onDone={finish} />}
        {kind === "count" && <CountGame onDone={finish} />}
        {kind === "timing" && <TimingGame onDone={finish} />}
        {kind === "bolts" && <BoltsGame onDone={finish} careerId={careerId} />}
        {kind === "dodge" && <DodgeGame onDone={finish} />}
        {kind === "match" && <MatchGame onDone={finish} careerId={careerId} />}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------

const FOODS = [
  { id: "jollof", icon: "🍛", label: "Jollof" },
  { id: "fried-rice", icon: "🍚", label: "Fried rice" },
  { id: "chicken", icon: "🍗", label: "Chicken" },
  { id: "beef", icon: "🥩", label: "Beef" },
  { id: "dodo", icon: "🍌", label: "Dodo" },
  { id: "moin", icon: "🫓", label: "Moi moi" },
  { id: "egg", icon: "🥚", label: "Egg" },
  { id: "drink", icon: "🥤", label: "Malt" },
];

function PlateGame({ onDone }: { onDone: (ok: boolean) => void }) {
  const order = useMemo(() => shuffle(FOODS).slice(0, 3), []);
  const [plate, setPlate] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const customer = useMemo(() => ["👨🏾", "👩🏾", "🧔🏿", "👩🏽‍🦱", "👴🏾"][Math.floor(Math.random() * 5)], []);

  function add(id: string) {
    if (plate.includes(id)) return;
    if (!order.some((o) => o.id === id)) {
      setWrong(true);
      window.setTimeout(() => setWrong(false), 400);
      return;
    }
    const next = [...plate, id];
    setPlate(next);
    if (next.length === order.length) window.setTimeout(() => onDone(true), 350);
  }

  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <span className="text-4xl">{customer}</span>
        <div className="rounded-2xl rounded-tl-none bg-white px-3 py-2 text-sm font-bold text-black">
          Abeg give me {order.map((o) => `${o.icon} ${o.label}`).join(", ")}!
        </div>
      </div>
      <div className={`mx-auto mt-3 flex h-20 w-40 items-center justify-center gap-1 rounded-full border-4 border-white/70 bg-white/90 text-3xl shadow-inner ${wrong ? "ring-4 ring-red-500" : ""}`}>
        {plate.map((id) => (
          <span key={id}>{FOODS.find((f) => f.id === id)?.icon}</span>
        ))}
        {plate.length === 0 && <span className="text-xs font-bold text-black/40">Empty plate</span>}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {FOODS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => add(f.id)}
            className={`rounded-xl border p-2 text-center transition active:scale-95 ${plate.includes(f.id) ? "border-emerald-400 bg-emerald-500/20" : "border-white/10 bg-white/5"}`}
          >
            <div className="text-2xl">{f.icon}</div>
            <div className="text-[10px] font-bold">{f.label}</div>
          </button>
        ))}
      </div>
      {wrong && <p className="mt-2 text-center text-xs font-black text-red-300">That&apos;s not what they ordered!</p>}
    </div>
  );
}

function CountGame({ onDone }: { onDone: (ok: boolean) => void }) {
  const target = useMemo(() => (Math.floor(Math.random() * 30) + 6) * 100, []);
  const [total, setTotal] = useState(0);
  const notes = [1000, 500, 200, 100];

  function add(v: number) {
    const next = total + v;
    setTotal(next);
    if (next === target) window.setTimeout(() => onDone(true), 300);
  }

  return (
    <div className="text-center">
      <div className="text-xs font-bold uppercase text-white/50">Amount needed</div>
      <div className="text-4xl font-black text-amber-200">₦{target.toLocaleString()}</div>
      <div className={`mt-2 text-2xl font-black ${total > target ? "text-red-300" : "text-emerald-300"}`}>
        Counted: ₦{total.toLocaleString()}
      </div>
      {total > target && <div className="text-xs font-bold text-red-300">Too much! Clear and recount.</div>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {notes.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => add(v)}
            className="rounded-lg border-2 py-3 text-lg font-black shadow active:scale-95"
            style={{
              background: v === 1000 ? "#fca5a5" : v === 500 ? "#a5b4fc" : v === 200 ? "#7dd3a8" : "#fde68a",
              color: "#111",
              borderColor: "#0006",
            }}
          >
            ₦{v}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => setTotal(0)} className="mt-2 w-full rounded-lg bg-white/10 py-2 text-sm font-black">
        ↺ Clear
      </button>
    </div>
  );
}

function TimingGame({ onDone }: { onDone: (ok: boolean) => void }) {
  const zone = useMemo(() => {
    const start = 20 + Math.random() * 55;
    return [start, start + 14] as const;
  }, []);
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState<"hit" | "miss" | null>(null);
  const [tries, setTries] = useState(2);

  useEffect(() => {
    if (result === "hit") return;
    const started = Date.now();
    const t = window.setInterval(() => {
      const phase = ((Date.now() - started) / 1100) % 2;
      setPos((phase < 1 ? phase : 2 - phase) * 100);
    }, 16);
    return () => window.clearInterval(t);
  }, [result]);

  function tap() {
    if (result === "hit") return;
    if (pos >= zone[0] && pos <= zone[1]) {
      setResult("hit");
      window.setTimeout(() => onDone(true), 400);
    } else {
      setResult("miss");
      const left = tries - 1;
      setTries(left);
      if (left <= 0) window.setTimeout(() => onDone(false), 400);
    }
  }

  return (
    <button type="button" onClick={tap} className="block w-full pt-8 text-center">
      <div className="relative mx-auto h-10 w-full overflow-hidden rounded-full border-2 border-white/30 bg-gradient-to-r from-red-500/40 via-amber-400/30 to-red-500/40">
        <div className="absolute inset-y-0 bg-emerald-400/80" style={{ left: `${zone[0]}%`, width: `${zone[1] - zone[0]}%` }} />
        <div className="absolute inset-y-[-4px] w-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]" style={{ left: `${pos}%` }} />
      </div>
      <div className="mt-6 text-5xl">{result === "hit" ? "✅" : "👆"}</div>
      <div className="mt-2 text-sm font-black">
        {result === "hit" ? "Perfect!" : result === "miss" ? `Missed! ${tries} try left` : "Tap anywhere when the line is in the green"}
      </div>
    </button>
  );
}

function BoltsGame({ onDone, careerId }: { onDone: (ok: boolean) => void; careerId: string }) {
  const icon = careerId === "startup-founder" ? "🐞" : careerId === "surgeon" || careerId === "nurse" ? "💓" : "🔩";
  const spots = useMemo(
    () => Array.from({ length: 4 }, (_, i) => ({ n: i + 1, x: 8 + Math.random() * 70, y: 5 + Math.random() * 60 })),
    []
  );
  const [next, setNext] = useState(1);
  const [miss, setMiss] = useState(false);

  function tap(n: number) {
    if (n !== next) {
      setMiss(true);
      window.setTimeout(() => setMiss(false), 300);
      return;
    }
    if (n === 4) window.setTimeout(() => onDone(true), 250);
    setNext(n + 1);
  }

  return (
    <div className={`relative h-56 rounded-2xl border border-white/10 bg-[repeating-linear-gradient(45deg,#1f2937_0_12px,#111827_12px_24px)] ${miss ? "ring-2 ring-red-500" : ""}`}>
      {spots.map((s) => (
        <button
          key={s.n}
          type="button"
          onClick={() => tap(s.n)}
          className={`absolute flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 text-xl font-black transition ${
            s.n < next ? "scale-75 border-emerald-400 bg-emerald-500/30 opacity-50" : "border-white/40 bg-slate-700 active:scale-90"
          }`}
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          <span>{icon}</span>
          <span className="-mt-1 text-xs">{s.n}</span>
        </button>
      ))}
    </div>
  );
}

function DodgeGame({ onDone }: { onDone: (ok: boolean) => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [lane, setLane] = useState(1);
  const [obstacle, setObstacle] = useState<{ lane: number; y: number }>({ lane: Math.floor(Math.random() * 3), y: -10 });
  const [passed, setPassed] = useState(0);
  const laneRef = useRef(1);
  const done = useRef(false);

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setObstacle((o) => {
        const y = o.y + 3.2;
        if (y >= 78 && y < 81.2 && o.lane === laneRef.current && !done.current) {
          done.current = true;
          window.setTimeout(() => doneRef.current(false), 200);
        }
        if (y > 100) {
          setPassed((p) => {
            const n = p + 1;
            if (n >= 3 && !done.current) {
              done.current = true;
              window.setTimeout(() => doneRef.current(true), 200);
            }
            return n;
          });
          return { lane: Math.floor(Math.random() * 3), y: -10 };
        }
        return { ...o, y };
      });
    }, 40);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div>
      <div className="relative h-56 overflow-hidden rounded-2xl bg-[#2d3138]">
        {[1, 2].map((i) => (
          <div key={i} className="absolute inset-y-0 w-1 bg-[repeating-linear-gradient(180deg,#fde68a_0_14px,transparent_14px_28px)]" style={{ left: `${(i * 100) / 3}%` }} />
        ))}
        <div className="absolute text-3xl transition-all" style={{ left: `${obstacle.lane * 33.3 + 11}%`, top: `${obstacle.y}%` }}>
          🕳️
        </div>
        <div className="absolute bottom-2 text-4xl transition-all duration-100" style={{ left: `${lane * 33.3 + 9}%` }}>
          🛺
        </div>
        <div className="absolute right-2 top-2 rounded bg-black/50 px-2 text-xs font-black">{passed}/3</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((l) => (
          <button key={l} type="button" onClick={() => setLane(l)} className={`rounded-xl py-3 font-black ${lane === l ? "bg-amber-400 text-black" : "bg-white/10"}`}>
            {["⬅ Left", "Middle", "Right ➡"][l]}
          </button>
        ))}
      </div>
    </div>
  );
}

const MATCH_SETS: Record<string, { target: string; hint: string; options: string[] }[]> = {
  med: [
    { target: "💊", hint: "Paracetamol (white tablet)", options: ["💊", "🧴", "💉", "🩹"] },
    { target: "💉", hint: "Injection for the patient", options: ["🩺", "💉", "💊", "🧪"] },
    { target: "🧴", hint: "Cough syrup", options: ["🧴", "💊", "🧪", "🩹"] },
  ],
  pos: [
    { target: "✅", hint: "Which alert is from the real bank app?", options: ["✅", "📸", "🖼️", "📝"] },
  ],
  mech: [
    { target: "🛞", hint: "Customer needs a new tyre", options: ["🛞", "🔋", "🪛", "⛽"] },
    { target: "🔋", hint: "Car won't start: battery", options: ["🧯", "🔋", "🛞", "🔧"] },
  ],
  deal: [
    { target: "🤝", hint: "Close the deal", options: ["🤝", "🙅🏾", "😴", "📵"] },
    { target: "📄", hint: "Sign the right document", options: ["🗑️", "📄", "🧻", "📦"] },
  ],
};

function MatchGame({ onDone, careerId }: { onDone: (ok: boolean) => void; careerId: string }) {
  const set =
    careerId === "pharmacist" || careerId === "nurse" || careerId === "surgeon"
      ? MATCH_SETS.med
      : careerId === "pos-agent"
        ? MATCH_SETS.pos
        : careerId === "mechanic"
          ? MATCH_SETS.mech
          : MATCH_SETS.deal;
  const round = useMemo(() => {
    const r = set[Math.floor(Math.random() * set.length)];
    return { ...r, options: shuffle(r.options) };
  }, [set]);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="text-center">
      <div className="rounded-2xl bg-white/5 p-4 text-base font-black">{round.hint}</div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {round.options.map((o) => (
          <button
            key={o}
            type="button"
            disabled={picked !== null}
            onClick={() => {
              setPicked(o);
              window.setTimeout(() => onDone(o === round.target), 450);
            }}
            className={`rounded-2xl border-2 py-5 text-5xl transition active:scale-95 ${
              picked === o ? (o === round.target ? "border-emerald-400 bg-emerald-500/20" : "border-red-400 bg-red-500/20") : "border-white/10 bg-white/5"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
