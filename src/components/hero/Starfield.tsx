import type { CSSProperties } from "react";

// Small seeded PRNG: the field is identical on server and client, so hydration never mismatches.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TINTS = ["#ffffff", "#ffffff", "#d9d2ff", "#bfe9ff"];

const rand = mulberry32(7);
const STARS = Array.from({ length: 70 }, () => ({
  x: Number((rand() * 100).toFixed(2)),
  y: Number((rand() * 100).toFixed(2)),
  size: Number((0.8 + rand() * 1.4).toFixed(1)),
  low: Number((0.15 + rand() * 0.3).toFixed(2)),
  duration: Number((2.8 + rand() * 4).toFixed(2)),
  delay: Number((-rand() * 6).toFixed(2)),
  tint: TINTS[Math.floor(rand() * TINTS.length)],
}));

/**
 * Softly twinkling stars for the hero's top area. Fills its (positioned) parent and fades out
 * toward the bottom so nothing crowds the logo or the boundary line.
 */
export function Starfield() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ maskImage: "linear-gradient(180deg,#000 0%,#000 55%,transparent 100%)", WebkitMaskImage: "linear-gradient(180deg,#000 0%,#000 55%,transparent 100%)" }}
    >
      {STARS.map((s, i) => {
        const style: CSSProperties = {
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          background: s.tint,
          opacity: s.low,
          animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          ["--lo" as string]: s.low,
          borderRadius: "50%",
          boxShadow: `0 0 ${Math.round(s.size * 3)}px ${s.tint}`,
        };
        return <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={style} />;
      })}
    </div>
  );
}
