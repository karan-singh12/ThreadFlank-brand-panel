"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Shirt, Sparkles, Upload } from "lucide-react";
import { ActionButton, Label, Notice } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { useReadyPanel } from "../BrandPanelProvider";
import { BrandPageHeader } from "../BrandPageHeader";
import { cn } from "@/lib/utils";
import { GarmentSearch, useGarmentPicker } from "../useGarmentPicker";
import { AVATARS, AvatarFigure, AvatarTile, BACKDROPS, MODEL_POSES, type PoseId } from "./avatars";
import { MAX_UPLOAD_MB, readAsDataUrl } from "./motion";

/**
 * Model shoot: a flat garment photo goes on one of the panel's models, the way the drape studio
 * puts a piece on a shopper. The set-up is complete and previewed live; rendering is switched on
 * separately, so nothing is spent from here yet.
 */
export function ModelStudio() {
  const { brand, products } = useReadyPanel();
  const picker = useGarmentPicker();

  const [upload, setUpload] = useState<{ dataUrl: string; name: string } | null>(null);
  const [avatarId, setAvatarId] = useState(AVATARS[0].id);
  const [pose, setPose] = useState<PoseId>("front");
  const [backdropId, setBackdropId] = useState(BACKDROPS[0].id);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0];
  const backdrop = BACKDROPS.find((b) => b.id === backdropId) ?? BACKDROPS[0];
  const product = picker.selected;
  const garment = upload?.dataUrl ?? product?.images?.[0] ?? "";
  const garmentName = upload?.name.replace(/\.[^.]+$/, "") ?? product?.title ?? "";

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`That photo is over ${MAX_UPLOAD_MB} MB. Choose a smaller one.`);
    try {
      setUpload({ dataUrl: await readAsDataUrl(file), name: file.name });
      setError("");
    } catch {
      setError("We couldn't read that photo. Try another one.");
    }
  };

  return (
    <div className="space-y-6">
      <BrandPageHeader
        eyebrow="AI Studio"
        title="Model shoot"
        blurb="A flat photo in, the piece worn by a model out."
        actions={
          <p className="glass-pill flex h-11 items-center gap-2 rounded-full px-5 text-sm text-white tabular-nums">
            <span className="font-medium">{brand.aiCredits} credits</span> ·{" "}
            <Link href="/billing" className="text-accent-bright hover:underline">
              Buy more
            </Link>
          </p>
        }
      />

      <Notice tone="info">Model rendering is being switched on. Set a shoot up now and preview it; nothing is charged until it can run.</Notice>
      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid grid-cols-1 items-start gap-8 rounded-(--radius-panel) bg-white/[0.02] p-5 ring-1 ring-white/[0.06] sm:p-6 lg:grid-cols-12">
        {/* ── The shot as set up so far ── */}
        <div className="flex flex-col items-center gap-3 lg:sticky lg:top-24 lg:col-span-5">
          <div className="relative w-full max-w-[300px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10" style={{ aspectRatio: "3 / 4", background: backdrop.css }}>
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-black/45 to-transparent" />
            <span className="absolute bottom-[6%] left-1/2 h-[82%] -translate-x-1/2">
              <AvatarFigure build={avatar.build} skin={avatar.skin} pose={pose} className="h-full w-auto drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]" />
              {/* The piece, laid over the body: a stand-in for the drape until rendering is on. */}
              {garment && (
                <span aria-hidden className="pointer-events-none absolute inset-0">
                  <span className="absolute left-1/2 top-[23%] h-[36%] w-[46%] -translate-x-1/2 overflow-hidden rounded-[40%_40%_28%_28%/30%_30%_18%_18%] opacity-85 mix-blend-soft-light">
                    <Photo src={garment} alt="" />
                  </span>
                </span>
              )}
            </span>
            {!garment && (
              <span className="absolute inset-x-0 bottom-3 text-center text-[11px] text-white/70">Add a garment photo</span>
            )}
          </div>
          {garmentName && <p className="max-w-[300px] truncate text-center text-xs text-muted">{garmentName}</p>}
        </div>

        {/* ── Set-up ── */}
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <Label>Garment</Label>
              {upload && (
                <button type="button" onClick={() => setUpload(null)} className="text-accent-bright hover:underline">
                  Clear
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border border-dashed px-4 py-4 text-left transition-colors",
                upload ? "border-accent bg-accent/15" : "border-white/20 hover:border-accent-bright hover:bg-accent/5"
              )}
            >
              <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06]">
                {upload ? <Photo src={upload.dataUrl} alt="" /> : <Upload className="size-5 text-accent-bright" strokeWidth={1.75} aria-hidden />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">{upload ? upload.name : "Upload a photo"}</span>
                <span className="block text-[11px] text-muted">The piece on its own, flat or on a hanger</span>
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />

            {products.length > 0 && (
              <>
                <p className="text-[11px] text-muted">or pick from your catalog</p>
                <GarmentSearch picker={picker} />
                <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
                  {picker.list.map((p) => {
                    const on = !upload && product?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          picker.pick(p);
                          setUpload(null);
                        }}
                        className={cn(
                          "flex shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pr-3 text-left transition-colors",
                          on ? "border-accent bg-accent/20 ring-1 ring-accent" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                        )}
                      >
                        <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
                          {p.images?.[0] ? <Photo src={p.images[0]} alt={p.title} /> : <Shirt className="size-4 text-muted" aria-hidden />}
                        </span>
                        <span className="min-w-0 max-w-[130px]">
                          <span className="block truncate text-[11px] font-medium text-white">{p.title}</span>
                          <span className="block truncate text-[10px] text-muted">{p.category}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="space-y-2.5">
            <Label>Model</Label>
            <div role="radiogroup" aria-label="Model" className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {AVATARS.map((a) => (
                <AvatarTile key={a.id} avatar={a} pose={pose} selected={a.id === avatar.id} onSelect={() => setAvatarId(a.id)} />
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <Label>Pose</Label>
            <div role="radiogroup" aria-label="Pose" className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
              {MODEL_POSES.map((p) => {
                const on = pose === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={p.label}
                    onClick={() => setPose(p.id)}
                    className={cn("w-[88px] shrink-0 overflow-hidden rounded-2xl transition-all", on ? "ring-2 ring-accent-bright" : "ring-1 ring-white/10 hover:ring-white/25")}
                  >
                    <span className="relative flex aspect-[3/4] items-end justify-center bg-white/[0.03]">
                      <AvatarFigure build={avatar.build} skin={avatar.skin} pose={p.id} className="h-[86%] w-auto" />
                    </span>
                    <span className={cn("block truncate px-2 py-1.5 text-[10px] font-medium", on ? "bg-accent/20 text-white" : "bg-white/[0.03] text-subtle")}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5">
            <Label>Backdrop</Label>
            <div role="radiogroup" aria-label="Backdrop" className="flex flex-wrap gap-2.5">
              {BACKDROPS.map((b) => {
                const on = b.id === backdrop.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={b.label}
                    title={b.label}
                    onClick={() => setBackdropId(b.id)}
                    className={cn("size-12 rounded-xl transition-all", on ? "ring-2 ring-accent-bright ring-offset-2 ring-offset-[#0b0b1e]" : "ring-1 ring-white/15 hover:ring-white/35")}
                    style={{ background: b.css }}
                  />
                );
              })}
            </div>
            <p className="text-[11px] text-muted">{backdrop.label}</p>
          </div>

          <ActionButton onClick={() => undefined} disabled className="h-12 w-full">
            <Sparkles className="size-4" aria-hidden />
            Shoot the model
          </ActionButton>
        </div>
      </div>

      <section aria-label="Your model shots" className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-white">
          <Camera className="size-4 text-accent-bright" aria-hidden /> Your model shots
        </h2>
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-muted">Finished shots appear here, ready to drop into a video.</p>
      </section>
    </div>
  );
}
