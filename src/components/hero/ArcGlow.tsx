import type { CSSProperties } from "react";

// Lengths are design pixels at 1440px, multiplied by --s (scale) and
// positioned relative to --cy (the arc's centre line inside the parent).
const s = (n: number) => `calc(${n}px * var(--s))`;
const fromCenter = (n: number) => `calc(var(--cy) + ${n}px * var(--s))`;

function Blob({ size, height, offsetY, style }: { size: number; height?: number; offsetY: number; style: CSSProperties }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ width: s(size), height: s(height ?? size), top: fromCenter(offsetY), ...style }}
    />
  );
}

export function ArcGlow({ sweep = true }: { sweep?: boolean }) {
  return (
    <>
      <Blob
        size={823}
        offsetY={0}
        style={{ background: "radial-gradient(50% 50% at 50% 50%, #46e8ff 0%, #4658ff 27%, rgba(3,0,10,0) 100%)", opacity: 0.22 }}
      />
      <Blob
        size={560}
        height={448}
        offsetY={-111}
        style={{ background: "radial-gradient(ellipse at center, rgba(70,31,168,0.5) 0%, rgba(46,53,255,0.25) 45%, transparent 70%)" }}
      />
      <Blob
        size={298}
        offsetY={34}
        style={{ background: "radial-gradient(circle at center, rgba(187,15,255,0.35) 0%, rgba(187,15,255,0.1) 45%, transparent 70%)" }}
      />
      <Blob size={1060} offsetY={130} style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }} />
      <Blob size={780} offsetY={130} style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }} />
      {sweep && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: s(460), height: s(460), top: fromCenter(-12) }}
        >
          <div
            className="size-full rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(190,160,255,0) 0deg, rgba(190,160,255,0) 290deg, rgba(190,160,255,0.28) 355deg, rgba(190,160,255,0) 360deg)",
              maskImage: "radial-gradient(circle, #000 20%, transparent 70%)",
              animation: "spin-slow 7s linear infinite",
            }}
          />
        </div>
      )}
    </>
  );
}
