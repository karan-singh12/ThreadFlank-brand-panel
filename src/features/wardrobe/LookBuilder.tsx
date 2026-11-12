"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Check, Shirt } from "lucide-react";
import { ActionButton, Field, Notice, SelectField } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { errorMessage } from "@/features/workspace/hooks";
import { toFile } from "@/features/drape/tryon";
import { OCCASIONS } from "@/data/studio-content";

/** Lays item photos out on a flat-lay board and returns it as a PNG. */
async function flatLay(items: WardrobeItem[]): Promise<Blob | null> {
  try {
    const bitmaps = await Promise.all(items.map(async (i) => createImageBitmap(await toFile(i.image, "piece"))));
    const cols = bitmaps.length <= 2 ? bitmaps.length : bitmaps.length <= 4 ? 2 : 3;
    const rows = Math.ceil(bitmaps.length / cols);
    const cell = 420;
    const pad = 24;
    const canvas = document.createElement("canvas");
    canvas.width = cols * cell + pad * 2;
    canvas.height = rows * cell + pad * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f4f1ec";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    bitmaps.forEach((bmp, i) => {
      const x = pad + (i % cols) * cell;
      const y = pad + Math.floor(i / cols) * cell;
      const scale = Math.min((cell - 24) / bmp.width, (cell - 24) / bmp.height);
      const w = bmp.width * scale;
      const h = bmp.height * scale;
      ctx.drawImage(bmp, x + (cell - w) / 2, y + (cell - h) / 2, w, h);
      bmp.close();
    });
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  } catch {
    return null;
  }
}

/** Manual "create a new look from scratch" (feature #3): mix owned pieces into a saved look. */
export function LookBuilder({ items, onDone }: { items: WardrobeItem[]; onDone: () => void }) {
  const { token } = useAuth();
  const [name, setName] = useState(items.map((i) => i.name).slice(0, 2).join(" + ").slice(0, 60));
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0].id);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  const save = async () => {
    if (!token) return;
    setState("saving");
    setError("");
    try {
      const blob = await flatLay(items);
      const image = blob ? await workspaceApi.upload(token, new File([blob], "flatlay.png", { type: "image/png" }), "looks") : items[0].image;
      await workspaceApi.saveLook(token, { name: name.trim() || "My look", occasion, image, pieces: items.map((i) => i.name) });
      setState("saved");
    } catch (e) {
      setError(errorMessage(e));
      setState("idle");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {items.map((i) => (
          <div key={i.id} title={i.name} className="aspect-square overflow-hidden rounded-lg bg-white/[0.05]">
            <Photo src={i.image} alt={i.name} fit="contain" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Field label="Look name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField label="Occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)} options={OCCASIONS.map((o) => ({ value: o.id, label: o.label }))} />
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {state === "saved" ? (
        <div className="flex flex-wrap items-center gap-3">
          <Notice tone="success">Saved to your looks.</Notice>
          <Link href="/saved" className="text-sm text-accent-bright hover:text-white">
            View saved looks →
          </Link>
          <ActionButton variant="ghost" onClick={onDone} className="ml-auto">
            <Check className="size-4" />
            Done
          </ActionButton>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={save} loading={state === "saving"}>
            <Bookmark className="size-4" />
            Save as look
          </ActionButton>
          <Link href={`/drape?item=${items[0].id}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/12 px-5 text-sm text-subtle hover:text-white">
            <Shirt className="size-4" />
            Drape the main piece
          </Link>
        </div>
      )}
    </div>
  );
}
