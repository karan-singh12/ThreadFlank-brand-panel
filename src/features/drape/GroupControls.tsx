"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Crown, Footprints, Gem, Glasses, Layers, Plus, Shirt, ShoppingBag, Sparkles, X, type LucideIcon } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import type { WardrobeItem } from "@/features/workspace/api";
import { baseImage, type Person } from "@/features/workspace/hooks";
import { cn } from "@/lib/utils";
import { DRAPE_SLOTS, GROUP_POSTURES, drapeContent as copy, type DrapeSlot, type GroupPosture } from "@/data/studio-content";
import { OutfitPicker } from "./OutfitPicker";
import { filledPieces, postureLabel, resolvePosture, withPiece, type MemberSpec } from "./group";

const SLOT_ICONS: Record<DrapeSlot, LucideIcon> = {
  top: Shirt,
  bottom: Layers,
  dress: Sparkles,
  shoes: Footprints,
  eyewear: Glasses,
  headwear: Crown,
  bag: ShoppingBag,
  jewelry: Gem,
};

const displayName = (p: Person) => (p.isSelf ? "You" : p.name);

function Avatar({ person, className }: { person: Person; className?: string }) {
  const image = baseImage(person);
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white", className)}>
      {image ? <Photo src={image} alt="" className="object-top" /> : person.name.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Who's in the look. You're in by default; everyone else is added from the Twin Circle
 * dropdown, and the relation set there (Partner, Friend, Sibling…) drives the group pose.
 */
export function MemberPicker({
  people,
  selected,
  max,
  onAdd,
  onRemove,
}: {
  people: Person[];
  selected: Person[];
  max: number;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const available = people.filter((p) => !selected.some((s) => s.id === p.id));
  const full = selected.length >= max;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {selected.map((p) => {
        const ready = Boolean(baseImage(p));
        return (
          <span
            key={p.id}
            title={ready ? undefined : copy.group.noTwin}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full border bg-white/[0.04] pl-0.5 text-xs text-white",
              ready ? "border-white/10" : "border-amber-300/50",
              selected.length > 1 ? "pr-0.5" : "pr-3"
            )}
          >
            <Avatar person={p} className="size-7 text-[11px]" />
            <span className="max-w-24 truncate font-medium">{displayName(p)}</span>
            {!p.isSelf && p.relation && <span className="text-[10px] text-cyan">{p.relation}</span>}
            {!ready && (
              <Link href={p.isSelf ? "/profile?tab=twin" : "/profile?tab=circle"} className="text-[10px] text-amber-300/90 underline-offset-2 hover:underline">
                {copy.setupTwin}
              </Link>
            )}
            {selected.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                aria-label={copy.group.remove(displayName(p))}
                title={copy.group.remove(displayName(p))}
                className="flex size-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </span>
        );
      })}

      {!full && (
        <div ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex h-8 items-center gap-1 rounded-full border border-dashed border-white/20 px-3 text-xs text-subtle transition-colors hover:border-white/40 hover:text-white"
          >
            <Plus className="size-3.5" />
            {copy.group.add}
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div role="listbox" aria-label={copy.group.addFromCircle} className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-white/12 bg-[#0e0d26]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <p className="px-3 pb-1 pt-2.5 text-[11px] uppercase tracking-[0.08em] text-muted">{copy.group.addFromCircle}</p>
              {available.length === 0 ? (
                <p className="px-3 pb-3 pt-1 text-sm text-subtle">{copy.group.circleEmpty}</p>
              ) : (
                <ul className="max-h-64 overflow-y-auto p-1">
                  {available.map((p) => {
                    const ready = Boolean(baseImage(p));
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          disabled={!ready}
                          onClick={() => {
                            onAdd(p.id);
                            setOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors enabled:hover:bg-white/[0.06] disabled:opacity-50"
                        >
                          <Avatar person={p} className="size-8 text-xs" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-white">{displayName(p)}</span>
                            <span className="block text-xs text-muted">{p.isSelf ? copy.group.twinReady : p.relation || "Circle member"}</span>
                          </span>
                          {!ready && <span className="text-[11px] text-amber-300/90">{copy.group.noTwin}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link href="/profile?tab=circle" className="block border-t border-white/8 px-3 py-2.5 text-xs text-accent-bright hover:text-white">
                {copy.group.manageCircle} →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Group pose chips. "Auto" shows the pose the relations resolve to. */
export function PosturePicker({ people, value, onChange }: { people: Person[]; value: GroupPosture; onChange: (p: GroupPosture) => void }) {
  const auto = resolvePosture(people, "auto");
  return (
    <div role="radiogroup" aria-label={copy.group.posture} title={copy.group.postureHint} className="no-scrollbar -mx-0.5 flex gap-1 overflow-x-auto px-0.5">
      {GROUP_POSTURES.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={p.hint}
            onClick={() => onChange(p.id)}
            className={cn(
              "h-7 shrink-0 rounded-full border px-3 text-xs transition-colors",
              active ? "chip-on border-transparent font-medium" : "border-white/10 text-subtle hover:border-white/25 hover:text-white"
            )}
          >
            {p.id === "auto" && auto ? copy.group.postureAuto(postureLabel(auto)) : p.label}
          </button>
        );
      })}
    </div>
  );
}

/** Per-person outfit: a tab per person, a grid of slots, and the picker for the active slot. */
export function MemberOutfits({
  people,
  members,
  activeId,
  onActive,
  onChange,
  wardrobe,
  wardrobeLoading,
}: {
  people: Person[];
  members: Record<string, MemberSpec>;
  activeId: string;
  onActive: (id: string) => void;
  onChange: (id: string, next: MemberSpec) => void;
  wardrobe: WardrobeItem[];
  wardrobeLoading: boolean;
}) {
  const [slot, setSlot] = useState<DrapeSlot>("top");
  const person = people.find((p) => p.id === activeId) ?? people[0];
  const member = (person && members[person.id]) || { pieces: {}, notes: "" };
  const slotInfo = DRAPE_SLOTS.find((s) => s.id === slot)!;

  if (!person) return null;

  return (
    <div className="flex flex-col gap-2">
      {people.length > 1 && (
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {people.map((p) => {
            const count = filledPieces(members[p.id]).length;
            const active = p.id === person.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onActive(p.id)}
                aria-pressed={active}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-xs font-medium transition-all",
                  active ? "chip-on" : "border border-white/10 text-subtle hover:border-white/25 hover:text-white"
                )}
              >
                <Avatar person={p} className="size-5 text-[10px]" />
                {displayName(p)}
                <span className={cn("rounded-full px-1.5 text-[10px]", count ? (active ? "bg-emerald-600/15 text-emerald-700" : "bg-green/15 text-green") : active ? "bg-canvas/10 text-canvas/70" : "bg-white/10 text-muted")}>
                  {count ? copy.group.pieces(count) : "+"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div role="tablist" aria-label={`${displayName(person)} outfit slots`} className="grid grid-cols-4 gap-1">
        {DRAPE_SLOTS.map((s) => {
          const piece = member.pieces[s.id];
          const active = slot === s.id;
          const Icon = SLOT_ICONS[s.id];
          return (
            <div key={s.id} className="relative">
              <button
                type="button"
                role="tab"
                aria-selected={active}
                title={s.id === "dress" || s.id === "top" || s.id === "bottom" ? copy.group.dressHint : undefined}
                onClick={() => setSlot(s.id)}
                className={cn(
                  "flex h-9 w-full items-center gap-1.5 overflow-hidden rounded-xl border px-1.5 text-[11px] transition-colors",
                  active ? "chip-on border-transparent font-medium" : "border-white/10 bg-white/[0.03] text-subtle hover:border-white/25 hover:text-white",
                  piece && !active && "border-green/40"
                )}
              >
                {piece?.preview ? (
                  <span className="size-6 shrink-0 overflow-hidden rounded bg-white">
                    <Photo src={piece.preview} alt="" fit="contain" />
                  </span>
                ) : piece ? (
                  <Check className={cn("size-3.5 shrink-0 ", active ? "text-emerald-600" : "text-green")} strokeWidth={3} />
                ) : (
                  <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
                )}
                <span className="truncate">{s.label}</span>
              </button>
              {piece && (
                <button
                  type="button"
                  onClick={() => onChange(person.id, withPiece(member, s.id, null))}
                  aria-label={`Remove ${s.label}`}
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-canvas text-white ring-1 ring-white/25 hover:bg-[#1a1840]"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div key={`${person.id}-${slot}`} className="animate-rise-in border-t border-white/8 pt-2">
        <OutfitPicker
          key={`${person.id}-${slot}`}
          value={member.pieces[slot] ?? null}
          onChange={(o) => onChange(person.id, withPiece(member, slot, o ? { ...o, type: slotInfo.type ?? o.type } : null))}
          wardrobe={wardrobe}
          wardrobeLoading={wardrobeLoading}
          slotType={slotInfo.type}
          initialCategory={slotInfo.wardrobe}
        />
      </div>
    </div>
  );
}
