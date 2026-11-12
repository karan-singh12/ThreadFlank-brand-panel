"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck, ChevronLeft, ChevronRight, LayoutGrid, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { timeAgo } from "./time";
import type { ApiBrandStory } from "./api";

/** How long a photo story stays up. Videos play to their end. */
const IMAGE_MS = 5000;
/** Swipe down this far (px) to close. */
const CLOSE_DRAG = 120;

export type StoryGroup = { brandId: string; brand: ApiBrandStory["brand"]; stories: ApiBrandStory[] };

const noopSubscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/**
 * Full-screen brand stories, Instagram style: one brand at a time with a progress bar per
 * story. Tap the right side for the next story, the left for the previous; hold to pause;
 * swipe down or press Esc to close. Moves on to the next brand when one runs out.
 */
export function StoryViewer({
  groups,
  startBrandId,
  onClose,
  onSeen,
  onShowPosts,
}: {
  groups: StoryGroup[];
  startBrandId: string;
  onClose: () => void;
  /** Called once per story as it's shown. */
  onSeen: (story: ApiBrandStory) => void;
  /** "See posts": filter the feed to this brand. */
  onShowPosts: (brandId: string) => void;
}) {
  const isClient = useIsClient();
  const [groupIndex, setGroupIndex] = useState(() => Math.max(0, groups.findIndex((g) => g.brandId === startBrandId)));
  // Start each brand at its first unseen story.
  const firstUnseen = (g: StoryGroup | undefined) => Math.max(0, g?.stories.findIndex((s) => !s.viewed) ?? 0);
  const [storyIndex, setStoryIndex] = useState(() => firstUnseen(groups[Math.max(0, groups.findIndex((g) => g.brandId === startBrandId))]));
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [drag, setDrag] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(0);
  const pointer = useRef<{ x: number; y: number; t: number } | null>(null);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isVideo = story?.mediaType?.toUpperCase() === "VIDEO";

  const next = useCallback(() => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) setStoryIndex((i) => i + 1);
    else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(firstUnseen(groups[groupIndex + 1]));
    } else onClose();
  }, [group, storyIndex, groupIndex, groups, onClose]);

  const prev = useCallback(() => {
    if (storyIndex > 0) setStoryIndex((i) => i - 1);
    else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
    }
  }, [storyIndex, groupIndex, groups]);

  // Each story starts from an empty bar and records one view.
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
    if (story) onSeen(story);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // Photos run on a timer (kept in a ref, so pausing resumes where it stopped); videos report their own progress.
  useEffect(() => {
    if (!story || isVideo || paused) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      progressRef.current = Math.min(1, progressRef.current + (now - last) / IMAGE_MS);
      last = now;
      setProgress(progressRef.current);
      if (progressRef.current >= 1) return next();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [story, isVideo, paused, next]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else video.play().catch(() => undefined);
  }, [paused, story?.id]);

  // Keyboard, and no page scroll behind the viewer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [next, prev, onClose]);

  // Preload the next photo so it appears instantly.
  useEffect(() => {
    const upcoming = group?.stories[storyIndex + 1] ?? groups[groupIndex + 1]?.stories[0];
    if (upcoming && upcoming.mediaType?.toUpperCase() !== "VIDEO") {
      const img = new Image();
      img.src = assetUrl(upcoming.mediaUrl);
    }
  }, [group, storyIndex, groupIndex, groups]);

  // Hold to pause, tap the sides to move, swipe down to close.
  const onPointerDown = (e: ReactPointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    setPaused(true);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointer.current) return;
    setDrag(Math.max(0, e.clientY - pointer.current.y));
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const start = pointer.current;
    pointer.current = null;
    setPaused(false);
    if (!start) return;
    const dy = e.clientY - start.y;
    setDrag(0);
    if (dy > CLOSE_DRAG) return onClose();
    const tap = Date.now() - start.t < 250 && Math.abs(dy) < 10 && Math.abs(e.clientX - start.x) < 10;
    if (!tap) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 3) prev();
    else next();
  };

  if (!isClient || !group || !story) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${group.brand.name} stories`} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <button type="button" aria-label="Close stories" onClick={onClose} className="absolute inset-0 hidden cursor-default sm:block" tabIndex={-1} />

      {groupIndex > 0 || storyIndex > 0 ? (
        <button type="button" onClick={prev} aria-label="Previous story" className="absolute left-[calc(50%-min(28vh,250px)-64px)] z-10 hidden size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:flex">
          <ChevronLeft className="size-5" />
        </button>
      ) : null}
      <button type="button" onClick={next} aria-label="Next story" className="absolute right-[calc(50%-min(28vh,250px)-64px)] z-10 hidden size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:flex">
        <ChevronRight className="size-5" />
      </button>

      <div
        className="relative h-dvh w-full overflow-hidden bg-[#0b0b1e] transition-transform duration-200 sm:h-[min(92dvh,890px)] sm:w-auto sm:aspect-[9/16] sm:rounded-[22px]"
        style={{ transform: drag ? `translateY(${drag}px) scale(${1 - Math.min(drag, 300) / 1500})` : undefined, opacity: drag ? 1 - Math.min(drag, 300) / 600 : 1 }}
      >
        {isVideo ? (
          <video
            key={story.id}
            ref={videoRef}
            src={assetUrl(story.mediaUrl)}
            className="absolute inset-0 size-full object-cover"
            autoPlay
            playsInline
            muted={muted}
            onTimeUpdate={(e) => e.currentTarget.duration && setProgress(e.currentTarget.currentTime / e.currentTarget.duration)}
            onEnded={next}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={story.id} src={assetUrl(story.mediaUrl)} alt={story.caption ?? `${group.brand.name} story`} className="absolute inset-0 size-full object-cover" draggable={false} />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/75 to-transparent" />

        {/* Tap / hold / swipe surface, under the controls. */}
        <div
          className="absolute inset-0 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pointer.current = null;
            setPaused(false);
            setDrag(0);
          }}
          onContextMenu={(e) => e.preventDefault()}
        />

        <div className="absolute inset-x-0 top-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            {group.stories.map((s, i) => (
              <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                <span className="block h-full rounded-full bg-white" style={{ width: `${i < storyIndex ? 100 : i === storyIndex ? progress * 100 : 0}%` }} />
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="size-9 shrink-0 overflow-hidden rounded-full bg-white p-1 ring-1 ring-white/30">
              {group.brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(group.brand.logoUrl)} alt="" className="size-full object-contain" />
              ) : (
                <span className="flex size-full items-center justify-center text-sm font-semibold text-black">{group.brand.name.charAt(0)}</span>
              )}
            </span>
            <div className="min-w-0 flex-1 text-white">
              <p className="flex items-center gap-1 truncate text-sm font-medium">
                {group.brand.name}
                {group.brand.isVerified && <BadgeCheck className="size-4 shrink-0 fill-[#1fc5db] text-[#0b0b1e]" />}
                <span className="ml-1 text-xs font-normal text-white/60">{timeAgo(story.createdAt)}</span>
              </p>
            </div>
            <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"} className="relative z-10 flex size-9 items-center justify-center rounded-full text-white hover:bg-white/15">
              {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
            </button>
            {isVideo && (
              <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="relative z-10 flex size-9 items-center justify-center rounded-full text-white hover:bg-white/15">
                {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close stories" className="relative z-10 flex size-9 items-center justify-center rounded-full text-white hover:bg-white/15">
              <X className="size-6" />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {story.caption && <p className="pointer-events-none max-w-full text-center text-[15px] leading-snug text-white drop-shadow">{story.caption}</p>}
          <button
            type="button"
            onClick={() => onShowPosts(group.brandId)}
            className={cn("btn-light relative z-10 inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium")}
          >
            <LayoutGrid className="size-4" />
            See {group.brand.name} posts
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
