"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type Screen = {
  id: string;
  label: string;
  icon: string;
  caption: string;
  desktop: string | null;
  mobile: string | null;
};

/** Shown until a real screenshot is dropped into /public/screens. */
function Slot({ file, hint, label, className }: { file: string; hint: string; label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`${label} screenshot placeholder`}
      className={cn("flex flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(102,69,235,0.2),#070817_70%)] p-4 text-center", className)}
    >
      <span className="keycap flex size-11 items-center justify-center rounded-2xl">
        <ImagePlus className="size-5 text-[#c9bcff]" strokeWidth={1.75} />
      </span>
      <p className="text-sm text-ink-soft">{label} screenshot</p>
      <p className="max-w-[260px] text-xs text-muted">
        Add <span className="text-subtle">public/screens/{file}</span> ({hint})
      </p>
    </div>
  );
}

export function ShowcaseTabs({ screens }: { screens: Screen[] }) {
  const [active, setActive] = useState(0);
  const s = screens[active];

  return (
    <div className="mt-12 lg:mt-16">
      <div role="tablist" aria-label="App screens" className="no-scrollbar mx-auto flex max-w-full snap-x gap-2 overflow-x-auto pb-1 lg:justify-center">
        {screens.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`screen-tab-${t.id}`}
            aria-selected={i === active}
            aria-controls="screen-panel"
            onClick={() => setActive(i)}
            className={cn(
              "flex h-11 flex-none snap-start items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
              i === active ? "chip-on font-medium" : "glass-pill text-subtle hover:text-white"
            )}
          >
            <Icon name={t.icon} className="size-4" strokeWidth={1.75} />
            {t.label}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mx-auto mt-6 max-w-[560px] text-center">
        <p key={s.id} className="animate-rise-in text-body text-ink-soft">
          <span className="font-medium text-white">{s.label}.</span> {s.caption}
        </p>
      </div>

      <Reveal y={32} className="relative mx-auto mt-8 max-w-[1100px]">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/4 h-[60%] w-[70%] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#f457ff,#5324ff)] opacity-25 blur-[120px]" />
        <div id="screen-panel" role="tabpanel" aria-labelledby={`screen-tab-${s.id}`} className="relative">
          {/* Desktop frame */}
          <div className="overflow-hidden rounded-[22px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_40px_90px_-40px_rgba(102,69,235,0.6)]">
            <div className="flex h-9 items-center gap-1.5 border-b border-white/10 bg-[#0b0c22] px-4" aria-hidden>
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="size-2.5 rounded-full bg-white/20" />
            </div>
            <div className="relative aspect-[16/10] w-full bg-[#070817]">
              {s.desktop ? (
                <Image src={s.desktop} alt={`${s.label} screen on desktop`} fill sizes="(min-width: 1100px) 1100px, 100vw" className="object-cover object-top" />
              ) : (
                <Slot file={`${s.id}.png`} hint="16:10, e.g. 1440×900" label={s.label} className="absolute inset-0" />
              )}
            </div>
          </div>

          {/* Phone frame, overlapping the desktop one on wide screens */}
          <div className="mx-auto mt-6 w-[200px] overflow-hidden rounded-[30px] bg-[#0b0c22] p-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),0_30px_70px_-30px_rgba(0,0,0,0.9)] lg:absolute lg:-bottom-10 lg:right-[-24px] lg:mt-0 lg:w-[210px]">
            <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[24px] bg-[#070817]">
              {s.mobile ? (
                <Image src={s.mobile} alt={`${s.label} screen on mobile`} fill sizes="210px" className="object-cover object-top" />
              ) : (
                <Slot file={`${s.id}-mobile.png`} hint="9:19, e.g. 390×844" label={`${s.label} mobile`} className="absolute inset-0" />
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
