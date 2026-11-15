"use client";

import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, LoaderCircle, Star, X } from "lucide-react";
import { ActionButton, Label, Notice, Segmented } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { resizeImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { brandApi } from "../api";
import { errorMessage } from "../useResource";
import type { CreateGarmentInput, ProductItem } from "../types";
import { garmentSchema, splitList, type GarmentValues } from "./schema";

const input =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20";

const MAX_IMAGES = 8;

/** The backend requires a SKU; one is made when the brand leaves it empty. */
function newSku() {
  return `SKU-${Date.now().toString(36).slice(-6).toUpperCase()}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`;
}

function Row({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {/* The label wraps its input, so clicking the text focuses it and screen readers announce it. */}
      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{label}</span>
        {children}
      </label>
      {error ? <p role="alert" className="text-xs text-red-300">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Only what the brand enters is saved; unknown numbers stay zero rather than invented. */
export function GarmentForm({
  defaultBuyUrl,
  garment,
  categories,
  occasions: occasionOptions,
  collections = [],
  onAdd,
  onSave,
  onDone,
}: {
  defaultBuyUrl: string;
  /** The choices admins manage. A piece that already has a category outside the list keeps it as an extra option. */
  categories: readonly string[];
  occasions: readonly string[];
  /** Collections the brand already uses, offered as suggestions. */
  collections?: readonly string[];
  /** When set, the form edits this garment instead of adding a new one. */
  garment?: ProductItem;
  onAdd?: (g: CreateGarmentInput) => Promise<unknown>;
  onSave?: (id: string, patch: Partial<CreateGarmentInput>) => Promise<unknown>;
  onDone: () => void;
}) {
  const { token } = useAuth();
  const [occasions, setOccasions] = useState<string[]>(garment?.occasions ?? []);
  const [images, setImages] = useState<string[]>(garment?.images ?? []);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(0);
  const [imageError, setImageError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const categoryOptions = garment?.category && !categories.includes(garment.category) ? [garment.category, ...categories] : categories;
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GarmentValues>({
    resolver: zodResolver(garmentSchema),
    defaultValues: garment
      ? {
          title: garment.title,
          sku: garment.sku,
          price: String(garment.price),
          originalPrice: garment.originalPrice ? String(garment.originalPrice) : "",
          category: garment.category || categoryOptions[0] || "",
          stock: String(garment.stock),
          colors: (garment.colors ?? []).join(", "),
          sizes: (garment.sizes ?? []).join(", "),
          buyUrl: garment.buyUrl,
          description: garment.description ?? "",
          status: garment.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
          featured: Boolean(garment.featured),
          collection: garment.collection ?? "",
        }
      : { title: "", sku: "", price: "", originalPrice: "", category: categoryOptions[0] ?? "", stock: "", colors: "", sizes: "", buyUrl: "", description: "", status: "PUBLISHED", featured: false, collection: "" },
  });

  const status = useWatch({ control, name: "status" });
  const featured = useWatch({ control, name: "featured" });
  const toggle = (o: string) => setOccasions((list) => (list.includes(o) ? list.filter((x) => x !== o) : [...list, o]));

  const addImageUrl = () => {
    const url = imageUrl.trim();
    setImageError("");
    if (!url) return;
    if (!/^https:\/\/\S+$/i.test(url) || !URL.canParse(url)) return setImageError("Enter a full link starting with https://");
    if (images.length >= MAX_IMAGES) return setImageError(`At most ${MAX_IMAGES} images per garment.`);
    if (!images.includes(url)) setImages((list) => [...list, url]);
    setImageUrl("");
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || !token) return;
    setImageError("");
    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > room) setImageError(`Only ${MAX_IMAGES} images fit; the rest were skipped.`);
    setUploading((n) => n + picked.length);
    // One at a time keeps memory low on phones and the uploads in the order the files were picked.
    for (const file of picked) {
      try {
        const url = (await brandApi.uploadBase64(token, await resizeImage(file), file.name)).url;
        setImages((list) => (list.length < MAX_IMAGES ? [...list, url] : list));
      } catch (e) {
        setImageError(e instanceof Error && !("status" in e) ? e.message : errorMessage(e));
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = handleSubmit(async (v) => {
    setServerError("");
    if (uploading > 0) return setServerError("Wait for the photos to finish uploading.");
    const common = {
      title: v.title.trim(),
      price: Number(v.price),
      originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
      images,
      category: v.category,
      occasions,
      colors: splitList(v.colors),
      sizes: splitList(v.sizes),
      stock: v.stock === "" ? 0 : Number(v.stock),
      isDrapeReady: images.length > 0,
      status: v.status,
      featured: v.featured,
      collection: v.collection.trim(),
    };
    try {
      if (garment && onSave) {
        await onSave(garment.id, {
          ...common,
          // Sending the SKU back unchanged would trip the "already used" check against itself.
          ...(v.sku.trim() && v.sku.trim() !== garment.sku ? { sku: v.sku.trim() } : {}),
          description: v.description.trim(),
          // A product with no store link yet stays that way until the brand adds one.
          ...(v.buyUrl || defaultBuyUrl ? { buyUrl: v.buyUrl || defaultBuyUrl } : {}),
        });
        onDone();
        return;
      }
      await onAdd!({
        ...common,
        sku: v.sku.trim() || newSku(),
        drapeScore: 0,
        description: v.description.trim() || undefined,
        buyUrl: v.buyUrl || defaultBuyUrl,
        newDrop: true,
        collection: v.collection.trim() || undefined,
      });
      onDone();
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {serverError && <Notice tone="error">{serverError}</Notice>}
      <Row label="Garment name" error={errors.title?.message}>
        <input type="text" autoFocus placeholder="e.g. Zari brocade lehenga" aria-invalid={!!errors.title} className={input} {...register("title")} />
      </Row>

      <div className="grid grid-cols-2 gap-3">
        <Row label="Price (₹)" error={errors.price?.message}>
          <input type="number" inputMode="numeric" min={0} aria-invalid={!!errors.price} className={input} {...register("price")} />
        </Row>
        <Row label="Original price (₹)" hint="Optional. Shows as the crossed-out price." error={errors.originalPrice?.message}>
          <input type="number" inputMode="numeric" min={0} aria-invalid={!!errors.originalPrice} className={input} {...register("originalPrice")} />
        </Row>
        <Row label="In stock" hint="Empty counts as 0 (Out of stock)" error={errors.stock?.message}>
          <input type="number" inputMode="numeric" min={0} aria-invalid={!!errors.stock} className={input} {...register("stock")} />
        </Row>
        <Row label="SKU" hint={garment ? undefined : "Leave empty to generate one."} error={errors.sku?.message}>
          <input type="text" maxLength={60} placeholder="e.g. LEH-001" aria-invalid={!!errors.sku} className={input} {...register("sku")} />
        </Row>
      </div>

      <Row label="Category" error={errors.category?.message}>
        <select className={cn(input, "appearance-none [&>option]:bg-[#0b0b1e]")} {...register("category")}>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Row>

      <Row label="Collection" hint="Group pieces into a drop or edit, e.g. Wedding Edit 2026. Optional." error={errors.collection?.message}>
        <input type="text" list="brand-collections" maxLength={80} placeholder="e.g. Wedding Edit 2026" className={input} {...register("collection")} />
        <datalist id="brand-collections">
          {collections.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Row>

      <div className="grid grid-cols-2 gap-3">
        <Row label="Colours" hint="Separate with commas" error={errors.colors?.message}>
          <input type="text" placeholder="Antique Gold, Blush" className={input} {...register("colors")} />
        </Row>
        <Row label="Sizes" hint="Separate with commas" error={errors.sizes?.message}>
          <input type="text" placeholder="S, M, L, XL" className={input} {...register("sizes")} />
        </Row>
      </div>

      <Row label="Description" hint="What shoppers read about this piece. Optional." error={errors.description?.message}>
        <textarea rows={3} maxLength={2000} placeholder="e.g. Hand-woven silk with a zari border, made for festive evenings." aria-invalid={!!errors.description} className={cn(input, "h-24 resize-none py-3")} {...register("description")} />
      </Row>

      <div className="flex flex-col gap-2">
        <Label>{`Photos (${images.length}/${MAX_IMAGES})`}</Label>
        <p className="text-xs text-muted">The first photo is the main one and is used for try-on. Use a clear, front-facing shot. Garments without a photo are saved as Not ready.</p>
        {(images.length > 0 || uploading > 0) && (
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {images.map((src, i) => (
              <li key={src + i} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/10">
                <Photo src={src} alt={`Photo ${i + 1}`} className="object-top" />
                {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-canvas/80 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-md">Main</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/80 to-transparent p-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {i > 0 ? (
                    <button type="button" aria-label={`Make photo ${i + 1} the main photo`} onClick={() => setImages((l) => [src, ...l.filter((_, j) => j !== i)])} className="flex size-6 items-center justify-center rounded-full bg-canvas/80 text-white hover:bg-accent">
                      <Star className="size-3.5" aria-hidden />
                    </button>
                  ) : (
                    <span />
                  )}
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setImages((l) => l.filter((_, j) => j !== i))} className="flex size-6 items-center justify-center rounded-full bg-canvas/80 text-white hover:bg-red-500/80">
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
            {Array.from({ length: uploading }, (_, i) => (
              <li key={`up-${i}`} className="flex aspect-[3/4] items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10" aria-label="Uploading">
                <LoaderCircle className="size-5 animate-spin text-muted" aria-hidden />
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <ActionButton variant="ghost" disabled={images.length + uploading >= MAX_IMAGES} onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-4" aria-hidden /> Upload photos
          </ActionButton>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
          <div className="flex min-w-0 flex-1 gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImageUrl();
                }
              }}
              placeholder="…or paste an image link (https://)"
              aria-label="Image link"
              className={input}
            />
            <ActionButton variant="ghost" onClick={addImageUrl}>
              Add
            </ActionButton>
          </div>
        </div>
        {imageError && <p role="alert" className="text-xs text-red-300">{imageError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Visible to shoppers</Label>
        <Segmented
          label="Visibility"
          value={status}
          onChange={(v) => setValue("status", v, { shouldDirty: true })}
          options={[
            { id: "PUBLISHED", label: "Live" },
            { id: "DRAFT", label: "Draft (hidden)" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Showcase</Label>
        <button
          type="button"
          aria-pressed={featured}
          onClick={() => setValue("featured", !featured, { shouldDirty: true })}
          className={cn("flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors", featured ? "border-transparent chip-on" : "border-white/12 text-subtle hover:border-white/25 hover:text-white")}
        >
          <span>Feature on my store page</span>
          <span className="text-xs opacity-80">{featured ? "Featured" : "Up to 8 pieces"}</span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Occasions</Label>
        <div className="flex flex-wrap gap-2">
          {occasionOptions.map((o) => {
            const on = occasions.includes(o);
            return (
              <button
                key={o}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(o)}
                className={cn("h-9 rounded-full border px-4 text-sm transition-colors", on ? "border-transparent chip-on" : "border-white/12 text-subtle hover:border-white/25 hover:text-white")}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>

      <Row label="Buy link" hint={defaultBuyUrl ? "Leave empty to use your store website." : "Where shoppers land when they tap Buy."} error={errors.buyUrl?.message}>
        <input type="url" placeholder="https://yourbrand.com/product/…" aria-invalid={!!errors.buyUrl} className={input} {...register("buyUrl")} />
      </Row>

      <div className="flex justify-end gap-2 pt-2">
        <ActionButton variant="ghost" onClick={onDone}>
          Cancel
        </ActionButton>
        <ActionButton type="submit" loading={isSubmitting} disabled={uploading > 0}>
          {garment ? "Save changes" : "Add garment"}
        </ActionButton>
      </div>
    </form>
  );
}
