"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Link2, LoaderCircle } from "lucide-react";
import { ActionButton, Field, Label, Notice, SelectField } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { errorMessage } from "@/features/workspace/hooks";
import { fetchGarmentImage } from "@/features/drape/tryon";
import { WARDROBE_CATEGORIES, wardrobeContent } from "@/data/studio-content";

const copy = wardrobeContent.form;

export function AddItemForm({ onAdded }: { onAdded: (item: WardrobeItem) => void }) {
  const { token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<string>(WARDROBE_CATEGORIES[0]);
  const [color, setColor] = useState("");
  const [tags, setTags] = useState("");
  const [cost, setCost] = useState("");
  const [similar, setSimilar] = useState<WardrobeItem[]>([]);

  // "You already own something similar": check as the name/category/colour settle.
  useEffect(() => {
    if (!token || name.trim().length < 3) return;
    const id = window.setTimeout(() => {
      workspaceApi
        .similarItems(token, { category, color: color.trim() || undefined, name: name.trim() })
        .then(setSimilar)
        .catch(() => setSimilar([]));
    }, 500);
    return () => window.clearTimeout(id);
  }, [token, name, category, color]);
  const [busy, setBusy] = useState<"upload" | "link" | "save" | null>(null);
  const [error, setError] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file || !token) return;
    setBusy("upload");
    setError("");
    try {
      setImage(await workspaceApi.upload(token, file, "wardrobe"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const fromLink = async () => {
    if (!link.trim()) return;
    setBusy("link");
    setError("");
    try {
      setImage(await fetchGarmentImage(link.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !image) return;
    setBusy("save");
    setError("");
    try {
      const item = await workspaceApi.addWardrobeItem(token, {
        name: name.trim(),
        brand: brand.trim() || undefined,
        category,
        image,
        color: color.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        costPaid: cost.trim() ? Math.round(Number(cost)) : undefined,
      });
      onAdded(item);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>{copy.photo}</Label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex aspect-[3/4] w-28 shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-(--radius-card) border border-dashed border-white/20 bg-white/[0.03] text-xs text-muted hover:border-accent-bright/60 hover:text-white"
          >
            {image ? (
              <Photo src={image} alt="Item preview" className="absolute inset-0" fit="contain" />
            ) : (
              <>
                <ImagePlus className="size-6" strokeWidth={1.5} />
                {copy.upload}
              </>
            )}
            {busy === "upload" && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                <LoaderCircle className="size-6 animate-spin text-white" />
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <div className="flex min-w-0 flex-1 flex-col justify-end gap-2">
            <p className="text-xs text-muted">{copy.orLink}</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
                aria-label={copy.orLink}
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none placeholder:text-muted/70 focus:border-accent-bright/70"
              />
              <ActionButton variant="ghost" onClick={fromLink} loading={busy === "link"} disabled={!link.trim()} aria-label="Fetch image from link">
                {busy !== "link" && <Link2 className="size-4" />}
              </ActionButton>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={copy.name} required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className="col-span-2" />
        <Field label={copy.brand} maxLength={40} value={brand} onChange={(e) => setBrand(e.target.value)} />
        <SelectField label={copy.category} value={category} onChange={(e) => setCategory(e.target.value)} options={WARDROBE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <Field label={copy.color} maxLength={24} value={color} onChange={(e) => setColor(e.target.value)} />
        <Field label={copy.tags} hint={copy.tagsHint} value={tags} onChange={(e) => setTags(e.target.value)} />
        <Field label="Price paid (₹)" hint="Optional — powers cost per wear" type="number" min={0} inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} />
      </div>

      {name.trim().length >= 3 && similar.length > 0 && (
        <div className="rounded-xl border border-amber-300/30 bg-amber-300/[0.06] p-3">
          <p className="text-sm text-amber-100">You already own something similar:</p>
          <div className="mt-2 flex gap-2">
            {similar.slice(0, 4).map((s) => (
              <div key={s.id} title={`${s.name} · worn ${s.wornCount}×`} className="w-14">
                <div className="aspect-square overflow-hidden rounded-lg bg-white/[0.05]">
                  <Photo src={s.image} alt={s.name} fit="contain" />
                </div>
                <p className="mt-1 truncate text-[10px] text-muted">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <ActionButton type="submit" loading={busy === "save"} disabled={!image || !name.trim() || busy !== null}>
        {copy.submit}
      </ActionButton>
    </form>
  );
}
