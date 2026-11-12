"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact category picker that sits beside the search bar. The first option means "no filter". */
export function CategoryFilter({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = value !== options[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={filtered ? `Category: ${value}` : "Filter categories"}
        title={filtered ? `Category: ${value}` : "Filter categories"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 items-center gap-1.5 rounded-full border px-3 transition-colors",
          filtered
            ? "border-accent-bright/60 bg-accent/15 text-white"
            : "border-white/10 bg-white/[0.04] text-subtle hover:text-white hover:bg-white/[0.08]",
          open && "border-accent-bright/70"
        )}
      >
        <SlidersHorizontal className="size-4" />
        {filtered && <span className="size-1.5 rounded-full bg-accent-bright" aria-hidden />}
        <ChevronDown className={cn("size-3.5 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Category"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-48 rounded-(--radius-card) border border-white/10 bg-[#0b0b1e] p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)]"
        >
          {options.map((o) => (
            <li key={o}>
              <button
                type="button"
                role="option"
                aria-selected={value === o}
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-9 w-full items-center justify-between rounded-lg px-3 text-sm transition-colors",
                  value === o ? "bg-accent/20 text-white" : "text-subtle hover:bg-white/6 hover:text-white"
                )}
              >
                {o === options[0] ? "All categories" : o}
                {value === o && <Check className="size-4 text-accent-bright" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
