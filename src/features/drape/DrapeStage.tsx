"use client";

import { forwardRef, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Columns2, Film, PenLine, Shirt, Sparkles, UserRound } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { baseImage, type Person, type StudioScene } from "@/features/workspace/hooks";
import type { PoseVariant } from "@/features/workspace/api";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { drapeContent as copy } from "@/data/studio-content";
import { POSES } from "@/data/look-edits";
import type { Outfit } from "./OutfitPicker";
import type { Mode } from "./StudioParts";

export type Result = {
  /** The main image (updated by makeup edits). */
  image: string;
  blob?: Blob;
  note?: string;
  poses: PoseVariant[];
  video?: string;
  /** Previous main images, for undoing a makeup edit. */
  history: string[];
};
export type RunState =
  | { status: "idle" }
  | { status: "running"; label: string }
  | { status: "done"; result: Result }
  /** `outOfCredits`: the server refused for lack of credits, so the error offers a pack. */
  | { status: "error"; message: string; outOfCredits?: boolean };
/** What the stage shows once a render exists. */
export type View = { kind: "main" } | { kind: "pose"; pose: string } | { kind: "video" };

/** The stage is a plain studio: the scene is only chosen here, and the render itself places people in it. */
const STUDIO_BACKDROP = "radial-gradient(ellipse at 50% 35%, #1d1940 0%, #0d0c1f 70%)";

/**
 * The studio canvas. Before a render it shows each person's latest twin exactly as it was made
 * (no scene behind it, so there's only one background); afterwards, the render, already in its scene.
 * With no twin it asks you to set one up.
 */
export const DrapeStage = forwardRef<
  HTMLDivElement,
  {
    mode: Mode;
    scene: StudioScene;
    person?: Person;
    group: Person[];
    /** Chosen pieces per person, shown on the stage until the first render. */
    board: BoardEntry[];
    run: RunState;
    view: View;
    onView: (v: View) => void;
    progress: string;
    /** Typical render time shown under the timer. */
    estimate?: string;
    onCancel: () => void;
  }
>(function DrapeStage({ mode, scene, person, group, board, run, view, onView, progress, estimate, onCancel }, ref) {
  const result = run.status === "done" ? run.result : null;
  const [comparing, setComparing] = useState(false);
  // Twin images that failed to load, so the stage asks for a new twin instead of showing a broken image.
  const [broken, setBroken] = useState<string[]>([]);
  const markBroken = (src: string) => setBroken((b) => (b.includes(src) ? b : [...b, src]));
  const twinOf = (p?: Person) => {
    const src = baseImage(p);
    return src && !broken.includes(src) ? src : undefined;
  };

  const before = mode === "single" ? twinOf(person) : undefined;
  const canCompare = Boolean(result && before && view.kind === "main");
  const isComparing = comparing && canCompare;

  let content: ReactNode;
  if (result) {
    if (view.kind === "video" && result.video) {
      content = <FramedPhoto key={result.video} src={result.video} alt="Your look in motion" video />;
    } else if (isComparing) {
      content = <CompareSlider before={before!} after={result.image} />;
    } else {
      const src = view.kind === "pose" ? result.poses.find((p) => p.pose === view.pose)?.imageUrl ?? result.image : result.image;
      content = <FramedPhoto key={src} src={src} alt="Your draped look" />;
    }
  } else if (mode === "single") {
    content = before ? (
      <FramedPhoto key={before} src={before} alt={`${person?.name ?? "Person"} twin`} onFail={() => markBroken(before)} />
    ) : (
      <NoTwin self={Boolean(person?.isSelf)} name={person?.name} broken={Boolean(baseImage(person))} />
    );
  } else if (group.some((p) => twinOf(p))) {
    content = (
      <div className="flex size-full items-end justify-center gap-3">
        {group.map((p) => {
          const src = twinOf(p);
          return (
            <div key={p.id} className="flex h-full min-w-0 max-w-[260px] flex-1 flex-col items-center justify-end gap-2">
              {src ? (
                <span className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[18px] bg-black/20 ring-1 ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetUrl(src)} alt={`${p.name} twin`} onError={() => markBroken(src)} className="absolute inset-0 size-full object-contain" />
                </span>
              ) : (
                <span className="flex aspect-[3/4] w-full max-w-[120px] items-center justify-center rounded-2xl border border-dashed border-white/20 text-muted">
                  <UserRound className="size-6" strokeWidth={1.5} />
                </span>
              )}
              <span className="glass-pill rounded-full bg-canvas/40 px-2.5 py-0.5 text-[11px] text-white">{p.isSelf ? "You" : p.name}</span>
            </div>
          );
        })}
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col items-center gap-3 text-center text-sm text-white/70">
        <Shirt className="size-10" strokeWidth={1.25} />
        {copy.emptyStage}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative isolate aspect-[4/5] w-full overflow-hidden border-y border-white/8 sm:aspect-[4/3] sm:rounded-(--radius-frame) sm:border sm:border-white/10 sm:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] lg:aspect-auto lg:size-full"
      style={{ background: STUDIO_BACKDROP }}
    >
      <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
        {/* The scene the next render will use; it isn't painted behind the twin. */}
        <span className="glass-pill flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-canvas/40 px-3 text-xs text-white">
          <span className="size-1.5 shrink-0 rounded-full bg-cyan" />
          <span className="shrink-0 text-white/55">Scene</span>
          <span className="truncate font-medium">{scene.name}</span>
        </span>
        {canCompare && (
          <button
            type="button"
            onClick={() => setComparing((c) => !c)}
            aria-pressed={isComparing}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
              isComparing ? "chip-on" : "glass-pill bg-canvas/40 text-white hover:bg-canvas/60"
            )}
          >
            <Columns2 className="size-3.5" />
            {copy.compare}
          </button>
        )}
      </div>

      <div className={cn("absolute inset-0 flex items-center justify-center px-4 pt-14 sm:px-8", result && (result.poses.length || result.video) ? "pb-24" : "pb-5 sm:pb-8")}>
        {content}
      </div>

      {!result && run.status !== "running" && board.some((b) => b.pieces.length > 0) && <LookBoard board={board} />}

      {result && (result.poses.length > 0 || result.video) && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
          <div className="glass-pill no-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-2xl bg-canvas/50 p-1.5">
            <Thumb active={view.kind === "main"} onClick={() => onView({ kind: "main" })} label="Look">
              <Photo src={result.image} alt="" />
            </Thumb>
            {result.poses.map((p) => (
              <Thumb key={p.pose} active={view.kind === "pose" && view.pose === p.pose} onClick={() => onView({ kind: "pose", pose: p.pose })} label={POSES.find((x) => x.id === p.pose)?.label ?? p.pose}>
                <Photo src={p.imageUrl} alt="" />
              </Thumb>
            ))}
            {result.video && (
              <Thumb active={view.kind === "video"} onClick={() => onView({ kind: "video" })} label="Video">
                <span className="flex size-full items-center justify-center bg-accent/30">
                  <Film className="size-4 text-white" />
                </span>
              </Thumb>
            )}
          </div>
        </div>
      )}

      {run.status === "running" && <RenderOverlay label={progress} estimate={estimate} onCancel={onCancel} />}
    </div>
  );
});

/** The photo in a frame that hugs its aspect ratio. `onFail` runs if the image can't load. */
function FramedPhoto({ src, alt, video = false, onFail }: { src: string; alt: string; video?: boolean; onFail?: () => void }) {
  const [ratio, setRatio] = useState(0.75);
  return (
    <div
      className="relative h-full max-w-full overflow-hidden rounded-[18px] bg-black/20 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
      style={{ aspectRatio: ratio }}
    >
      {video ? (
        <video
          src={assetUrl(src)}
          className="absolute inset-0 size-full object-contain"
          autoPlay
          muted
          loop
          playsInline
          controls
          onLoadedMetadata={(e) => e.currentTarget.videoWidth && setRatio(e.currentTarget.videoWidth / e.currentTarget.videoHeight)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetUrl(src)}
          alt={alt}
          decoding="async"
          onLoad={(e) => e.currentTarget.naturalWidth && setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
          onError={onFail}
          className="absolute inset-0 size-full object-contain"
        />
      )}
    </div>
  );
}

/** Drag the handle (or use the arrow keys) to wipe between the twin and the render. */
function CompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const [ratio, setRatio] = useState(0.75);
  return (
    <div className="relative h-full max-w-full overflow-hidden rounded-[18px] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/10" style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={assetUrl(before)} alt={copy.before} className="absolute inset-0 size-full object-contain" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetUrl(after)}
          alt={copy.after}
          onLoad={(e) => e.currentTarget.naturalWidth && setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
          className="absolute inset-0 size-full object-contain"
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)]" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-canvas shadow-xl">
          <Columns2 className="size-4" />
        </span>
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{copy.before}</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{copy.after}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

/** One person's chosen pieces, for the look board. */
export type BoardEntry = { id: string; name: string; pieces: Outfit[] };

/**
 * What's about to be draped, pinned to the stage before the first render: every
 * chosen piece as a swatch, grouped by person, appearing as they're picked.
 */
function LookBoard({ board }: { board: BoardEntry[] }) {
  const rows = board.filter((b) => b.pieces.length > 0);
  const total = rows.reduce((n, b) => n + b.pieces.length, 0);
  return (
    <div className="glass-pill animate-rise-in absolute bottom-3 right-3 z-10 flex max-w-[min(72%,360px)] flex-col gap-2 rounded-2xl bg-canvas/50 p-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] sm:bottom-4 sm:right-4">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/60">
          <Sparkles className="size-3 text-cyan" />
          Look board
        </span>
        <span className="text-[10px] tabular-nums text-white/45">{total === 1 ? "1 piece" : `${total} pieces`}</span>
      </div>
      {rows.map((b) => (
        <div key={b.id} className="flex flex-col gap-1">
          {board.length > 1 && <span className="px-0.5 text-[11px] font-medium text-white/80">{b.name}</span>}
          <div className="flex flex-wrap gap-1.5">
            {b.pieces.map((piece, i) => (
              <span
                key={`${piece.label}-${i}`}
                title={piece.label}
                style={{ animationDelay: `${i * 60}ms` }}
                className="animate-rise-in flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.7)] ring-1 ring-white/30"
              >
                {piece.preview ? <Photo src={piece.preview} alt="" fit="contain" className="p-0.5" /> : <PenLine className="size-4 text-canvas" />}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** No twin yet, or (`broken`) the saved twin image no longer loads. */
function NoTwin({ self, name, broken = false }: { self: boolean; name?: string; broken?: boolean }) {
  return (
    <div className="card-violet flex max-w-sm flex-col items-center gap-4 rounded-(--radius-panel) px-6 py-8 text-center backdrop-blur-xl">
      <span className="keycap flex size-16 items-center justify-center rounded-2xl">
        <UserRound className="icon-silver size-7" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-title font-medium text-white">
          {broken ? (self ? copy.twinMissingTitle : `Couldn’t load ${name}’s twin`) : self ? copy.noTwinTitle : `Create a twin for ${name}`}
        </p>
        <p className="mt-1 text-sm text-muted">{broken ? copy.twinMissingBody : copy.noTwinBody}</p>
      </div>
      <Link
        href={self ? "/profile?tab=twin" : "/profile?tab=circle"}
        className="btn-primary inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium hover:brightness-110"
      >
        {copy.setupTwin}
      </Link>
    </div>
  );
}

function RenderOverlay({ label, estimate = "usually ~20s", onCancel }: { label: string; estimate?: string; onCancel: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-canvas/55 backdrop-blur-[6px]" role="status" aria-live="polite">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-accent-bright/25 to-transparent animate-[drape-scan_2.6s_ease-in-out_infinite_alternate] motion-reduce:hidden"
      />
      <div className="card-violet relative flex w-[min(320px,86%)] flex-col items-center gap-4 rounded-(--radius-panel) px-6 py-6 text-center backdrop-blur-xl">
        <span className="relative flex size-12 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-accent-bright motion-reduce:animate-none" />
          <Shirt className="size-5 text-accent-bright" strokeWidth={1.75} />
        </span>
        <p className="min-h-6 text-body text-white">{label}</p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-accent to-accent-bright animate-[drape-progress_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
        </div>
        <div className="flex w-full items-center justify-between text-xs text-muted">
          <span className="tabular-nums">{elapsed}s · {estimate}</span>
          <button type="button" onClick={onCancel} className="rounded-full px-2 py-1 text-subtle transition-colors hover:bg-white/10 hover:text-white">
            {copy.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Thumb({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} title={label} className="flex w-12 shrink-0 flex-col items-center gap-1">
      <span className={cn("aspect-[3/4] w-full overflow-hidden rounded-lg border transition", active ? "border-white/90 ring-2 ring-white/30" : "border-white/10 opacity-75 hover:opacity-100")}>
        {children}
      </span>
      <span className={cn("w-full truncate text-center text-[10px]", active ? "text-white" : "text-white/60")}>{label}</span>
    </button>
  );
}
