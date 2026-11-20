"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MotionPreset } from "../types";

/** The most a brand can upload in one go; the backend stores it and the request then carries a link. */
export const MAX_UPLOAD_MB = 8;

export const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const aspectClass = (ratio: string) => (ratio === "16:9" ? "aspect-video" : ratio === "1:1" ? "aspect-square" : "aspect-[9/16]");

// ─── Motion looks, drawn rather than described ───────────────────────────────
// Presets come from the backend and their wording changes, so the preview is read from the
// words themselves (camera move + lighting) instead of a fixed list of ids.

const STAGE_ANIM: Record<string, string> = {
  orbit: "stage-sway",
  dolly: "stage-dolly",
  track: "stage-track",
  turn: "stage-turn",
  sway: "stage-sway",
};

/** "Cinematic Dolly-In (0.5x)" → dolly, "Full 360 Swivel" → orbit, and so on. */
export function cameraKind(text: string) {
  const t = text.toLowerCase();
  if (/orbit|arc|swivel|360|revolv/.test(t)) return "orbit";
  if (/dolly|push|zoom|crane/.test(t)) return "dolly";
  if (/track|pan|walk|stride|follow|travel/.test(t)) return "track";
  if (/turn|spin|twirl|pirouette/.test(t)) return "turn";
  return "sway";
}

/** The lighting line becomes the tile's actual light: a colour wash and a key-light glow. */
export function lightingTheme(text: string) {
  const t = text.toLowerCase();
  if (/chiaroscuro|low.?key|moody|nocturne|night|shadow play/.test(t)) return { wash: "#2b2442", base: "#100e1e", key: "#b9a6ff" };
  if (/tungsten|warm|golden|festive|amber|candle|sunset|3200/.test(t)) return { wash: "#4d2b16", base: "#1b1012", key: "#ffc98a" };
  if (/daylight|natural|crisp|cool|overcast|5600|clean/.test(t)) return { wash: "#1d3550", base: "#0b1322", key: "#bcd9ff" };
  return { wash: "#2f3142", base: "#14151f", key: "#eef0ff" };
}

/** An abstract garment-on-figure silhouette: enough to read as a person wearing a piece. */
export function StageFigure({ className, fill }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 40 64" className={className} fill={fill ?? "currentColor"} aria-hidden>
      <circle cx="20" cy="9" r="5.1" />
      <path d="M12.4 16.6 L20 14.6 L27.6 16.6 L31 27 L26.8 28.2 L29.6 48.6 Q20 52.4 10.4 48.6 L13.2 28.2 L9 27 Z" />
    </svg>
  );
}

/** The moving stage on its own: the light, the camera move and a figure standing in it. */
export function MotionStage({ preset, className }: { preset: MotionPreset; className?: string }) {
  const kind = cameraKind(`${preset.cameraMovement} ${preset.name}`);
  const theme = lightingTheme(preset.lighting);
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: `radial-gradient(ellipse at 50% 18%, ${theme.wash} 0%, ${theme.base} 72%)` }}>
      {/* The key light named in the preset. */}
      <span aria-hidden className="absolute left-1/2 top-[-18%] size-[70%] -translate-x-1/2 rounded-full blur-2xl opacity-45" style={{ background: theme.key }} />

      {/* An orbiting camera gets a ring that actually goes round. */}
      {kind === "orbit" && (
        <span
          aria-hidden
          className="stage-ring absolute left-1/2 top-[58%] size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed opacity-50"
          style={{ borderColor: theme.key, transform: "rotateX(68deg)" }}
        />
      )}
      {/* A tracking move gets speed lines it slides against. */}
      {kind === "track" && (
        <span aria-hidden className="absolute inset-x-0 top-1/2 flex flex-col gap-2 opacity-25">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${theme.key}, transparent)` }} />
          ))}
        </span>
      )}
      {/* A dolly-in gets a frame closing on the subject. */}
      {kind === "dolly" && (
        <span
          aria-hidden
          className="stage-figure absolute inset-[18%] rounded-lg border opacity-40"
          style={{ borderColor: theme.key, ["--stage-anim" as string]: "stage-dolly", ["--stage-dur" as string]: "5s" }}
        />
      )}

      <span
        aria-hidden
        className="stage-figure absolute bottom-[12%] left-1/2 h-[64%] -translate-x-1/2"
        style={{ ["--stage-anim" as string]: STAGE_ANIM[kind], ["--stage-dur" as string]: kind === "turn" ? "6s" : "4.5s" }}
      >
        <StageFigure className="h-full w-auto text-white/85 drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]" />
      </span>

      {/* Floor, so the figure stands rather than floats. */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[16%]" style={{ background: `linear-gradient(180deg, transparent, ${theme.base})` }} />
    </div>
  );
}

/** One motion look: its light, its camera move and its name. No paragraph. */
export function MotionTile({ preset, selected, onSelect }: { preset: MotionPreset; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      title={preset.description}
      className={cn(
        "tile-frame group relative overflow-hidden rounded-2xl text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
        selected ? "stage-on ring-2 ring-accent-bright" : "ring-1 ring-white/10 hover:ring-white/25"
      )}
    >
      <MotionStage preset={preset} className="aspect-[4/3]" />
      <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-white/80 backdrop-blur">{preset.badge}</span>
      {selected && (
        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-white text-[#0b0b1e]">
          <CheckCircle2 className="size-3.5" aria-hidden />
        </span>
      )}
      <span className={cn("tile-label block px-3 py-2.5 text-xs font-medium transition-colors", selected ? "bg-accent/20 text-white" : "bg-white/[0.03] text-subtle group-hover:text-white")}>{preset.name}</span>
    </button>
  );
}
