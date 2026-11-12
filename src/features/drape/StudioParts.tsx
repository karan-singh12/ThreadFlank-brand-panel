"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Check, User, UserPlus, Users, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { baseImage, type Person, type StudioScene } from "@/features/workspace/hooks";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { MEMBER_LIMIT, drapeContent as copy } from "@/data/studio-content";
import { enginesExhausted, type StudioEngines } from "./tryon";

export type Mode = "single" | "group";

const MODE_ICONS: Record<Mode, LucideIcon> = { single: User, group: Users };

/** Where a card's colour glow sits, as on the landing page's feature cards. */
const GLOW_SPOTS = {
  "top-right": "-right-12 -top-16",
  "bottom-left": "-bottom-16 -left-12",
  "top-left": "-left-12 -top-16",
  "bottom-right": "-bottom-16 -right-12",
} as const;

export type Glow = { color: string; at: keyof typeof GLOW_SPOTS };

/**
 * One card in the control rail: the landing page's violet glass with a soft colour glow
 * blurred inside it. The glow has its own clipping layer, so dropdowns can still overflow the card
 * (give that card a z-index in `className` so it stacks over the cards after it).
 */
export function Step({
  label,
  icon: Icon,
  glow,
  aside,
  className,
  children,
}: {
  label: string;
  icon: LucideIcon;
  glow: Glow;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className={cn("card-violet relative isolate rounded-(--radius-panel) p-3.5 backdrop-blur-xl", className)}>
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
        <span className={cn("absolute size-44 rounded-full opacity-25 blur-[64px]", GLOW_SPOTS[glow.at])} style={{ background: glow.color }} />
      </span>
      <header className="mb-3 flex items-center gap-2.5">
        <span className="keycap flex size-7 shrink-0 items-center justify-center rounded-lg">
          <Icon className="icon-silver size-3.5" strokeWidth={2.25} />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-white">{label}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function ModeSwitch({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div role="radiogroup" aria-label="Drape mode" className="inline-flex self-start rounded-full border border-white/12 bg-black/30 p-1 backdrop-blur lg:self-auto">
      {copy.modes.map((m) => {
        const Icon = MODE_ICONS[m.id];
        const active = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.id)}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent-bright",
              active ? "bg-white font-medium text-canvas" : "text-subtle hover:text-white"
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

const ENGINE_NAMES: Record<string, string> = { replicate: "Replicate", gemini: "Gemini", openai: "OpenAI", openrouter: "OpenRouter" };

/** Whether the server can render right now. Engine names go in the tooltip for whoever runs the site. */
export function EngineBadge({ engines }: { engines: StudioEngines | null | undefined }) {
  if (engines === undefined) return null;
  const exhausted = enginesExhausted(engines);
  const online = (!engines || engines.image.length > 0) && !exhausted;
  const title = !engines
    ? undefined
    : exhausted
      ? copy.engine.exhaustedHint
      : online
        ? `Rendering with ${engines.image.map((e) => ENGINE_NAMES[e] ?? e).join(" → ")}${engines.video ? " · video on" : ""}`
        : copy.engine.offlineHint;
  return (
    <span title={title} className="inline-flex h-7 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs text-subtle">
      <span className="relative flex size-2">
        {online && <span className="absolute inline-flex size-full animate-ping rounded-full bg-green/60 motion-reduce:animate-none" />}
        <span className={cn("relative inline-flex size-2 rounded-full", online ? "bg-green" : "bg-amber-400")} />
      </span>
      {exhausted ? copy.engine.exhausted : online ? copy.engine.online : copy.engine.offline}
    </span>
  );
}

export function PersonPicker({ people, selected, onToggle, multi = false }: { people: Person[]; selected: string[]; onToggle: (id: string) => void; multi?: boolean }) {
  const canAdd = people.length - 1 < MEMBER_LIMIT;
  return (
    <div role={multi ? "group" : "radiogroup"} aria-label={copy.steps.who} className="no-scrollbar -m-1 flex gap-2 overflow-x-auto p-1">
      {people.map((p) => {
        const active = selected.includes(p.id);
        const image = baseImage(p);
        return (
          <button
            key={p.id}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={active}
            onClick={() => onToggle(p.id)}
            className={cn(
              "flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-1 pb-2 pt-2.5 transition-colors",
              active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
            )}
          >
            <span
              className={cn(
                "relative flex size-14 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-lg text-white ring-offset-2 ring-offset-[#0d0c22] transition",
                active ? "ring-2 ring-accent-bright" : "opacity-75"
              )}
            >
              {image ? <Photo src={image} alt="" className="object-top" /> : p.name.charAt(0).toUpperCase()}
              {multi && active && (
                <span className="absolute inset-x-0 bottom-0 flex h-4 items-center justify-center bg-accent-bright/90">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </span>
              )}
            </span>
            <span className={cn("w-full truncate text-center text-xs", active ? "text-white" : "text-subtle")}>{p.isSelf ? "You" : p.name}</span>
            <span className={cn("-mt-1 flex items-center gap-1 text-[10px]", image ? "text-green" : "text-amber-300/90")}>
              <span className={cn("size-1.5 rounded-full", image ? "bg-green" : "bg-amber-300/90")} />
              {image ? "Selfie ready" : "No selfie"}
            </span>
          </button>
        );
      })}
      {canAdd && (
        <Link
          href="/profile?tab=circle"
          className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-1 pb-2 pt-2.5 text-muted transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <span className="flex size-14 items-center justify-center rounded-full border border-dashed border-white/20">
            <UserPlus className="size-5" strokeWidth={1.5} />
          </span>
          <span className="text-xs">Add</span>
        </Link>
      )}
    </div>
  );
}

export function SceneGrid({ scenes, selectedId, onSelect }: { scenes: StudioScene[]; selectedId?: string; onSelect: (id: string) => void }) {
  if (scenes.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-muted">
        No custom studio backgrounds available.
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label={copy.steps.scene} className="grid grid-cols-4 gap-1.5">
      {scenes.map((b) => {
        const isSelected = selectedId === b.id;
        return (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={b.name}
            title={`${b.name} (${b.category})`}
            onClick={() => onSelect(b.id)}
            className={cn(
              "group relative aspect-[4/3] overflow-hidden rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright",
              isSelected ? "border-transparent ring-2 ring-white/90 ring-offset-2 ring-offset-[#0b0b1e]" : "border-white/10 hover:border-white/30"
            )}
            style={{ background: b.cssGradient || "radial-gradient(circle, #201e38, #0b0b1e)" }}
          >
            {b.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(b.imageUrl)} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : null}
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <span className="absolute inset-x-2 bottom-1.5 flex items-center justify-between gap-1">
              <span className="truncate text-[11px] font-medium text-white">{b.name}</span>
              {isSelected && (
                <span className="chip-on flex size-4 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Small filter tabs for the scene categories, shown in the Scene step header. */
export function SceneTabs({ categories, value, onChange }: { categories: string[]; value: string; onChange: (c: string) => void }) {
  if (categories.length <= 2) return null;
  return (
    <div className="no-scrollbar -mx-0.5 mb-2.5 flex gap-1.5 overflow-x-auto px-0.5">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          aria-pressed={value === cat}
          className={cn("h-7 shrink-0 rounded-full px-3 text-xs transition-colors", value === cat ? "chip-on font-medium" : "border border-white/10 text-subtle hover:border-white/25 hover:text-white")}
        >
          {cat === "all" ? "All" : cat}
        </button>
      ))}
    </div>
  );
}

export function HowItWorks() {
  return (
    <ol className="hidden gap-3 sm:grid sm:grid-cols-3">
      {copy.howItWorks.map((s, i) => (
        <li key={s.title} className="rounded-(--radius-card) border border-white/8 bg-white/[0.02] p-4">
          <span className="text-xs font-medium tabular-nums text-accent-bright">0{i + 1}</span>
          <p className="mt-1 text-sm font-medium text-white">{s.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function Swatches({
  label,
  options,
  value,
  onChange,
  allowNone = false,
}: {
  label: string;
  options: readonly { name: string; hex: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
  allowNone?: boolean;
}) {
  const current = options.find((o) => o.hex === value);
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {current && <span className="ml-1.5 normal-case tracking-normal text-subtle">· {current.name}</span>}
      </Label>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {allowNone && (
          <button
            type="button"
            role="radio"
            aria-checked={value === null}
            onClick={() => onChange(null)}
            className={cn("h-7 rounded-full border px-2.5 text-[11px]", value === null ? "border-accent-bright text-white" : "border-white/12 text-muted hover:text-white")}
          >
            None
          </button>
        )}
        {options.map((o) => (
          <button
            key={o.hex}
            type="button"
            role="radio"
            aria-checked={value === o.hex}
            aria-label={o.name}
            title={o.name}
            onClick={() => onChange(o.hex)}
            className={cn("size-7 rounded-full ring-offset-2 ring-offset-[#0b0b1e] transition", value === o.hex ? "ring-2 ring-accent-bright" : "hover:scale-110")}
            style={{ background: o.hex }}
          />
        ))}
      </div>
    </div>
  );
}
