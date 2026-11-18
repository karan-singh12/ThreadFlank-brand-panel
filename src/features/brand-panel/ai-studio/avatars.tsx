"use client";

import { cn } from "@/lib/utils";

/**
 * The models a brand can put its clothes on. These are the panel's own presets, drawn rather than
 * photographed, so a brand picks a body and a pose by looking instead of reading. The ids are what
 * a shoot request will carry once model rendering is switched on.
 */

export type BuildId = "petite" | "slim" | "regular" | "curve" | "tall" | "broad";
export type PoseId = "front" | "walk" | "turn" | "sit" | "back";

export type ModelAvatar = { id: string; label: string; build: BuildId; skin: string };
export type ModelPose = { id: PoseId; label: string };
export type Backdrop = { id: string; label: string; css: string };

/** Shoulder, waist and hip half-widths in the 40-unit figure, plus overall height. */
const BUILD: Record<BuildId, { sh: number; wa: number; hi: number; scale: number }> = {
  petite: { sh: 6.4, wa: 5.0, hi: 7.0, scale: 0.86 },
  slim: { sh: 6.8, wa: 4.8, hi: 6.8, scale: 0.95 },
  regular: { sh: 7.6, wa: 5.8, hi: 7.8, scale: 0.96 },
  curve: { sh: 8.2, wa: 6.8, hi: 9.6, scale: 0.96 },
  // Nothing goes over 1: the figure is drawn to fill the box, so a taller one would lose its head.
  tall: { sh: 7.2, wa: 5.4, hi: 7.4, scale: 1 },
  broad: { sh: 9.0, wa: 7.6, hi: 8.4, scale: 0.97 },
};

export const AVATARS: readonly ModelAvatar[] = [
  { id: "ava-slim-warm", label: "Slim", build: "slim", skin: "#c98a5e" },
  { id: "ava-regular-deep", label: "Regular", build: "regular", skin: "#8b5a3c" },
  { id: "ava-curve-warm", label: "Curve", build: "curve", skin: "#d9a06b" },
  { id: "ava-tall-fair", label: "Tall", build: "tall", skin: "#e8bd96" },
  { id: "ava-petite-deep", label: "Petite", build: "petite", skin: "#6f4229" },
  { id: "ava-broad-mid", label: "Broad", build: "broad", skin: "#a9714a" },
];

export const MODEL_POSES: readonly ModelPose[] = [
  { id: "front", label: "Straight on" },
  { id: "walk", label: "Walking" },
  { id: "turn", label: "Three-quarter" },
  { id: "sit", label: "Seated" },
  { id: "back", label: "From behind" },
];

export const BACKDROPS: readonly Backdrop[] = [
  { id: "studio-grey", label: "Studio grey", css: "radial-gradient(ellipse at 50% 20%, #6a6a76 0%, #2b2b33 70%)" },
  { id: "studio-white", label: "Clean white", css: "radial-gradient(ellipse at 50% 18%, #f4f4f6 0%, #c9c9d2 75%)" },
  { id: "lavender", label: "Lavender", css: "radial-gradient(ellipse at 50% 20%, #a894ff 0%, #4a3a8f 72%)" },
  { id: "terrace", label: "Golden hour", css: "linear-gradient(180deg, #ffbf7a 0%, #d8713f 45%, #4a2316 100%)" },
  { id: "street", label: "Street", css: "linear-gradient(180deg, #2a3550 0%, #4a5a78 55%, #161d2c 100%)" },
  { id: "festive", label: "Festive", css: "radial-gradient(ellipse at 50% 25%, #ffd27a 0%, #a32d5a 70%, #2a0a1b 100%)" },
];

export const avatarById = (id: string | null | undefined) => AVATARS.find((a) => a.id === id);
export const backdropById = (id: string | null | undefined) => BACKDROPS.find((b) => b.id === id);

/** The same tone, darker: the shaded side of the body. Worked out here because an SVG `fill`
 *  attribute can't be relied on to understand `color-mix()`. */
function dark(hex: string, amount = 0.72) {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * amount));
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** A limb: a rounded bar pinned at one end so a pose can swing it. */
function Limb({ x, y, w, h, angle, fill }: { x: number; y: number; w: number; h: number; angle: number; fill: string }) {
  return <rect x={x - w / 2} y={y} width={w} height={h} rx={w / 2} fill={fill} transform={`rotate(${angle} ${x} ${y})`} />;
}

/**
 * The avatar itself: one body drawn from the build's measurements, arranged by the pose. Deliberately
 * a mannequin rather than a face — it stands in for a model, it doesn't pretend to be a person.
 */
export function AvatarFigure({ build, skin, pose = "front", className }: { build: BuildId; skin: string; pose?: PoseId; className?: string }) {
  const b = BUILD[build];
  const c = 20;
  const shade = dark(skin);
  const torso = `M ${c - b.sh} 16.4 Q ${c} 14.8 ${c + b.sh} 16.4 L ${c + b.wa} 30 L ${c + b.hi} 38.4 Q ${c} 40.6 ${c - b.hi} 38.4 L ${c - b.wa} 30 Z`;
  const legX = b.hi * 0.56;

  return (
    <svg viewBox="0 0 40 70" className={className} aria-hidden>
      <g transform={`translate(${c} ${70 - 70 * b.scale}) scale(${pose === "turn" ? b.scale * 0.8 : b.scale} ${b.scale}) translate(${-c} 0)`}>
        {/* Legs go down first so the torso overlaps them at the hip. */}
        {pose === "sit" ? (
          /* Perched: thighs out to the knees, shins straight down. */
          <>
            <Limb x={c - legX} y={36.5} w={4.2} h={13} angle={34} fill={shade} />
            <Limb x={c + legX} y={36.5} w={4.2} h={13} angle={-34} fill={skin} />
            <Limb x={c - legX - 7.3} y={47.3} w={3.8} h={12} angle={0} fill={shade} />
            <Limb x={c + legX + 7.3} y={47.3} w={3.8} h={12} angle={0} fill={skin} />
          </>
        ) : pose === "walk" ? (
          <>
            <Limb x={c - legX} y={37} w={4.2} h={28} angle={-13} fill={shade} />
            <Limb x={c + legX} y={37} w={4.2} h={28} angle={11} fill={skin} />
          </>
        ) : (
          <>
            <Limb x={c - legX} y={37} w={4.2} h={28} angle={-3} fill={pose === "back" ? skin : shade} />
            <Limb x={c + legX} y={37} w={4.2} h={28} angle={3} fill={skin} />
          </>
        )}

        {/* Arms: the pose decides how far they swing from the shoulder. */}
        <Limb x={c - b.sh + 0.6} y={17.4} w={3.4} h={20} angle={pose === "walk" ? 16 : pose === "sit" ? 22 : 7} fill={shade} />
        <Limb x={c + b.sh - 0.6} y={17.4} w={3.4} h={20} angle={pose === "walk" ? -18 : pose === "sit" ? -22 : -7} fill={skin} />

        <path d={torso} fill={skin} />
        {/* A seam down the front, so the figure reads as dressed rather than bare. */}
        {pose !== "back" && <path d={`M ${c} 16.6 L ${c} 39`} stroke={shade} strokeWidth={0.7} fill="none" opacity={0.5} />}

        <rect x={c - 1.4} y={12.4} width={2.8} height={3.4} rx={1.3} fill={shade} />
        <circle cx={c} cy={8.6} r={4.7} fill={skin} />
        {/* Hair: a crown from the front, the whole head from behind — the only thing that tells the two views apart. */}
        <path
          d={
            pose === "back"
              ? `M ${c - 4.7} 8.6 A 4.7 4.7 0 0 1 ${c + 4.7} 8.6 L ${c + 4.3} 13.2 L ${c - 4.3} 13.2 Z`
              : `M ${c - 4.7} 8.6 A 4.7 4.7 0 0 1 ${c + 4.7} 8.6 L ${c + 3.5} 8.6 A 3.5 3.5 0 0 0 ${c - 3.5} 8.6 Z`
          }
          fill={shade}
        />
      </g>
    </svg>
  );
}

/** An avatar as a pickable tile: the body, its tone, and one word. */
export function AvatarTile({ avatar, selected, onSelect, pose = "front" }: { avatar: ModelAvatar; selected: boolean; onSelect: () => void; pose?: PoseId }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${avatar.label} model`}
      onClick={onSelect}
      className={cn(
        "group overflow-hidden rounded-2xl transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
        selected ? "ring-2 ring-accent-bright" : "ring-1 ring-white/10 hover:ring-white/25"
      )}
    >
      <span className="relative flex aspect-[3/4] items-end justify-center bg-[radial-gradient(ellipse_at_50%_25%,rgba(255,255,255,0.1),transparent_70%)] bg-white/[0.03]">
        <AvatarFigure build={avatar.build} skin={avatar.skin} pose={pose} className="h-[86%] w-auto" />
      </span>
      <span className={cn("block truncate px-2 py-1.5 text-[11px] font-medium transition-colors", selected ? "bg-accent/20 text-white" : "bg-white/[0.03] text-subtle group-hover:text-white")}>{avatar.label}</span>
    </button>
  );
}
