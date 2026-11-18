"use client";

import { useState } from "react";
import { Clapperboard, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClipStudio } from "./ClipStudio";
import { ReelStudio } from "./ReelStudio";

/** One clip from one photo, or a whole reel from several. Same set-up, either way. */
const MODES = [
  { id: "clip", label: "Single clip", icon: Film },
  { id: "reel", label: "Promo reel", icon: Clapperboard },
] as const;

export function VideoStudio() {
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("clip");

  return (
    <div className="space-y-6">
      <div role="radiogroup" aria-label="What to make" className="glass-pill inline-flex rounded-full p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cn("flex h-9 items-center gap-2 rounded-full px-4 text-sm transition-colors", mode === m.id ? "chip-on" : "text-subtle hover:text-white")}
          >
            <m.icon className="size-4" strokeWidth={1.75} aria-hidden />
            {m.label}
          </button>
        ))}
      </div>

      {mode === "clip" ? <ClipStudio /> : <ReelStudio />}
    </div>
  );
}
