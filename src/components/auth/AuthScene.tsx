import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Animated Abuja-at-night backdrop for the login and sign-up screens:
 * twinkling stars, Aso Rock, a lit skyline, the National Mosque dome
 * and cars moving along the expressway. Pure SVG + CSS, no images.
 */

// Small deterministic random so server and client render the same scene.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seeded(42);

const STARS = Array.from({ length: 46 }, () => ({
  x: rand() * 400,
  y: rand() * 120,
  r: rand() * 0.9 + 0.3,
  d: (rand() * 4).toFixed(2),
}));

// [x, width, height]
const BUILDINGS: [number, number, number][] = [
  [0, 26, 70], [24, 18, 96], [40, 30, 58], [68, 22, 118], [88, 34, 76],
  [120, 20, 104], [138, 28, 64], [250, 24, 92], [272, 18, 128], [288, 32, 70],
  [318, 22, 110], [338, 30, 84], [366, 20, 122], [384, 30, 66],
];

const GROUND = 248;

const WINDOWS = BUILDINGS.flatMap(([x, w, h], bi) => {
  const list: { x: number; y: number; on: boolean; gold: boolean; d: string }[] = [];
  for (let wy = GROUND - h + 8; wy < GROUND - 6; wy += 9) {
    for (let wx = x + 4; wx < x + w - 5; wx += 7) {
      list.push({
        x: wx,
        y: wy,
        on: rand() > 0.42,
        gold: (bi + Math.floor(wy)) % 3 !== 0,
        d: (rand() * 9).toFixed(2),
      });
    }
  }
  return list;
});

export default function AuthScene({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b1d] text-white">
      <style>{`
        @keyframes al-twinkle{0%,100%{opacity:.25}50%{opacity:1}}
        @keyframes al-window{0%,86%,100%{opacity:1}90%{opacity:.15}}
        @keyframes al-drive-r{from{transform:translateX(-60px)}to{transform:translateX(460px)}}
        @keyframes al-drive-l{from{transform:translateX(460px)}to{transform:translateX(-60px)}}
        @keyframes al-dash{to{stroke-dashoffset:-40}}
        @keyframes al-glow{0%,100%{opacity:.55}50%{opacity:.95}}
        @keyframes al-rise{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes al-shine{0%{transform:translateX(-120%) skewX(-20deg)}60%,100%{transform:translateX(260%) skewX(-20deg)}}
        @keyframes al-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .al-star{animation:al-twinkle 3.2s ease-in-out infinite}
        .al-win{animation:al-window 9s steps(1) infinite}
        .al-car-r{animation:al-drive-r 7s linear infinite}
        .al-car-l{animation:al-drive-l 9s linear infinite}
        .al-dash{animation:al-dash 1.2s linear infinite}
        .al-glow{animation:al-glow 4s ease-in-out infinite}
        .al-card{animation:al-rise .7s cubic-bezier(.2,.8,.2,1) both}
        .al-shine::after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:al-shine 3.2s ease-in-out infinite}
        .al-float{animation:al-float 4s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){
          .al-star,.al-win,.al-car-r,.al-car-l,.al-dash,.al-glow,.al-card,.al-float,.al-shine::after{animation:none}
        }
      `}</style>

      {/* The city */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="al-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#060a1c" />
            <stop offset="55%" stopColor="#1a1446" />
            <stop offset="85%" stopColor="#5b2350" />
            <stop offset="100%" stopColor="#c2512f" />
          </linearGradient>
          <radialGradient id="al-moon" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fff7d6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff7d6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="al-dome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="al-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#070b1d" stopOpacity="0" />
            <stop offset="100%" stopColor="#070b1d" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <rect width="400" height="300" fill="url(#al-sky)" />

        {STARS.map((s, i) => (
          <circle
            key={i}
            className="al-star"
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#fff"
            style={{ animationDelay: `${s.d}s` }}
          />
        ))}

        {/* moon */}
        <circle cx="330" cy="46" r="34" fill="url(#al-moon)" className="al-glow" />
        <circle cx="330" cy="46" r="11" fill="#fff4cc" />

        {/* Aso Rock */}
        <path
          d="M150 248 C150 190 176 150 214 146 C246 142 266 168 276 196 C282 214 300 222 310 248 Z"
          fill="#1b1a3d"
        />
        <path d="M184 176 C200 160 226 156 244 166" stroke="#2b2a5a" strokeWidth="2" fill="none" />

        {/* skyline */}
        {BUILDINGS.map(([x, w, h], i) => (
          <rect key={i} x={x} y={GROUND - h} width={w} height={h} fill="#0c1128" />
        ))}
        {/* tower spires */}
        <line x1="79" y1={GROUND - 118} x2="79" y2={GROUND - 136} stroke="#0c1128" strokeWidth="2" />
        <circle cx="79" cy={GROUND - 137} r="1.6" fill="#ef4444" className="al-glow" />
        <line x1="281" y1={GROUND - 128} x2="281" y2={GROUND - 148} stroke="#0c1128" strokeWidth="2" />
        <circle cx="281" cy={GROUND - 149} r="1.6" fill="#ef4444" className="al-glow" />

        {WINDOWS.map((w, i) =>
          w.on ? (
            <rect
              key={i}
              x={w.x}
              y={w.y}
              width="3"
              height="4"
              fill={w.gold ? "#fcd34d" : "#67e8f9"}
              opacity="0.85"
              className="al-win"
              style={{ animationDelay: `${w.d}s` }}
            />
          ) : null
        )}

        {/* National Mosque */}
        <g>
          <rect x="196" y="214" width="48" height="34" fill="#11173a" />
          <path d="M200 216 Q220 180 240 216 Z" fill="url(#al-dome)" />
          <circle cx="220" cy="190" r="16" fill="#fbbf24" opacity="0.18" className="al-glow" />
          <line x1="220" y1="186" x2="220" y2="178" stroke="#fde68a" strokeWidth="1.2" />
          {[188, 252].map((mx) => (
            <g key={mx}>
              <rect x={mx - 2} y="178" width="4" height="70" fill="#11173a" />
              <path d={`M${mx - 3} 180 L${mx} 170 L${mx + 3} 180 Z`} fill="#fbbf24" />
            </g>
          ))}
        </g>

        {/* expressway */}
        <rect x="0" y={GROUND} width="400" height="52" fill="#090d20" />
        <line x1="0" y1={GROUND + 1} x2="400" y2={GROUND + 1} stroke="#f59e0b" strokeOpacity="0.35" strokeWidth="0.8" />
        <line
          x1="0"
          y1={GROUND + 13}
          x2="400"
          y2={GROUND + 13}
          stroke="#fef3c7"
          strokeOpacity="0.35"
          strokeWidth="0.8"
          strokeDasharray="10 10"
          className="al-dash"
        />

        {/* cars: headlights going right, tail lights going left */}
        {[0, 2.4, 4.8].map((delay) => (
          <g key={`r${delay}`} className="al-car-r" style={{ animationDelay: `-${delay}s` }}>
            <rect x="0" y={GROUND + 17} width="14" height="5" rx="2" fill="#1e293b" />
            <circle cx="14" cy={GROUND + 20} r="1.2" fill="#fef9c3" />
            <path d={`M15 ${GROUND + 18} L40 ${GROUND + 15} L40 ${GROUND + 25} Z`} fill="#fef9c3" opacity="0.12" />
          </g>
        ))}
        {[0, 3.1, 6.2].map((delay) => (
          <g key={`l${delay}`} className="al-car-l" style={{ animationDelay: `-${delay}s` }}>
            <rect x="0" y={GROUND + 5} width="14" height="5" rx="2" fill="#1e293b" />
            <circle cx="13.5" cy={GROUND + 7.5} r="1.1" fill="#ef4444" />
          </g>
        ))}

        <rect width="400" height="300" fill="url(#al-fade)" />
      </svg>

      {/* soft colour glow behind the card */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
        {children}
      </div>
    </main>
  );
}

/** Game logo shown above each auth card. */
export function AuthLogo({ subtitle }: { subtitle: string }) {
  return (
    <div className="mb-6 text-center">
      <div className="al-float mx-auto inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-amber-200 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        FCT server online
      </div>
      <h1 className="mt-4 bg-gradient-to-b from-white via-amber-100 to-amber-400 bg-clip-text text-5xl font-black uppercase italic tracking-tight text-transparent drop-shadow-[0_4px_24px_rgba(245,158,11,0.45)]">
        Abuja Life
      </h1>
      <p className="mt-2 text-sm font-semibold text-white/60">{subtitle}</p>
    </div>
  );
}

/** Glassy card with a glowing gradient edge. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="al-card rounded-[28px] bg-gradient-to-br from-amber-400/60 via-white/10 to-cyan-400/50 p-[1.5px] shadow-[0_20px_80px_-20px_rgba(245,158,11,0.5)]">
      <div className="rounded-[27px] bg-[#0a0f24]/85 p-6 backdrop-blur-xl sm:p-7">{children}</div>
    </div>
  );
}

/** Labelled input with an icon, styled like a game HUD field. */
export function GameField({
  icon,
  label,
  hint,
  trailing,
  ...input
}: {
  icon: string;
  label: string;
  hint?: string;
  trailing?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.18em] text-amber-200/80">
        {label}
      </span>
      <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 transition focus-within:border-amber-400/70 focus-within:bg-amber-400/[0.06] focus-within:shadow-[0_0_0_4px_rgba(245,158,11,0.12)]">
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
        <input
          {...input}
          className="min-w-0 flex-1 bg-transparent py-3.5 text-[15px] font-semibold text-white outline-none placeholder:font-normal placeholder:text-white/25 disabled:opacity-60"
        />
        {trailing}
      </span>
      {hint && <span className="mt-1 block text-xs text-white/35">{hint}</span>}
    </label>
  );
}

/** Big glowing call-to-action button with a light sweep. */
export function GameButton({
  children,
  loading,
  loadingText,
}: {
  children: ReactNode;
  loading: boolean;
  loadingText: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="al-shine relative w-full overflow-hidden rounded-2xl border-b-4 border-orange-800 bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 px-5 py-4 text-base font-black uppercase tracking-wider text-[#1a0f00] shadow-[0_10px_30px_-8px_rgba(245,158,11,0.8)] transition active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a0f00]/30 border-t-[#1a0f00]" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/** Show/hide toggle for password fields. */
export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-xs font-black uppercase tracking-wider text-white/40 hover:text-amber-200"
      aria-label={shown ? "Hide password" : "Show password"}
    >
      {shown ? "Hide" : "Show"}
    </button>
  );
}
