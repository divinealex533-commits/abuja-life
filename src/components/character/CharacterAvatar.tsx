import { useId } from "react";

import { normalizeAppearance, shade, type Appearance } from "@/lib/character/appearance";

/**
 * Animated full-body character drawn in SVG.
 * Breathes and blinks; skin, hair, face, outfit and accessories
 * come from the player's saved appearance.
 */
export default function CharacterAvatar({
  appearance,
  size = 220,
  animated = true,
  className = "",
}: {
  appearance: Partial<Appearance> | null | undefined;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const a = normalizeAppearance(appearance);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const skinShadow = shade(a.skin, -25);
  const outfitShadow = shade(a.outfitColor, -35);
  const trousers = a.outfit === "suit" ? "#1f2937" : a.outfit === "tshirt" ? "#1e3a8a" : outfitShadow;
  const longGarment = a.outfit === "agbada" || a.outfit === "kaftan" || a.outfit === "ankara";

  return (
    <svg
      viewBox="0 0 160 230"
      width={size * (160 / 230)}
      height={size}
      className={className}
      role="img"
      aria-label="Player character"
    >
      <defs>
        <style>{`
          .b${uid}{animation:${animated ? `breathe${uid} 3.4s ease-in-out infinite` : "none"};transform-origin:80px 200px}
          .e${uid}{animation:${animated ? `blink${uid} 4.6s infinite` : "none"};transform-box:fill-box;transform-origin:center}
          .h${uid}{animation:${animated ? `bob${uid} 3.4s ease-in-out infinite` : "none"};transform-origin:80px 110px}
          @keyframes breathe${uid}{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.012)}}
          @keyframes bob${uid}{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.4px)}}
          @keyframes blink${uid}{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)}}
        `}</style>
        <pattern id={`ankara${uid}`} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill={a.outfitColor} />
          <circle cx="7" cy="7" r="3.2" fill={shade(a.outfitColor, 50)} />
          <path d="M0 0 L7 7 L14 0" stroke={outfitShadow} strokeWidth="1.6" fill="none" />
        </pattern>
        <radialGradient id={`shadow${uid}`}>
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="80" cy="222" rx="44" ry="6" fill={`url(#shadow${uid})`} />

      <g className={`b${uid}`}>
        {/* hair behind head (afro, long, braids, dreads) */}
        {a.hair === "afro" && <circle cx="80" cy="56" r="44" fill={a.hairColor} />}
        {a.hair === "long" && <path d="M44 60 Q42 120 58 132 L102 132 Q118 120 116 60 Z" fill={a.hairColor} />}
        {a.hair === "braids" && (
          <g stroke={a.hairColor} strokeWidth="5" strokeLinecap="round">
            {[50, 58, 102, 110].map((x) => (
              <line key={x} x1={x} y1="62" x2={x + (x < 80 ? -4 : 4)} y2="128" />
            ))}
          </g>
        )}
        {a.hair === "dreads" && (
          <g stroke={a.hairColor} strokeWidth="6" strokeLinecap="round">
            {[48, 56, 104, 112].map((x) => (
              <line key={x} x1={x} y1="58" x2={x + (x < 80 ? -6 : 6)} y2="112" />
            ))}
          </g>
        )}
        {a.outfit === "hoodie" && <path d="M48 96 Q80 70 112 96 L108 110 L52 110 Z" fill={outfitShadow} />}

        {/* legs + shoes */}
        {!longGarment && (
          <>
            <rect x="60" y="160" width="16" height="50" rx="6" fill={trousers} />
            <rect x="84" y="160" width="16" height="50" rx="6" fill={trousers} />
          </>
        )}
        {longGarment && (
          <>
            <rect x="64" y="196" width="12" height="16" rx="4" fill={trousers} />
            <rect x="84" y="196" width="12" height="16" rx="4" fill={trousers} />
          </>
        )}
        <ellipse cx="66" cy="213" rx="12" ry="6" fill="#111" />
        <ellipse cx="94" cy="213" rx="12" ry="6" fill="#111" />

        {/* arms */}
        <rect x="34" y="102" width="16" height="58" rx="8" fill={a.outfit === "tshirt" ? a.skin : a.outfit === "agbada" ? a.outfitColor : outfitShadow} />
        <rect x="110" y="102" width="16" height="58" rx="8" fill={a.outfit === "tshirt" ? a.skin : a.outfit === "agbada" ? a.outfitColor : outfitShadow} />
        {a.outfit === "tshirt" && (
          <>
            <rect x="34" y="100" width="16" height="20" rx="7" fill={a.outfitColor} />
            <rect x="110" y="100" width="16" height="20" rx="7" fill={a.outfitColor} />
          </>
        )}
        <circle cx="42" cy="162" r="8" fill={a.skin} />
        <circle cx="118" cy="162" r="8" fill={a.skin} />

        {/* torso / outfit */}
        {a.outfit === "agbada" ? (
          <path d="M30 104 Q80 88 130 104 L140 200 L20 200 Z" fill={a.outfitColor} />
        ) : a.outfit === "kaftan" ? (
          <path d="M48 100 Q80 90 112 100 L116 200 L44 200 Z" fill={a.outfitColor} />
        ) : a.outfit === "ankara" ? (
          <path d="M50 100 Q80 92 110 100 L122 200 L38 200 Z" fill={`url(#ankara${uid})`} />
        ) : (
          <path d="M48 100 Q80 90 112 100 L110 166 L50 166 Z" fill={a.outfit === "suit" ? "#1f2937" : a.outfitColor} />
        )}

        {/* outfit details */}
        {a.outfit === "suit" && (
          <>
            <path d="M68 98 L80 128 L92 98 Z" fill="#f8fafc" />
            <path d="M78 104 L82 104 L84 132 L80 138 L76 132 Z" fill={a.outfitColor} />
            <path d="M66 98 L80 130 L58 112 Z" fill="#111827" />
            <path d="M94 98 L80 130 L102 112 Z" fill="#111827" />
          </>
        )}
        {a.outfit === "hoodie" && (
          <>
            <rect x="62" y="136" width="36" height="16" rx="6" fill={outfitShadow} />
            <line x1="74" y1="100" x2="72" y2="124" stroke="#f8fafc" strokeWidth="2" />
            <line x1="86" y1="100" x2="88" y2="124" stroke="#f8fafc" strokeWidth="2" />
          </>
        )}
        {(a.outfit === "agbada" || a.outfit === "kaftan") && (
          <path d="M66 98 Q80 118 94 98" stroke="#fbbf24" strokeWidth="3" fill="none" strokeDasharray="3 2" />
        )}
        {a.outfit === "tshirt" && <path d="M70 98 Q80 106 90 98" stroke={outfitShadow} strokeWidth="3" fill="none" />}

        {a.accessory === "chain" && <path d="M66 100 Q80 124 94 100" stroke="#fbbf24" strokeWidth="2.5" fill="none" />}

        {/* neck */}
        <rect x="72" y="86" width="16" height="16" rx="4" fill={skinShadow} />

        <g className={`h${uid}`}>
          {/* ears */}
          <ellipse cx="49" cy="62" rx="6" ry="8" fill={skinShadow} />
          <ellipse cx="111" cy="62" rx="6" ry="8" fill={skinShadow} />
          {a.accessory === "earrings" && (
            <>
              <circle cx="49" cy="72" r="3" fill="#fbbf24" />
              <circle cx="111" cy="72" r="3" fill="#fbbf24" />
            </>
          )}

          {/* head */}
          <ellipse cx="80" cy="60" rx="31" ry="35" fill={a.skin} />

          {/* hair on top */}
          {a.hair === "lowcut" && <path d="M50 52 Q52 24 80 24 Q108 24 110 52 Q96 38 80 38 Q64 38 50 52 Z" fill={a.hairColor} />}
          {a.hair === "waves" && (
            <g>
              <path d="M50 52 Q52 24 80 24 Q108 24 110 52 Q96 38 80 38 Q64 38 50 52 Z" fill={a.hairColor} />
              <path d="M58 36 Q64 32 70 36 Q76 32 82 36 Q88 32 94 36 Q100 32 104 38" stroke={shade(a.hairColor, 40)} strokeWidth="1.2" fill="none" />
            </g>
          )}
          {a.hair === "afro" && <path d="M48 56 Q46 22 80 20 Q114 22 112 56 Q100 34 80 34 Q60 34 48 56 Z" fill={a.hairColor} />}
          {(a.hair === "braids" || a.hair === "dreads") && (
            <path d="M48 58 Q48 22 80 22 Q112 22 112 58 Q104 34 80 34 Q56 34 48 58 Z" fill={a.hairColor} />
          )}
          {a.hair === "bun" && (
            <>
              <circle cx="80" cy="20" r="12" fill={a.hairColor} />
              <path d="M49 56 Q50 24 80 24 Q110 24 111 56 Q100 34 80 34 Q60 34 49 56 Z" fill={a.hairColor} />
            </>
          )}
          {a.hair === "long" && <path d="M48 62 Q46 22 80 22 Q114 22 112 62 Q104 32 80 32 Q56 32 48 62 Z" fill={a.hairColor} />}

          {/* eyebrows */}
          <path d="M62 48 Q68 44 74 48" stroke={a.hair === "bald" ? "#1b1b1b" : a.hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M86 48 Q92 44 98 48" stroke={a.hair === "bald" ? "#1b1b1b" : a.hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* eyes */}
          <g className={`e${uid}`}>
            {a.eyes === "happy" ? (
              <>
                <path d="M62 60 Q68 54 74 60" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M86 60 Q92 54 98 60" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="68" cy="59" rx={a.eyes === "sharp" ? 6 : 5} ry={a.eyes === "sharp" ? 3.5 : 5} fill="#fff" />
                <ellipse cx="92" cy="59" rx={a.eyes === "sharp" ? 6 : 5} ry={a.eyes === "sharp" ? 3.5 : 5} fill="#fff" />
                <circle cx="69" cy="59.5" r="2.8" fill="#2b1a10" />
                <circle cx="93" cy="59.5" r="2.8" fill="#2b1a10" />
                <circle cx="70" cy="58.5" r="0.9" fill="#fff" />
                <circle cx="94" cy="58.5" r="0.9" fill="#fff" />
              </>
            )}
          </g>

          {/* nose */}
          <path d="M80 62 Q77 72 80 74 Q83 74 84 72" stroke={skinShadow} strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* facial hair */}
          {a.facialHair === "beard" && (
            <path d="M52 66 Q54 96 80 98 Q106 96 108 66 Q104 84 80 86 Q56 84 52 66 Z" fill={a.hair === "bald" ? "#1b1b1b" : a.hairColor} />
          )}
          {a.facialHair === "goatee" && <path d="M72 84 Q80 96 88 84 Q80 88 72 84 Z" fill={a.hair === "bald" ? "#1b1b1b" : a.hairColor} />}
          {(a.facialHair === "moustache" || a.facialHair === "beard") && (
            <path d="M70 77 Q80 73 90 77 Q80 80 70 77 Z" fill={a.hair === "bald" ? "#1b1b1b" : a.hairColor} />
          )}

          {/* mouth */}
          {a.mouth === "smile" && <path d="M71 82 Q80 89 89 82" stroke="#5b2a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
          {a.mouth === "grin" && <path d="M70 81 Q80 93 90 81 Z" fill="#5b2a1a" stroke="#5b2a1a" strokeWidth="1.5" strokeLinejoin="round" />}
          {a.mouth === "grin" && <path d="M72 82 L88 82 L86 85 L74 85 Z" fill="#fff" />}
          {a.mouth === "calm" && <path d="M73 83 L87 83" stroke="#5b2a1a" strokeWidth="2.5" strokeLinecap="round" />}

          {/* head accessories */}
          {a.accessory === "glasses" && (
            <g stroke="#111" strokeWidth="2" fill="rgba(255,255,255,0.12)">
              <circle cx="68" cy="59" r="8" />
              <circle cx="92" cy="59" r="8" />
              <line x1="76" y1="59" x2="84" y2="59" />
            </g>
          )}
          {a.accessory === "shades" && (
            <g fill="#0b0b0b">
              <rect x="58" y="53" width="20" height="12" rx="5" />
              <rect x="82" y="53" width="20" height="12" rx="5" />
              <rect x="76" y="56" width="8" height="3" />
            </g>
          )}
          {a.accessory === "cap" && (
            <g>
              <path d="M48 46 Q50 18 80 18 Q110 18 112 46 Z" fill={a.outfitColor} />
              <path d="M78 44 Q110 40 124 48 Q104 50 78 48 Z" fill={outfitShadow} />
            </g>
          )}
          {a.accessory === "gele" && (
            <g>
              <path d="M42 46 Q40 6 80 8 Q122 6 118 46 Q100 30 80 32 Q60 30 42 46 Z" fill={a.outfitColor} />
              <path d="M56 20 Q80 2 104 20" stroke={shade(a.outfitColor, 45)} strokeWidth="4" fill="none" />
              <path d="M96 14 Q126 4 120 34" stroke={outfitShadow} strokeWidth="6" fill="none" strokeLinecap="round" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
