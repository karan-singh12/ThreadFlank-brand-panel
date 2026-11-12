"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton, Label, Notice, Segmented } from "@/components/ui/Controls";
import { errorMessage } from "../useResource";
import type { CreateGarmentInput, ProductItem } from "../types";
import { garmentSchema, type GarmentValues } from "./schema";
import { cn } from "@/lib/utils";

const input =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20";

/** The backend requires a SKU; the old panel generated one the same way. */
function newSku() {
  return `SKU-${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

function Row({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
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
  onAdd,
  onSave,
  onDone,
}: {
  defaultBuyUrl: string;
  /** The choices admins manage. A piece that already has a category outside the list keeps it as an extra option. */
  categories: readonly string[];
  occasions: readonly string[];
  /** When set, the form edits this garment instead of adding a new one. */
  garment?: ProductItem;
  onAdd?: (g: CreateGarmentInput) => Promise<unknown>;
  onSave?: (id: string, patch: Partial<CreateGarmentInput>) => Promise<unknown>;
  onDone: () => void;
}) {
  const [occasions, setOccasions] = useState<string[]>(garment?.occasions ?? []);
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
          price: String(garment.price),
          category: garment.category || categoryOptions[0] || "",
          stock: String(garment.stock),
          imageUrl: garment.images?.[0] ?? "",
          buyUrl: garment.buyUrl,
          description: garment.description ?? "",
          status: garment.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
          featured: Boolean(garment.featured),
        }
      : { title: "", price: "", category: categoryOptions[0] ?? "", stock: "", imageUrl: "", buyUrl: "", description: "", status: "PUBLISHED", featured: false },
  });

  const status = useWatch({ control, name: "status" });
  const featured = useWatch({ control, name: "featured" });
  const toggle = (o: string) => setOccasions((list) => (list.includes(o) ? list.filter((x) => x !== o) : [...list, o]));

  const submit = handleSubmit(async (v) => {
    setServerError("");
    try {
      if (garment && onSave) {
        await onSave(garment.id, {
          title: v.title.trim(),
          price: Number(v.price),
          images: v.imageUrl ? [v.imageUrl] : [],
          category: v.category,
          occasions,
          stock: v.stock === "" ? 0 : Number(v.stock),
          isDrapeReady: Boolean(v.imageUrl),
          description: v.description.trim(),
          status: v.status,
          featured: v.featured,
          // A product with no store link yet stays that way until the brand adds one.
          ...(v.buyUrl || defaultBuyUrl ? { buyUrl: v.buyUrl || defaultBuyUrl } : {}),
        });
        onDone();
        return;
      }
      await onAdd!({
        title: v.title.trim(),
        sku: newSku(),
        price: Number(v.price),
        images: v.imageUrl ? [v.imageUrl] : [],
        category: v.category,
        occasions,
        colors: [],
        sizes: [],
        stock: v.stock === "" ? 0 : Number(v.stock),
        isDrapeReady: Boolean(v.imageUrl),
        drapeScore: 0,
        description: v.description.trim() || undefined,
        status: v.status,
        buyUrl: v.buyUrl || defaultBuyUrl,
        featured: v.featured,
        newDrop: true,
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
        <Row label="In stock" hint="Leave empty for 0 (shows Out of stock)" error={errors.stock?.message}>
          <input type="number" inputMode="numeric" min={0} aria-invalid={!!errors.stock} className={input} {...register("stock")} />
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

      <Row label="Description" hint="What shoppers read about this piece. Optional." error={errors.description?.message}>
        <textarea rows={3} maxLength={2000} placeholder="e.g. Hand-woven silk with a zari border, made for festive evenings." aria-invalid={!!errors.description} className={cn(input, "h-24 resize-none py-3")} {...register("description")} />
      </Row>

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

      <Row label="Garment image link" hint="A clear front-facing photo (https). Garments without one are saved as Not ready and can't be tried on." error={errors.imageUrl?.message}>
        <input type="url" placeholder="https://…" aria-invalid={!!errors.imageUrl} className={input} {...register("imageUrl")} />
      </Row>

      <Row label="Buy link" hint={defaultBuyUrl ? "Leave empty to use your store website." : "Where shoppers land when they tap Buy."} error={errors.buyUrl?.message}>
        <input type="url" placeholder="https://yourbrand.com/product/…" aria-invalid={!!errors.buyUrl} className={input} {...register("buyUrl")} />
      </Row>

      <div className="flex justify-end gap-2 pt-2">
        <ActionButton variant="ghost" onClick={onDone}>
          Cancel
        </ActionButton>
        <ActionButton type="submit" loading={isSubmitting}>
          {garment ? "Save changes" : "Add garment"}
        </ActionButton>
      </div>
    </form>
  );
}
