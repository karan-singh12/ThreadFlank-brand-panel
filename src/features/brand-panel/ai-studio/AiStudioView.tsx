"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { CheckCircle2, Shirt, Sparkles, Upload } from "lucide-react";
import { ActionButton, Label, Notice, Segmented } from "@/components/ui/Controls";
import { ErrorState } from "@/components/ui/EmptyState";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { brandApi } from "../api";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import type { SimulationResult } from "../types";
import { errorMessage, useResource } from "../useResource";

/** Credits one render costs (fixed by the backend). */
const COST = 15;
const MAX_UPLOAD_MB = 8;
const loadPresets = brandApi.presets;

type Ratio = "9:16" | "1:1" | "16:9";
const RATIOS = [
  { id: "9:16", label: "9:16 · Reels" },
  { id: "1:1", label: "1:1 · Feed" },
  { id: "16:9", label: "16:9 · Banner" },
] as const;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function AiStudioView() {
  const { token } = useAuth();
  const { brand, products, setCredits } = useReadyPanel();
  const presets = useResource(loadPresets);

  const [productId, setProductId] = useState<string | null>(null);
  const [custom, setCustom] = useState<{ dataUrl: string; name: string } | null>(null);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [ratio, setRatio] = useState<Ratio>("9:16");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeProduct = products.find((p) => p.id === productId) ?? (custom ? undefined : products[0]);
  const activeImage = custom?.dataUrl ?? activeProduct?.images?.[0] ?? "";
  const list = presets.data ?? [];
  const activePreset = list.find((p) => p.id === presetId) ?? list[0];
  const canAfford = brand.aiCredits >= COST;
  const canRun = Boolean(activeImage && activePreset && canAfford && !generating);

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`That photo is over ${MAX_UPLOAD_MB} MB. Choose a smaller one.`);
    try {
      setCustom({ dataUrl: await readAsDataUrl(file), name: file.name });
      setResult(null);
      setError("");
    } catch {
      setError("We couldn't read that photo. Try another one.");
    }
  };

  const generate = async () => {
    if (!token || !activePreset) return;
    setGenerating(true);
    setError("");
    try {
      // An uploaded photo is stored first so the render request carries a link, not megabytes of image data.
      const customImageUrl = custom ? (await brandApi.uploadBase64(token, custom.dataUrl, custom.name)).url : undefined;
      const res = await brandApi.simulate(token, {
        garmentId: custom ? undefined : activeProduct?.id,
        customImageUrl,
        motionPreset: activePreset.id,
        motionIntensity: 75,
        prompt: prompt.trim() || undefined,
        promptEnhance: true,
      });
      setResult(res);
      if (typeof res.remainingCredits === "number") setCredits(res.remainingCredits);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <BrandPageHeader
        eyebrow="AI Studio"
        title="Motion videos"
        blurb="Turn a garment photo into a short cinematic clip for your store and socials."
        actions={
          <p className="glass-pill flex h-11 items-center gap-2 rounded-full px-5 text-sm text-white tabular-nums">
            {COST} credits per video · <span className="font-medium">{brand.aiCredits} available</span>
          </p>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}
      {!canAfford && <Notice tone="info">You need at least {COST} AI credits to render a video.</Notice>}

      {/* Garment picker */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <Label>Garment image</Label>
          {custom ? (
            <button
              type="button"
              onClick={() => {
                setCustom(null);
                setResult(null);
              }}
              className="text-accent-bright hover:underline"
            >
              Use a catalog photo instead
            </button>
          ) : (
            activeProduct && <span className="truncate text-muted">Active: {activeProduct.title}</span>
          )}
        </div>
        <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-white/20 px-3.5 py-2.5 text-xs text-white/80 transition-colors hover:border-accent-bright hover:bg-accent/5"
          >
            <Upload className="size-4 text-accent-bright" aria-hidden />
            <span className="whitespace-nowrap font-medium">Upload a photo</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
          {products.map((p) => {
            const selected = !custom && activeProduct?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setProductId(p.id);
                  setCustom(null);
                  setResult(null);
                }}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pr-3 text-left transition-colors",
                  selected ? "border-accent bg-accent/20 text-white ring-1 ring-accent" : "border-white/[0.06] bg-white/[0.02] text-muted hover:border-white/15 hover:text-white"
                )}
              >
                <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
                  {p.images?.[0] ? <Photo src={p.images[0]} alt={p.title} /> : <Shirt className="size-4 text-muted" aria-hidden />}
                </span>
                <span className="min-w-0 max-w-[130px]">
                  <span className="block truncate text-[11px] font-medium text-white">{p.title}</span>
                  <span className="block truncate text-[10px] text-muted">{p.sku}</span>
                </span>
              </button>
            );
          })}
        </div>
        {products.length === 0 && !custom && <p className="text-xs text-muted">Your catalog is empty. Add a garment, or upload a photo to get started.</p>}
      </div>

      <div className="grid grid-cols-1 items-start gap-8 rounded-(--radius-panel) bg-white/[0.02] p-5 ring-1 ring-white/[0.06] sm:p-6 lg:grid-cols-12">
        {/* Canvas */}
        <div className="flex justify-center lg:col-span-5">
          <div
            className={cn(
              "relative w-full max-w-[340px] overflow-hidden rounded-2xl bg-black/60 shadow-2xl ring-1 ring-white/10 transition-[aspect-ratio] duration-300",
              ratio === "9:16" ? "aspect-[9/16]" : ratio === "1:1" ? "aspect-square" : "aspect-video"
            )}
          >
            {result?.previewVideoUrl ? (
              <video src={result.previewVideoUrl} poster={activeImage || undefined} controls autoPlay loop playsInline className="size-full object-cover" />
            ) : activeImage ? (
              <Photo src={activeImage} alt="Selected garment" className={cn("transition-all duration-700", generating && "scale-105 brightness-75 blur-[2px]")} />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted">
                <Shirt className="size-8" strokeWidth={1.5} aria-hidden />
                Pick or upload a garment photo
              </span>
            )}
            {generating && (
              <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 p-4 text-center backdrop-blur-[2px]">
                <div className="size-10 animate-spin rounded-full border-2 border-accent-bright border-t-transparent" />
                <p className="text-xs font-medium text-white">Rendering your video…</p>
                <p className="text-[11px] text-muted">This can take a minute.</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-5 lg:col-span-7">
          <div className="space-y-2">
            <Label>1. Camera and fabric motion</Label>
            {presets.status === "loading" ? (
              <div className="grid gap-2.5 sm:grid-cols-2" aria-busy>
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : presets.status === "error" ? (
              <ErrorState message={presets.error} onRetry={presets.reload} className="py-6" />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {list.map((m) => {
                  const active = activePreset?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPresetId(m.id)}
                      className={cn(
                        "space-y-1 rounded-xl border p-3 text-left transition-colors",
                        active ? "border-accent bg-accent/20 ring-1 ring-accent" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                      )}
                    >
                      <span className="flex items-center justify-between text-xs font-medium text-white">
                        {m.name}
                        {active && <CheckCircle2 className="size-3.5 text-accent-bright" aria-hidden />}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-accent-bright">{m.badge}</span>
                      <span className="line-clamp-2 block text-[11px] leading-relaxed text-muted">{m.description}</span>
                      <span className="block text-[10px] text-dim">
                        {m.cameraMovement} · ~{m.estimatedSeconds}s
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>2. Canvas shape</Label>
            <Segmented label="Canvas shape" value={ratio} onChange={setRatio} options={RATIOS} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studio-prompt">3. Creative direction (optional)</Label>
            <input
              id="studio-prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={300}
              placeholder={activePreset?.promptSuggestion ?? "e.g. Royal evening lights, slow breeze moving the pallu"}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20"
            />
          </div>

          <ActionButton onClick={generate} loading={generating} disabled={!canRun} className="w-full">
            {!generating && <Sparkles className="size-4" aria-hidden />}
            {generating ? "Rendering…" : `Render motion video (${COST} credits)`}
          </ActionButton>

          {result && (
            <p className="text-xs text-muted">
              Done · {result.presetUsed} · {result.creditsDeducted} credits used · {result.remainingCredits} left
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
