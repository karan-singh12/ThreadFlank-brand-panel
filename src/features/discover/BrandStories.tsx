"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { discoverContent, type Brand } from "@/data/app-content";

function Ring({ active, fresh, seen = false, children }: { active: boolean; fresh: boolean; seen?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-[64px] min-w-[64px] min-h-[64px] shrink-0 aspect-square items-center justify-center rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105",
        active
          ? "bg-[conic-gradient(from_180deg,#1fc5db,#6645eb,#d946ef,#1fc5db)]"
          : fresh
            ? "bg-[linear-gradient(135deg,#7f62f6,#1fc5db)]"
            : seen
              ? "bg-white/35"
              : "bg-white/10"
      )}
    >
      <span className="flex size-full aspect-square items-center justify-center rounded-full bg-canvas p-[2px] overflow-hidden">
        {children}
      </span>
    </span>
  );
}

/**
 * Horizontal story row with no visible scrollbar: swipe on touch, drag with the
 * mouse, or use the edge arrows. A drag never counts as a click on a story.
 */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    drag.current = { active: true, startX: e.clientX, startLeft: ref.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !ref.current) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      ref.current.setPointerCapture(e.pointerId);
    }
    if (d.moved) ref.current.scrollLeft = d.startLeft - dx;
  };
  const onPointerUp = () => {
    drag.current.active = false;
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return { ref, edges, page, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onClickCapture } };
}

function EdgeArrow({ side, visible, onClick }: { side: "start" | "end"; visible: boolean; onClick: () => void }) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={side === "start" ? "Scroll stories left" : "Scroll stories right"}
      onClick={onClick}
      className={cn(
        "absolute top-[36px] -translate-y-1/2 z-20 hidden size-7 items-center justify-center rounded-full border border-white/25 bg-[#121124]/95 text-white shadow-xl backdrop-blur transition hover:scale-110 hover:bg-white/20 active:scale-95 sm:flex",
        side === "start" ? "left-0.5" : "right-0.5",
        visible ? "opacity-100 cursor-pointer pointer-events-auto" : "pointer-events-none opacity-0"
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

/**
 * Brand circles. A brand with active stories opens them (`onOpen`); one without filters the
 * feed to that brand (`onSelect`). Rings: gradient = unseen stories, grey = all seen,
 * conic = the brand the feed is filtered to.
 */
export function BrandStories({
  brands,
  selected,
  onSelect,
  onOpen,
}: {
  brands: Brand[];
  selected: string;
  onSelect: (id: string) => void;
  onOpen: (brandId: string) => void;
}) {
  const { ref, edges, page, handlers } = useDragScroll();
  return (
    <div className="relative w-full overflow-visible py-1">
      <EdgeArrow side="start" visible={edges.start} onClick={() => page(-1)} />
      <EdgeArrow side="end" visible={edges.end} onClick={() => page(1)} />
      <div
        ref={ref}
        {...handlers}
        className="no-scrollbar flex cursor-grab select-none items-start gap-3.5 overflow-x-auto px-5 py-1 scroll-smooth active:cursor-grabbing"
        role="listbox"
        aria-label="Brand stories"
      >
        <button
          type="button"
          role="option"
          aria-selected={selected === "all"}
          onClick={() => onSelect("all")}
          className="group flex w-[70px] shrink-0 flex-col items-center"
        >
          <Ring active={selected === "all"} fresh={false}>
            <span className="flex size-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_30%,#2a2168,#0c0a26)]">
              <LayoutGrid className="size-6 text-white" strokeWidth={1.75} />
            </span>
          </Ring>
          <span className={cn("mt-1.5 w-full truncate text-center text-[11px] font-medium", selected === "all" ? "text-white" : "text-subtle")}>
            {discoverContent.allStoriesLabel}
          </span>
        </button>

        {brands.map((b) => {
          const active = selected === b.id;
          return (
            <button
              key={b.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => (b.hasStory ? onOpen(b.id) : onSelect(active ? "all" : b.id))}
              aria-label={b.hasStory ? `${b.name} stories${b.hasNewStory ? ", new" : ""}` : b.name}
              className="group flex w-[70px] shrink-0 flex-col items-center"
            >
              <Ring active={active} fresh={b.hasNewStory} seen={Boolean(b.hasStory && !b.hasNewStory)}>
                <Avatar tone={b.tone} image={b.image} name={b.name} className="size-full overflow-hidden rounded-full" />
              </Ring>
              <span className={cn("mt-1.5 w-full truncate text-center text-[11px] font-medium tracking-tight", active ? "text-white font-semibold" : "text-subtle")}>
                {b.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
