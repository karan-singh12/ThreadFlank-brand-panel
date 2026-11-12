"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { ImagePlus, Link2, LoaderCircle, PenLine, Shirt, Sparkles, X, type LucideIcon } from "lucide-react";
import { ActionButton, Label, Notice, Segmented } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import type { WardrobeItem } from "@/features/workspace/api";
import { cn } from "@/lib/utils";
import { GARMENT_TYPES, drapeContent as copy, type GarmentType } from "@/data/studio-content";
import { ETHNIC_GARMENTS } from "@/data/garment-kinds";
import { fetchGarmentImage } from "./tryon";

export type OutfitSource = "link" | "upload" | "wardrobe" | "describe";

/** One garment chosen for one person. */
export type Outfit = {
  source: OutfitSource;
  /** Image shown in the UI and sent to the try-on (URL, upload path or blob: preview). */
  preview: string;
  label: string;
  type: GarmentType;
  /** The original file for uploads. */
  file?: File;
  itemId?: string;
  /** Ethnic garment kind (saree, lehenga…) for drape-aware rendering. */
  kind?: string;
  /** For "describe": the outfit as text, rendered straight onto the twin. */
  prompt?: string;
};

const SOURCES: { id: OutfitSource; label: string; icon: LucideIcon }[] = [
  { id: "link", label: copy.sources.link, icon: Link2 },
  { id: "upload", label: copy.sources.upload, icon: ImagePlus },
  { id: "wardrobe", label: copy.sources.wardrobe, icon: Shirt },
  { id: "describe", label: copy.sources.describe, icon: PenLine },
];

const SOURCE_NAMES: Record<OutfitSource, string> = { link: "From a link", upload: "Your photo", wardrobe: "From your wardrobe", describe: "Described" };

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20";

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function typeForCategory(category?: string): GarmentType {
  if (category === "Bottoms") return "lower_body";
  if (category === "Dresses" || category === "Ethnic") return "dresses";
  return "upper_body";
}

export function outfitFromItem(item: WardrobeItem): Outfit {
  return { source: "wardrobe", preview: item.image, label: item.name, type: typeForCategory(item.category), itemId: item.id };
}

/**
 * Pick a garment from a brand link, an upload, the wardrobe or a description, plus its garment type.
 * With `slotType` the slot decides the garment type: a type limits the Indian-wear kinds to it,
 * and null (accessories) hides both.
 */
export function OutfitPicker({
  value,
  onChange,
  wardrobe,
  wardrobeLoading,
  slotType,
  initialCategory,
}: {
  value: Outfit | null;
  onChange: (next: Outfit | null) => void;
  wardrobe: WardrobeItem[];
  wardrobeLoading: boolean;
  slotType?: GarmentType | null;
  /** Wardrobe tab to open on, when the wardrobe has that category. */
  initialCategory?: string | null;
}) {
  const [source, setSource] = useState<OutfitSource>(value?.source ?? (initialCategory && wardrobe.length ? "wardrobe" : "link"));
  const [link, setLink] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [category, setCategory] = useState(initialCategory && wardrobe.some((i) => i.category === initialCategory) ? initialCategory : "All");
  const kinds = slotType === undefined ? ETHNIC_GARMENTS : slotType === null ? [] : ETHNIC_GARMENTS.filter((k) => k.category === slotType);
  const [described, setDescribed] = useState(value?.source === "describe" ? value.prompt ?? "" : "");
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(wardrobe.map((i) => i.category).filter(Boolean)))], [wardrobe]);
  const shownItems = category === "All" ? wardrobe : wardrobe.filter((i) => i.category === category);
  const garment = value && value.source !== "describe" ? value : null;

  const fetchLink = async () => {
    setLinkBusy(true);
    setLinkError("");
    try {
      const image = await fetchGarmentImage(link.trim());
      onChange({ source: "link", preview: image, label: hostOf(link), type: value?.type ?? "upper_body" });
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : String(e));
    } finally {
      setLinkBusy(false);
    }
  };

  const pickFile = (file: File | undefined) => {
    if (file && /^image\/(png|jpe?g|webp)$/.test(file.type)) {
      onChange({ source: "upload", preview: URL.createObjectURL(file), label: file.name, file, type: value?.type ?? "upper_body" });
    }
  };

  const describe = (text: string) => {
    setDescribed(text);
    const clean = text.trim();
    onChange(clean.length >= 3 ? { source: "describe", preview: "", label: clean.slice(0, 48), prompt: clean, type: value?.type ?? "dresses" } : null);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div role="tablist" aria-label={copy.steps.source} className="grid grid-cols-4 gap-0.5 rounded-full border border-white/10 bg-canvas/40 p-1">
        {SOURCES.map((s) => {
          const active = source === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSource(s.id)}
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent-bright",
                active ? "chip-on" : "text-subtle hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <s.icon className="size-3.5" strokeWidth={1.75} />
              {s.label}
            </button>
          );
        })}
      </div>

      {source === "link" && (
        <div className="flex flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (link.trim()) fetchLink();
            }}
            className="flex gap-2"
          >
            <div className="group relative min-w-0 flex-1">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted group-focus-within:text-accent-bright" />
              <input
                type="url"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={copy.linkPlaceholder}
                aria-label={copy.sources.link}
                className={cn(inputBase, "h-11 pl-10 pr-3")}
              />
            </div>
            <ActionButton type="submit" loading={linkBusy} className="px-4">
              {copy.fetch}
            </ActionButton>
          </form>
          {linkError && <Notice tone="error">{linkError}</Notice>}
        </div>
      )}

      {source === "upload" && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-4 text-center transition-colors",
              dragging ? "border-white/60 bg-white/[0.06]" : "border-white/15 bg-white/[0.02] hover:border-white/35 hover:bg-white/[0.04]"
            )}
          >
            <span className="keycap flex size-9 items-center justify-center rounded-xl">
              <ImagePlus className="icon-silver size-4" strokeWidth={2.25} />
            </span>
            <span className="text-sm font-medium text-white">{copy.uploadCta}</span>
            <span className="text-xs text-muted">{copy.uploadHint}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </>
      )}

      {source === "wardrobe" &&
        (wardrobeLoading ? (
          <div className="flex h-24 items-center justify-center">
            <LoaderCircle className="size-5 animate-spin text-accent-bright" />
          </div>
        ) : wardrobe.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/12 px-4 py-6 text-center">
            <Shirt className="size-6 text-muted" strokeWidth={1.5} />
            <p className="text-sm text-subtle">{copy.wardrobeEmpty}</p>
            <Link href="/wardrobe" className="text-sm text-accent-bright hover:text-white">
              Add items →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {categories.length > 2 && (
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                    className={cn(
                      "h-7 shrink-0 rounded-full px-3 text-xs transition-colors",
                      category === c ? "chip-on font-medium" : "border border-white/10 text-subtle hover:border-white/25 hover:text-white"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <div className="-m-1 grid max-h-48 grid-cols-5 gap-1.5 overflow-y-auto p-1">
              {shownItems.map((i) => {
                const active = value?.itemId === i.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    title={i.name}
                    aria-label={i.name}
                    aria-pressed={active}
                    onClick={() => onChange(active ? null : outfitFromItem(i))}
                    className={cn(
                      "group relative aspect-[3/4] overflow-hidden rounded-xl bg-white/[0.05] ring-offset-2 ring-offset-[#0b0b1e] transition",
                      active ? "ring-2 ring-white/90" : "hover:ring-1 hover:ring-white/30"
                    )}
                  >
                    <Photo src={i.image} alt="" fit="contain" className="p-1 transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3 text-left text-[10px] text-white/90">
                      {i.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      {source === "describe" && (
        <div className="flex flex-col gap-3">
          <div className="group relative">
            <PenLine className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted group-focus-within:text-accent-bright" />
            <textarea
              rows={3}
              maxLength={400}
              value={described}
              onChange={(e) => describe(e.target.value)}
              placeholder={copy.describePlaceholder}
              aria-label={copy.sources.describe}
              className={cn(inputBase, "resize-none py-3 pl-10 pr-3")}
            />
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {copy.describeExamples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => describe(ex)}
                className="flex h-7 shrink-0 items-center gap-1 rounded-full border border-white/10 px-2.5 text-xs text-subtle transition-colors hover:border-white/25 hover:text-white"
              >
                <Sparkles className="size-3 text-accent-bright" />
                {ex}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">{copy.describeHint}</p>
        </div>
      )}

      {garment && (
        <div className="flex items-center gap-3 rounded-xl border border-accent-bright/25 bg-accent/[0.07] p-1.5 pr-2">
          <span className="aspect-square w-10 shrink-0 overflow-hidden rounded-lg bg-white">
            <Photo src={garment.preview} alt="" fit="contain" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{garment.label}</span>
            <span className="block text-xs text-muted">
              {SOURCE_NAMES[garment.source]} · {GARMENT_TYPES.find((g) => g.id === garment.type)?.label}
              {garment.kind && ` · ${ETHNIC_GARMENTS.find((k) => k.id === garment.kind)?.label}`}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={copy.removeOutfit}
            title={copy.removeOutfit}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {garment && slotType === undefined && (
        <div className="flex flex-col gap-2">
          <Label>{copy.steps.garment}</Label>
          <Segmented label={copy.steps.garment} value={garment.type} onChange={(type) => onChange({ ...garment, type, kind: undefined })} options={GARMENT_TYPES} />
        </div>
      )}

      {garment && kinds.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            <Label>{copy.indianWear}</Label>
            <div className="no-scrollbar flex gap-1 overflow-x-auto">
              {kinds.map((k) => {
                const active = garment.kind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(active ? { ...garment, kind: undefined } : { ...garment, kind: k.id, type: k.category })}
                    className={cn(
                      "h-7 shrink-0 rounded-full border px-3 text-xs transition-colors",
                      active ? "chip-on border-transparent font-medium" : "border-white/12 text-subtle hover:border-white/25 hover:text-white"
                    )}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
