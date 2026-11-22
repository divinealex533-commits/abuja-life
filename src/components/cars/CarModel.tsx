import { useId } from "react";

import type { CarBody } from "@/lib/cars/style";
import { shade } from "@/lib/character/appearance";

interface Shape {
  /** Painted body outline. */
  body: string;
  /** Window glass. */
  glass: string;
  /** Pillar line splitting front and rear windows (x). */
  pillar: number;
  wheels: [number, number];
  wheelR: number;
  rideY: number;
  /** Headlight and taillight positions. */
  head: [number, number];
  tail: [number, number];
  doors: number[];
  roofY: number;
  mirror: [number, number];
}

// All cars face right in a 400×170 box. Ground is at y = 150.
const SHAPES: Record<CarBody, Shape> = {
  sedan: {
    body: "M24 112 Q22 92 44 86 L112 80 Q138 48 170 42 L262 42 Q290 46 314 78 L366 88 Q386 94 384 112 L384 124 Q384 130 376 130 L30 130 Q22 130 24 122 Z",
    glass: "M124 80 Q146 54 172 50 L258 50 Q280 54 300 80 Z",
    pillar: 214,
    wheels: [96, 314],
    wheelR: 27,
    rideY: 128,
    head: [374, 96],
    tail: [30, 98],
    doors: [212, 290],
    roofY: 42,
    mirror: [298, 82],
  },
  luxury: {
    body: "M18 110 Q18 88 42 84 L106 78 Q134 44 168 38 L276 38 Q300 42 324 76 L372 84 Q390 90 390 110 L390 126 Q390 132 382 132 L26 132 Q18 132 18 124 Z",
    glass: "M118 78 Q142 50 170 46 L272 46 Q292 50 312 78 Z",
    pillar: 222,
    wheels: [94, 318],
    wheelR: 29,
    rideY: 130,
    head: [380, 94],
    tail: [24, 96],
    doors: [220, 300],
    roofY: 38,
    mirror: [310, 80],
  },
  suv: {
    body: "M22 112 Q20 80 42 74 L96 70 Q118 26 150 22 L318 22 Q336 24 344 66 L370 72 Q388 78 386 104 L386 124 Q386 132 378 132 L30 132 Q22 132 22 124 Z",
    glass: "M108 70 Q126 34 152 30 L226 30 L226 70 Z M232 30 L314 30 Q328 32 334 70 L232 70 Z",
    pillar: 229,
    wheels: [98, 312],
    wheelR: 31,
    rideY: 130,
    head: [376, 88],
    tail: [28, 86],
    doors: [228, 300],
    roofY: 22,
    mirror: [330, 72],
  },
  sports: {
    body: "M20 116 Q22 98 48 94 L130 86 Q170 54 210 52 L262 54 Q300 60 336 86 L372 94 Q390 100 388 116 L388 126 Q388 132 380 132 L28 132 Q20 132 20 126 Z",
    glass: "M146 86 Q178 60 212 60 L258 62 Q286 68 312 86 Z",
    pillar: 240,
    wheels: [96, 318],
    wheelR: 28,
    rideY: 130,
    head: [378, 102],
    tail: [26, 104],
    doors: [236],
    roofY: 52,
    mirror: [308, 88],
  },
  super: {
    body: "M18 112 Q22 100 56 98 L150 92 Q190 64 230 62 L258 64 Q292 74 326 100 L384 112 Q394 116 392 124 L390 130 Q388 134 380 134 L26 134 Q18 134 18 126 Z",
    glass: "M168 92 Q198 70 230 70 L256 72 Q280 80 302 96 Z",
    pillar: 999,
    wheels: [94, 320],
    wheelR: 28,
    rideY: 130,
    head: [380, 108],
    tail: [24, 110],
    doors: [232],
    roofY: 60,
    mirror: [296, 96],
  },
};

/**
 * A detailed side view of a car in any paint colour, with glass reflections,
 * chrome, lights and alloy wheels that spin when `driving`.
 */
export default function CarModel({
  body,
  color,
  driving = false,
  lights = false,
  className = "",
}: {
  body: CarBody;
  color: string;
  driving?: boolean;
  lights?: boolean;
  className?: string;
}) {
  const s = SHAPES[body];
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const light = shade(color, 55);
  const dark = shade(color, -45);
  const sporty = body === "sports" || body === "super";

  return (
    <svg viewBox="0 0 400 170" className={className} role="img" aria-label="Car">
      <defs>
        <linearGradient id={`paint${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="35%" stopColor={color} />
          <stop offset="75%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`glass${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9fb3c8" />
          <stop offset="45%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0b1220" />
        </linearGradient>
        <radialGradient id={`rim${uid}`}>
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
        <radialGradient id={`beam${uid}`} cx="0" cy="0.5" r="1">
          <stop offset="0%" stopColor="#fffbe6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fffbe6" stopOpacity="0" />
        </radialGradient>
        <style>{`
          .spin${uid}{animation:${driving ? `carspin .45s linear infinite` : "none"};transform-box:fill-box;transform-origin:center}
          @keyframes carspin{to{transform:rotate(360deg)}}
        `}</style>
      </defs>

      {/* ground shadow */}
      <ellipse cx="204" cy="152" rx="186" ry="9" fill="rgba(0,0,0,0.45)" />

      {/* headlight beam */}
      {lights && <path d={`M${s.head[0]} ${s.head[1]} L400 ${s.head[1] - 30} L400 ${s.head[1] + 40} Z`} fill={`url(#beam${uid})`} />}

      {/* body */}
      <path d={s.body} fill={`url(#paint${uid})`} stroke={dark} strokeWidth="1.5" />
      {/* shoulder highlight */}
      <path
        d={`M40 ${s.rideY - 34} Q200 ${s.rideY - 44} 372 ${s.rideY - 34}`}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* lower body / sill */}
      <path d={`M40 ${s.rideY - 6} L372 ${s.rideY - 6}`} stroke={dark} strokeWidth="5" strokeLinecap="round" opacity="0.7" />

      {/* glass */}
      <path d={s.glass} fill={`url(#glass${uid})`} stroke="#0f172a" strokeWidth="2" />
      <path
        d={`M${s.pillar - 70} ${s.roofY + 14} L${s.pillar - 40} ${s.roofY + 14} L${s.pillar - 70} ${s.roofY + 34} Z`}
        fill="rgba(255,255,255,0.22)"
      />
      {s.pillar < 400 && <rect x={s.pillar - 3} y={s.roofY + 6} width="6" height={70 - (s.roofY - 22)} fill="#0b1220" />}
      {/* chrome window trim */}
      <path d={s.glass} fill="none" stroke="rgba(226,232,240,0.6)" strokeWidth="1" />

      {/* doors and handles */}
      {s.doors.map((x) => (
        <g key={x}>
          <line x1={x} y1={s.roofY + 40} x2={x - 2} y2={s.rideY - 8} stroke={dark} strokeWidth="1.5" opacity="0.8" />
          <rect x={x - 34} y={s.rideY - 42} width="16" height="4" rx="2" fill={shade(color, 70)} stroke={dark} strokeWidth="0.6" />
        </g>
      ))}

      {/* mirror */}
      <path
        d={`M${s.mirror[0]} ${s.mirror[1]} l-4 -10 q8 -4 16 0 l-2 10 z`}
        fill={`url(#paint${uid})`}
        stroke={dark}
        strokeWidth="1"
      />

      {/* lights */}
      <path d={`M${s.head[0] - 22} ${s.head[1] - 5} L${s.head[0] + 6} ${s.head[1] - 3} L${s.head[0] + 4} ${s.head[1] + 6} L${s.head[0] - 22} ${s.head[1] + 5} Z`} fill={lights ? "#fffbea" : "#e2e8f0"} stroke="#64748b" strokeWidth="1" />
      {lights && <circle cx={s.head[0] - 6} cy={s.head[1]} r="10" fill="#fff7c2" opacity="0.6" />}
      <path d={`M${s.tail[0] - 4} ${s.tail[1] - 6} L${s.tail[0] + 20} ${s.tail[1] - 5} L${s.tail[0] + 20} ${s.tail[1] + 6} L${s.tail[0] - 2} ${s.tail[1] + 6} Z`} fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1" />
      {lights && <circle cx={s.tail[0] + 8} cy={s.tail[1]} r="9" fill="#ef4444" opacity="0.45" />}

      {/* grille / front intake */}
      {body === "luxury" || body === "suv" ? (
        <rect x={s.head[0] - 4} y={s.head[1] + 8} width="10" height="18" rx="2" fill="#cbd5e1" stroke="#475569" />
      ) : (
        <path d={`M${s.head[0] - 30} ${s.rideY - 12} L${s.head[0] + 6} ${s.rideY - 14}`} stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      )}
      {body === "super" && <path d="M236 100 L282 98 L268 116 L240 116 Z" fill="#0b1220" opacity="0.85" />}
      {body === "super" && <path d="M30 104 L70 100 L72 104 L34 108 Z" fill={dark} />}
      {body === "sports" && <path d="M32 92 L60 86 L64 90 L36 96 Z" fill={dark} />}

      {/* wheels */}
      {s.wheels.map((x) => (
        <g key={x}>
          <circle cx={x} cy={s.rideY - 2} r={s.wheelR + 6} fill="#0b0f19" />
          <circle cx={x} cy={s.rideY} r={s.wheelR} fill="#111" />
          <circle cx={x} cy={s.rideY} r={s.wheelR - 3} fill="#1f2937" />
          {sporty && (
            <rect x={x - 10} y={s.rideY - s.wheelR + 8} width="12" height="9" rx="2" fill="#dc2626" />
          )}
          <g className={`spin${uid}`}>
            <circle cx={x} cy={s.rideY} r={s.wheelR - 8} fill={`url(#rim${uid})`} />
            {[0, 72, 144, 216, 288].map((a) => (
              <rect
                key={a}
                x={x - 2.5}
                y={s.rideY - (s.wheelR - 9)}
                width="5"
                height={s.wheelR - 11}
                rx="2"
                fill="#334155"
                transform={`rotate(${a} ${x} ${s.rideY})`}
              />
            ))}
            <circle cx={x} cy={s.rideY} r="5" fill="#0f172a" />
            <circle cx={x} cy={s.rideY} r="2" fill="#e2e8f0" />
          </g>
        </g>
      ))}
    </svg>
  );
}
