"use client";

import { useEffect, useId, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

// Product photos shown inside the bubbles of the interactive arc (public/images/arc, cropped from
// the product shots in public/images). One per bubble: 6 on the outer ring, 5 on the inner.
const GARMENT_PHOTOS = [
  "trench_coat",
  "heel_pumps",
  "leather_tote",
  "white_sneakers",
  "silk_blouse",
  "sunglasses",
  "white_oxford",
  "satin_dress",
  "velvet_skirt",
  "pearl_necklace",
  "blazer",
].map((name) => `/images/arc/${name}.webp`);

type Stop = [number, string];

const OUTER_STOPS: Stop[] = [
  [0, "#3d5fcf"],
  [0.25, "#5a6af2"],
  [0.45, "#9d5bff"],
  [0.6, "#a45cff"],
  [0.8, "#8656f3"],
  [1, "#5e4bd4"],
];
const INNER_STOPS: Stop[] = [
  [0, "#2fa77e"],
  [0.2, "#3fb89b"],
  [0.4, "#55a6d6"],
  [0.55, "#6e98f2"],
  [0.75, "#6a7ef0"],
  [1, "#5454d2"],
];

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorAt(stops: Stop[], t: number) {
  const i = Math.max(1, stops.findIndex(([p]) => p >= t));
  const [p0, c0] = stops[i - 1];
  const [p1, c1] = stops[i];
  const k = p1 === p0 ? 0 : (t - p0) / (p1 - p0);
  const a = hexToRgb(c0);
  const b = hexToRgb(c1);
  const mix = a.map((v, j) => Math.round(v + (b[j] - v) * k));
  return `rgb(${mix.join(",")})`;
}

// Values are rounded so server and client markup match exactly.
// Hands out garment indices in order across both rings (the same on server and client).
const nextGarment = (() => {
  let n = 0;
  return () => n++ % GARMENT_PHOTOS.length;
})();

function ring(count: number, radius: number, dot: number, stops: Stop[], wavePhase: number, iconEvery: number, iconAt: number) {
  const cx = 310;
  const cy = 300;
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const angle = Math.PI * (1.03 - t * 1.06);
    const lift = Math.sin(angle);
    return {
      x: Number((cx + radius * Math.cos(angle)).toFixed(2)),
      y: Number((cy - radius * lift).toFixed(2)),
      r: dot,
      fill: colorAt(stops, t),
      opacity: Number(Math.max(0.28, 0.3 + 0.7 * lift).toFixed(2)),
      delay: Number((0.25 + Math.abs(t - 0.5) * 0.9).toFixed(2)),
      // Where along the arc this dot sits, shifted per ring so the two waves trail each other.
      wave: Number((t * Math.PI * 2 * 0.9 + wavePhase).toFixed(3)),
      // Index of the garment shown in this dot in the interactive arc, or -1 for a plain dot.
      garment: i % iconEvery === iconAt ? nextGarment() : -1,
    };
  });
}

const OUTER = ring(18, 282, 17, OUTER_STOPS, 0, 3, 1);
const INNER = ring(15, 228, 14, INNER_STOPS, Math.PI / 2, 3, 2);
const DOTS = [...OUTER, ...INNER];

// Dots that carry a photo are drawn larger so the garment stays readable.
const GARMENT_BUBBLE = 1.55;

// Cursor influence, in SVG units (the viewBox is 620 wide).
const REACH = 150;
const PUSH = 26;
const OFFSCREEN = -9999;

type Dot = (typeof DOTS)[number];

function InteractiveDot({
  d,
  uid,
  mx,
  my,
  phase,
}: {
  d: Dot;
  uid: string;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  phase: MotionValue<number>;
}) {
  const hasGarment = d.garment >= 0;
  const r = hasGarment ? d.r * GARMENT_BUBBLE : d.r;
  // Photos stay clearly visible even on the dim outer dots.
  const baseOpacity = hasGarment ? Math.max(d.opacity, 0.72) : d.opacity;

  // One pass computes everything: the dot is pushed away from the cursor and swells near it,
  // while a slow wave travelling along the arc breathes its size and brightness.
  const field = useTransform([mx, my, phase], ([x, y, p]: number[]) => {
    const dx = d.x - x;
    const dy = d.y - y;
    const dist = Math.hypot(dx, dy) || 1;
    const k = Math.max(0, 1 - dist / REACH);
    const near = k * k;
    const wave = 0.5 + 0.5 * Math.sin(p - d.wave);
    return [
      (dx / dist) * near * PUSH,
      (dy / dist) * near * PUSH,
      1 + near * 0.75 + wave * 0.14,
      Math.min(1, baseOpacity * (0.78 + 0.32 * wave) + near * 0.55),
    ];
  });
  const x = useTransform(field, (v) => v[0]);
  const y = useTransform(field, (v) => v[1]);
  const scale = useTransform(field, (v) => v[2]);
  const opacity = useTransform(field, (v) => v[3]);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: d.delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      <motion.g style={{ x, y, scale, opacity, transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx={d.x} cy={d.y} r={r} fill={d.fill} />
        {hasGarment && (
          <>
            <image
              href={GARMENT_PHOTOS[d.garment]}
              x={d.x - r + 1.2}
              y={d.y - r + 1.2}
              width={(r - 1.2) * 2}
              height={(r - 1.2) * 2}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${uid}-round)`}
            />
            <circle cx={d.x} cy={d.y} r={r - 1.2} fill={`url(#${uid}-bubble)`} />
            <circle cx={d.x} cy={d.y} r={r - 0.6} fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.2" />
          </>
        )}
      </motion.g>
    </motion.g>
  );
}

function InteractiveArc({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId();
  const reduced = useReducedMotion();
  const rawX = useMotionValue(OFFSCREEN);
  const rawY = useMotionValue(OFFSCREEN);
  const mx = useSpring(rawX, { stiffness: 170, damping: 20, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 170, damping: 20, mass: 0.6 });
  const phase = useMotionValue(0);

  useEffect(() => {
    if (reduced) return;
    const loop = animate(phase, Math.PI * 2, { duration: 5.5, ease: "linear", repeat: Infinity });
    return () => loop.stop();
  }, [reduced, phase]);

  useEffect(() => {
    if (reduced) return;
    let active = false;

    const leave = () => {
      active = false;
      // jump() so the springs don't sweep across the arc on their way off-screen.
      rawX.set(OFFSCREEN);
      rawY.set(OFFSCREEN);
      mx.jump(OFFSCREEN);
      my.jump(OFFSCREEN);
    };
    const move = (e: PointerEvent) => {
      const box = svgRef.current?.getBoundingClientRect();
      if (!box || box.width === 0) return;
      const k = 620 / box.width;
      const x = (e.clientX - box.left) * k;
      const y = (e.clientY - box.top) * k;
      rawX.set(x);
      rawY.set(y);
      if (!active) {
        active = true;
        mx.jump(x);
        my.jump(y);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", leave);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [reduced, rawX, rawY, mx, my]);

  return (
    <svg ref={svgRef} viewBox="0 0 620 320" className={cn("w-full overflow-visible", className)} aria-hidden>
      <defs>
        {/* One shared circular clip: objectBoundingBox units, so it fits each photo wherever it sits. */}
        <clipPath id={`${uid}-round`} clipPathUnits="objectBoundingBox">
          <circle cx=".5" cy=".5" r=".5" />
        </clipPath>
        {/* Soft glass highlight over the photo, top-left. */}
        <radialGradient id={`${uid}-bubble`} cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      {DOTS.map((d, i) => (
        <InteractiveDot key={i} d={d} uid={uid} mx={mx} my={my} phase={phase} />
      ))}
    </svg>
  );
}

/** `interactive` adds the cursor reaction and the travelling wave; off by default so other pages keep the still arc. */
export function DotArc({ className, interactive = false }: { className?: string; interactive?: boolean }) {
  if (interactive) return <InteractiveArc className={className} />;

  return (
    <svg viewBox="0 0 620 320" className={cn("w-full overflow-visible", className)} aria-hidden>
      {DOTS.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={d.fill}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: d.opacity, scale: 1 }}
          transition={{ duration: 0.8, delay: d.delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
    </svg>
  );
}
