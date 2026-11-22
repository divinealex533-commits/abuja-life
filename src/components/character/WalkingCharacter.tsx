import { normalizeAppearance, shade, type Appearance } from "@/lib/character/appearance";

export type Facing = "down" | "up" | "left" | "right";

/**
 * The player's character for the walkable city, drawn from 4 sides.
 * Turns to face where it's going; arms and legs swing while walking.
 */
export default function WalkingCharacter({
  appearance,
  facing,
  walking,
  running = false,
  size = 120,
}: {
  appearance: Partial<Appearance> | null | undefined;
  facing: Facing;
  walking: boolean;
  running?: boolean;
  size?: number;
}) {
  const a = normalizeAppearance(appearance);
  const skinShadow = shade(a.skin, -25);
  const hairColor = a.hair === "bald" ? skinShadow : a.hairColor;
  const outfitShadow = shade(a.outfitColor, -35);
  const top = a.outfit === "suit" ? "#1f2937" : a.outfitColor;
  const trousers = a.outfit === "suit" ? "#1f2937" : a.outfit === "tshirt" ? "#1e3a8a" : outfitShadow;
  const sleeve = a.outfit === "tshirt" ? a.skin : a.outfit === "agbada" ? a.outfitColor : outfitShadow;
  const robe = a.outfit === "agbada" || a.outfit === "kaftan" || a.outfit === "ankara";
  const speed = running ? "0.32s" : "0.5s";
  const side = facing === "left" || facing === "right";

  // Swing helpers: CSS classes are no-ops when standing still.
  const swing = (name: string) => (walking ? `wc-${name}` : "");

  return (
    <svg
      viewBox="0 0 100 150"
      width={size * (100 / 150)}
      height={size}
      role="img"
      aria-label="Your character"
      style={{ overflow: "visible" }}
    >
      <style>{`
        .wc-legA{animation:wc-swingA ${speed} ease-in-out infinite alternate}
        .wc-legB{animation:wc-swingB ${speed} ease-in-out infinite alternate}
        .wc-stepA{animation:wc-stepA ${speed} ease-in-out infinite alternate}
        .wc-stepB{animation:wc-stepB ${speed} ease-in-out infinite alternate}
        .wc-body{animation:wc-bob ${speed} ease-in-out infinite}
        .wc-idle{animation:wc-breathe 3.2s ease-in-out infinite}
        @keyframes wc-swingA{from{transform:rotate(26deg)}to{transform:rotate(-26deg)}}
        @keyframes wc-swingB{from{transform:rotate(-26deg)}to{transform:rotate(26deg)}}
        @keyframes wc-stepA{from{transform:translateY(0)}to{transform:translateY(-5px)}}
        @keyframes wc-stepB{from{transform:translateY(-5px)}to{transform:translateY(0)}}
        @keyframes wc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
        @keyframes wc-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.012)}}
      `}</style>

      <ellipse cx="50" cy="146" rx={side ? 18 : 22} ry="4.5" fill="rgba(0,0,0,0.3)" />

      <g className={walking ? "wc-body" : "wc-idle"} style={{ transformOrigin: "50px 146px" }}>
        {/* The left-facing pose is the right-facing pose mirrored. */}
        <g style={facing === "left" ? { transform: "scaleX(-1)", transformOrigin: "50px 75px" } : undefined}>
          {side ? (
            <SideView a={a} hairColor={hairColor} skinShadow={skinShadow} top={top} trousers={trousers} sleeve={sleeve} robe={robe} swing={swing} outfitShadow={outfitShadow} />
          ) : facing === "up" ? (
            <BackView a={a} hairColor={hairColor} skinShadow={skinShadow} top={top} trousers={trousers} sleeve={sleeve} robe={robe} swing={swing} outfitShadow={outfitShadow} />
          ) : (
            <FrontView a={a} hairColor={hairColor} skinShadow={skinShadow} top={top} trousers={trousers} sleeve={sleeve} robe={robe} swing={swing} outfitShadow={outfitShadow} />
          )}
        </g>
      </g>
    </svg>
  );
}

interface ViewProps {
  a: Appearance;
  hairColor: string;
  skinShadow: string;
  top: string;
  trousers: string;
  sleeve: string;
  robe: boolean;
  outfitShadow: string;
  swing: (name: string) => string;
}

/** Legs, shoes and the lower garment for front/back views. */
function FrontBackLegs({ trousers, robe, swing }: Pick<ViewProps, "trousers" | "robe" | "swing">) {
  return (
    <>
      <g className={swing("stepA")}>
        <rect x="38" y={robe ? 118 : 100} width="10" height={robe ? 18 : 36} rx="4" fill={trousers} />
        <ellipse cx="42" cy="138" rx="7.5" ry="4" fill="#111" />
      </g>
      <g className={swing("stepB")}>
        <rect x="52" y={robe ? 118 : 100} width="10" height={robe ? 18 : 36} rx="4" fill={trousers} />
        <ellipse cx="58" cy="138" rx="7.5" ry="4" fill="#111" />
      </g>
    </>
  );
}

function Torso({ a, top, robe }: Pick<ViewProps, "a" | "top" | "robe">) {
  if (a.outfit === "agbada") return <path d="M22 66 Q50 56 78 66 L86 126 L14 126 Z" fill={top} />;
  if (robe) return <path d="M32 64 Q50 57 68 64 L72 126 L28 126 Z" fill={top} />;
  return <path d="M32 64 Q50 57 68 64 L67 104 L33 104 Z" fill={top} />;
}

function Arms({ a, sleeve, swing, flipFirst }: Pick<ViewProps, "a" | "sleeve" | "swing"> & { flipFirst?: boolean }) {
  const arm = (x: number, cls: string, hand: number) => (
    <g className={swing(cls)} style={{ transformOrigin: `${x + 4}px 66px` }}>
      <rect x={x} y="64" width="9" height="38" rx="4.5" fill={sleeve} />
      {a.outfit === "tshirt" && <rect x={x} y="63" width="9" height="12" rx="4" fill={a.outfitColor} />}
      <circle cx={x + 4.5} cy={hand} r="5" fill={a.skin} />
    </g>
  );
  return (
    <>
      {arm(22, flipFirst ? "legB" : "legA", 103)}
      {arm(69, flipFirst ? "legA" : "legB", 103)}
    </>
  );
}

function BackHair({ a, hairColor }: Pick<ViewProps, "a" | "hairColor">) {
  if (a.hair === "afro") return <circle cx="50" cy="34" r="27" fill={hairColor} />;
  if (a.hair === "long") return <path d="M29 36 Q28 78 38 84 L62 84 Q72 78 71 36 Z" fill={hairColor} />;
  if (a.hair === "braids" || a.hair === "dreads")
    return (
      <g stroke={hairColor} strokeWidth={a.hair === "dreads" ? 4.5 : 3.5} strokeLinecap="round">
        {[33, 39, 61, 67].map((x) => (
          <line key={x} x1={x} y1="38" x2={x + (x < 50 ? -3 : 3)} y2="80" />
        ))}
      </g>
    );
  if (a.hair === "bun") return <circle cx="50" cy="13" r="8" fill={hairColor} />;
  return null;
}

function HeadWear({ a, outfitShadow }: Pick<ViewProps, "a" | "outfitShadow">) {
  if (a.accessory === "cap")
    return <path d="M30 30 Q31 12 50 12 Q69 12 70 30 Z" fill={a.outfitColor} stroke={outfitShadow} strokeWidth="1" />;
  if (a.accessory === "gele")
    return (
      <g>
        <path d="M26 30 Q24 2 50 4 Q76 2 74 30 Q62 20 50 21 Q38 20 26 30 Z" fill={a.outfitColor} />
        <path d="M36 12 Q50 2 64 12" stroke={shade(a.outfitColor, 45)} strokeWidth="3" fill="none" />
      </g>
    );
  return null;
}

function FrontView(p: ViewProps) {
  const { a, hairColor, skinShadow } = p;
  return (
    <>
      <BackHair a={a} hairColor={hairColor} />
      <FrontBackLegs trousers={p.trousers} robe={p.robe} swing={p.swing} />
      <Arms a={a} sleeve={p.sleeve} swing={p.swing} />
      <Torso a={a} top={p.top} robe={p.robe} />
      {a.outfit === "suit" && <path d="M44 61 L50 80 L56 61 Z" fill="#f8fafc" />}
      {a.outfit === "suit" && <path d="M49 64 L51 64 L52 82 L50 85 L48 82 Z" fill={a.outfitColor} />}
      {(a.outfit === "agbada" || a.outfit === "kaftan") && (
        <path d="M42 61 Q50 74 58 61" stroke="#fbbf24" strokeWidth="2" fill="none" strokeDasharray="2 1.5" />
      )}
      {a.accessory === "chain" && <path d="M42 62 Q50 77 58 62" stroke="#fbbf24" strokeWidth="1.8" fill="none" />}
      <rect x="45" y="52" width="10" height="10" rx="3" fill={skinShadow} />

      {/* head */}
      <ellipse cx="31" cy="39" rx="4" ry="5" fill={skinShadow} />
      <ellipse cx="69" cy="39" rx="4" ry="5" fill={skinShadow} />
      <ellipse cx="50" cy="37" rx="19" ry="21" fill={a.skin} />
      {a.hair !== "bald" && a.hair !== "afro" && (
        <path d="M31 34 Q32 15 50 15 Q68 15 69 34 Q60 24 50 24 Q40 24 31 34 Z" fill={hairColor} />
      )}
      {a.hair === "afro" && <path d="M30 36 Q28 13 50 12 Q72 13 70 36 Q62 22 50 22 Q38 22 30 36 Z" fill={hairColor} />}

      {/* face */}
      <path d="M39 30 Q43 28 46 30" stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M54 30 Q57 28 61 30" stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {a.eyes === "happy" ? (
        <>
          <path d="M39 37 Q42.5 33 46 37" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M54 37 Q57.5 33 61 37" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="42.5" cy="36.5" rx="3.2" ry={a.eyes === "sharp" ? 2.2 : 3.2} fill="#fff" />
          <ellipse cx="57.5" cy="36.5" rx="3.2" ry={a.eyes === "sharp" ? 2.2 : 3.2} fill="#fff" />
          <circle cx="43" cy="37" r="1.8" fill="#2b1a10" />
          <circle cx="58" cy="37" r="1.8" fill="#2b1a10" />
        </>
      )}
      <path d="M50 39 Q48 45 50 46 Q52 46 53 45" stroke={skinShadow} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {a.facialHair === "beard" && <path d="M33 41 Q35 60 50 61 Q65 60 67 41 Q64 52 50 53 Q36 52 33 41 Z" fill={hairColor} />}
      {a.facialHair === "goatee" && <path d="M45 52 Q50 60 55 52 Q50 55 45 52 Z" fill={hairColor} />}
      {(a.facialHair === "moustache" || a.facialHair === "beard") && <path d="M44 48 Q50 45.5 56 48 Q50 50 44 48 Z" fill={hairColor} />}
      {a.mouth === "grin" ? (
        <path d="M44 50 Q50 58 56 50 Z" fill="#5b2a1a" />
      ) : a.mouth === "calm" ? (
        <path d="M45 51.5 L55 51.5" stroke="#5b2a1a" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M44.5 50.5 Q50 55 55.5 50.5" stroke="#5b2a1a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}
      {a.accessory === "shades" && (
        <g fill="#0b0b0b">
          <rect x="37" y="33" width="12" height="7" rx="3" />
          <rect x="51" y="33" width="12" height="7" rx="3" />
          <rect x="48" y="35" width="4" height="1.6" />
        </g>
      )}
      {a.accessory === "glasses" && (
        <g stroke="#111" strokeWidth="1.3" fill="rgba(255,255,255,0.12)">
          <circle cx="42.5" cy="36.5" r="5" />
          <circle cx="57.5" cy="36.5" r="5" />
          <line x1="47.5" y1="36.5" x2="52.5" y2="36.5" />
        </g>
      )}
      {a.accessory === "earrings" && (
        <>
          <circle cx="31" cy="45" r="2" fill="#fbbf24" />
          <circle cx="69" cy="45" r="2" fill="#fbbf24" />
        </>
      )}
      <HeadWear a={a} outfitShadow={p.outfitShadow} />
      {a.accessory === "cap" && <path d="M38 29 Q50 25 62 29 L62 32 Q50 29 38 32 Z" fill={p.outfitShadow} />}
    </>
  );
}

function BackView(p: ViewProps) {
  const { a, hairColor, skinShadow } = p;
  return (
    <>
      <FrontBackLegs trousers={p.trousers} robe={p.robe} swing={p.swing} />
      <Arms a={a} sleeve={p.sleeve} swing={p.swing} flipFirst />
      <Torso a={a} top={p.top} robe={p.robe} />
      {a.outfit === "hoodie" && <path d="M36 60 Q50 72 64 60 L62 70 Q50 78 38 70 Z" fill={p.outfitShadow} />}
      <rect x="45" y="52" width="10" height="10" rx="3" fill={skinShadow} />
      <ellipse cx="31" cy="39" rx="4" ry="5" fill={skinShadow} />
      <ellipse cx="69" cy="39" rx="4" ry="5" fill={skinShadow} />
      <ellipse cx="50" cy="37" rx="19" ry="21" fill={a.skin} />
      {/* back of the head is mostly hair */}
      {a.hair !== "bald" && <path d="M31 38 Q30 15 50 15 Q70 15 69 38 Q68 50 50 52 Q32 50 31 38 Z" fill={hairColor} />}
      {a.hair === "waves" && (
        <path d="M37 28 Q41 25 45 28 Q49 25 53 28 Q57 25 61 28" stroke={shade(hairColor, 40)} strokeWidth="1" fill="none" />
      )}
      <BackHair a={a} hairColor={hairColor} />
      <HeadWear a={a} outfitShadow={p.outfitShadow} />
    </>
  );
}

/** Facing right. Left is drawn by mirroring this. */
function SideView(p: ViewProps) {
  const { a, hairColor, skinShadow, swing } = p;
  const legY = p.robe ? 118 : 100;
  const legH = p.robe ? 18 : 36;
  return (
    <>
      {/* far leg + far arm (darker, behind) */}
      <g className={swing("legB")} style={{ transformOrigin: `50px ${legY}px` }}>
        <rect x="45" y={legY} width="10" height={legH} rx="4" fill={shade(p.trousers, -20)} />
        <ellipse cx="53" cy="138" rx="8" ry="3.8" fill="#000" />
      </g>
      <g className={swing("legA")} style={{ transformOrigin: "50px 66px" }}>
        <rect x="46" y="64" width="8" height="38" rx="4" fill={shade(p.sleeve, -20)} />
        <circle cx="50" cy="103" r="4.5" fill={skinShadow} />
      </g>

      {/* body */}
      {a.outfit === "agbada" ? (
        <path d="M34 64 Q50 58 66 64 L74 126 L26 126 Z" fill={p.top} />
      ) : p.robe ? (
        <path d="M38 64 Q50 59 62 64 L64 126 L36 126 Z" fill={p.top} />
      ) : (
        <path d="M38 64 Q50 59 62 64 L61 104 L39 104 Z" fill={p.top} />
      )}

      {/* near leg */}
      <g className={swing("legA")} style={{ transformOrigin: `50px ${legY}px` }}>
        <rect x="45" y={legY} width="10" height={legH} rx="4" fill={p.trousers} />
        <ellipse cx="53" cy="138" rx="8" ry="3.8" fill="#111" />
      </g>

      <rect x="45" y="52" width="10" height="10" rx="3" fill={skinShadow} />

      {/* head in profile */}
      <BackHair a={a} hairColor={hairColor} />
      <ellipse cx="51" cy="37" rx="18" ry="21" fill={a.skin} />
      <path d="M67 36 Q73 41 68 45" fill={a.skin} stroke={skinShadow} strokeWidth="1.2" />
      {a.hair !== "bald" && (
        <path d="M33 42 Q31 16 52 15 Q68 15 69 28 Q58 22 48 26 Q42 32 42 44 Q37 46 33 42 Z" fill={hairColor} />
      )}
      <ellipse cx="45" cy="40" rx="3.5" ry="5" fill={skinShadow} />
      {a.accessory === "earrings" && <circle cx="45" cy="46.5" r="2" fill="#fbbf24" />}
      <path d="M57 30 Q61 28 64 30" stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {a.eyes === "happy" ? (
        <path d="M58 37 Q61 33.5 64 37" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx="61" cy="36.5" rx="2.6" ry={a.eyes === "sharp" ? 2 : 3} fill="#fff" />
          <circle cx="62.4" cy="37" r="1.7" fill="#2b1a10" />
        </>
      )}
      {a.facialHair === "beard" && <path d="M46 46 Q48 60 60 60 Q68 58 68 48 Q62 54 54 52 Q48 50 46 46 Z" fill={hairColor} />}
      {a.facialHair === "goatee" && <path d="M60 52 Q63 59 67 52 Z" fill={hairColor} />}
      {(a.facialHair === "moustache" || a.facialHair === "beard") && <path d="M60 47.5 Q65 45.5 69 47.5 Q65 49 60 47.5 Z" fill={hairColor} />}
      {a.mouth === "grin" ? (
        <path d="M60 50 Q65 55 68 50 Z" fill="#5b2a1a" />
      ) : (
        <path d={a.mouth === "calm" ? "M61 51 L67 51" : "M60.5 50 Q64.5 53.5 68 50"} stroke="#5b2a1a" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      )}
      {a.accessory === "shades" && <rect x="56" y="33" width="13" height="7" rx="3" fill="#0b0b0b" />}
      {a.accessory === "glasses" && <circle cx="61.5" cy="36.5" r="5" stroke="#111" strokeWidth="1.3" fill="rgba(255,255,255,0.12)" />}
      {a.accessory === "cap" && (
        <g>
          <path d="M32 30 Q33 12 52 12 Q69 12 70 28 Z" fill={a.outfitColor} />
          <path d="M60 27 Q74 25 82 30 Q72 32 60 31 Z" fill={p.outfitShadow} />
        </g>
      )}
      {a.accessory === "gele" && (
        <path d="M30 32 Q28 2 52 4 Q76 4 72 30 Q62 20 50 22 Q40 22 30 32 Z" fill={a.outfitColor} />
      )}
      {a.accessory === "chain" && <path d="M50 62 Q56 70 60 63" stroke="#fbbf24" strokeWidth="1.6" fill="none" />}

      {/* near arm, in front of the body */}
      <g className={swing("legB")} style={{ transformOrigin: "50px 66px" }}>
        <rect x="46" y="64" width="8" height="38" rx="4" fill={p.sleeve} />
        {a.outfit === "tshirt" && <rect x="46" y="63" width="8" height="12" rx="4" fill={a.outfitColor} />}
        <circle cx="50" cy="103" r="4.5" fill={a.skin} />
      </g>
    </>
  );
}
