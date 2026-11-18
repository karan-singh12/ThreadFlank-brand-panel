"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, Clapperboard, Download, Film, Link2, LoaderCircle, Play, RotateCcw, Shirt, Sparkles, Trash2, Upload } from "lucide-react";
import { ActionButton, Label, Notice, Segmented } from "@/components/ui/Controls";
import { ErrorState } from "@/components/ui/EmptyState";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { brandApi } from "../api";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import type { BrandVideo } from "../types";
import { GarmentSearch, useGarmentPicker } from "../useGarmentPicker";
import { errorMessage, useResource } from "../useResource";
import { AVATARS, AvatarFigure, AvatarTile, MODEL_POSES, type PoseId } from "./avatars";
import { MAX_UPLOAD_MB, MotionTile, aspectClass, readAsDataUrl } from "./motion";

/** How often the studio checks on renders in progress. */
const POLL_MS = 6000;
const RATIO_LABEL: Record<string, string> = { "9:16": "9:16 · Reels & Stories", "16:9": "16:9 · Banner & YouTube" };
const loadPresets = brandApi.presets;
const loadStatus = brandApi.videoStatus;
const loadVideos = brandApi.videos;

/** What the render is doing, from how long it has been going (engines don't report real progress). */
function stage(seconds: number) {
  if (seconds < 15) return "Sending your photo to the studio";
  if (seconds < 60) return "Directing the camera and the motion";
  if (seconds < 150) return "Rendering the frames";
  return "Finishing touches. Long renders can take a few minutes";
}

function useElapsed(since: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [since]);
  return since ? Math.max(0, Math.round((now - new Date(since).getTime()) / 1000)) : 0;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** One clip: a garment photo, a model, a motion look, rendered in the background. */
export function ClipStudio() {
  const { token } = useAuth();
  const { brand, products, setCredits } = useReadyPanel();
  const picker = useGarmentPicker();
  const presets = useResource(loadPresets);
  const status = useResource(loadStatus);
  const videos = useResource(loadVideos);

  const [productId, setProductId] = useState<string | null>(null);
  const [custom, setCustom] = useState<{ dataUrl: string; name: string } | null>(null);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [pose, setPose] = useState<PoseId>("front");
  const [presetId, setPresetId] = useState<string | null>(null);
  const [ratio, setRatio] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cfg = status.data;
  const cost = cfg?.cost ?? 15;
  const ratios = cfg?.aspectRatios ?? [];
  const activeRatio = ratio && ratios.includes(ratio) ? ratio : ratios[0] ?? "9:16";
  const activeProduct = (picker.selected && picker.selected.id === productId ? picker.selected : undefined) ?? (custom ? undefined : products[0]);
  const activeImage = custom?.dataUrl ?? activeProduct?.images?.[0] ?? "";
  const avatar = AVATARS.find((a) => a.id === avatarId);
  const list = presets.data ?? [];
  const activePreset = list.find((p) => p.id === presetId) ?? list[0];
  const { data: videoData } = videos;
  const all = useMemo(() => videoData ?? [], [videoData]);
  const rendering = all.filter((v) => v.status === "RENDERING");
  const canAfford = brand.aiCredits >= cost;
  const canRun = Boolean(cfg?.available && activeImage && activePreset && canAfford && !starting && rendering.length < 2);
  const active = all.find((v) => v.id === activeId) ?? null;

  // Renders finish in the background: while any is going, re-list every few seconds (listing also
  // checks on them). A render that fails gives its credits back, so add them to the balance shown.
  const seen = useRef(new Map<string, BrandVideo["status"]>());
  const creditsRef = useRef(brand.aiCredits);
  useEffect(() => {
    creditsRef.current = brand.aiCredits;
  });
  useEffect(() => {
    for (const v of all) {
      const before = seen.current.get(v.id);
      if (before === "RENDERING" && v.status === "FAILED" && v.refunded) setCredits(creditsRef.current + v.credits);
      seen.current.set(v.id, v.status);
    }
  }, [all, setCredits]);

  const { setData: setVideos } = videos;
  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const next = await brandApi.videos(token);
      setVideos(() => next);
    } catch {
      /* a missed check is retried on the next tick */
    }
  }, [token, setVideos]);
  useEffect(() => {
    if (rendering.length === 0) return;
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [rendering.length, poll]);

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`That photo is over ${MAX_UPLOAD_MB} MB. Choose a smaller one.`);
    try {
      setCustom({ dataUrl: await readAsDataUrl(file), name: file.name });
      setError("");
    } catch {
      setError("We couldn't read that photo. Try another one.");
    }
  };

  const generate = async () => {
    if (!token || !activePreset) return;
    setStarting(true);
    setError("");
    try {
      // An uploaded photo is stored first so the request carries a link, not megabytes of image data.
      const customImageUrl = custom ? (await brandApi.uploadBase64(token, custom.dataUrl, custom.name)).url : undefined;
      const { video, remainingCredits } = await brandApi.createVideo(token, {
        garmentId: custom ? undefined : activeProduct?.id,
        customImageUrl,
        presetId: activePreset.id,
        aspectRatio: ratios.length ? activeRatio : undefined,
        prompt: prompt.trim() || undefined,
      });
      setCredits(remainingCredits);
      seen.current.set(video.id, video.status);
      setVideos((prev) => [video, ...(prev ?? [])]);
      setActiveId(video.id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setStarting(false);
    }
  };

  const remove = async (v: BrandVideo) => {
    if (!token || !confirm("Delete this video? This can't be undone.")) return;
    try {
      await brandApi.deleteVideo(token, v.id);
      setVideos((prev) => (prev ?? []).filter((x) => x.id !== v.id));
      if (activeId === v.id) setActiveId(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(assetUrl(url));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the download button still works */
    }
  };

  const shownRatio = active?.aspectRatio && active.aspectRatio !== "auto" ? active.aspectRatio : ratios.length ? activeRatio : "9:16";

  return (
    <div className="space-y-6">
      <BrandPageHeader
        eyebrow="AI Studio"
        title="Motion videos"
        blurb="A garment photo in, a short fashion film out."
        actions={
          <p className="glass-pill flex h-11 items-center gap-2 rounded-full px-5 text-sm text-white tabular-nums">
            {cost} credits per video · <span className="font-medium">{brand.aiCredits} available</span> ·{" "}
            <Link href="/billing" className="text-accent-bright hover:underline">
              Buy more
            </Link>
          </p>
        }
      />

      {status.status === "ready" && !cfg?.available && (
        <Notice tone="info">Motion videos are being switched on for your account. You can set up a video now; rendering will start working soon, and nothing is charged until it does.</Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {cfg?.available && !canAfford && (
        <Notice tone="info">
          A motion video costs {cost} credits and you have {brand.aiCredits}.{" "}
          <Link href="/billing" className="font-medium text-white underline">
            Buy a credit pack
          </Link>
        </Notice>
      )}

      <div className="grid grid-cols-1 items-start gap-8 rounded-(--radius-panel) bg-white/[0.02] p-5 ring-1 ring-white/[0.06] sm:p-6 lg:grid-cols-12">
        {/* ── Preview: the photo, the render in progress, or the finished clip ── */}
        <div className="flex flex-col items-center gap-3 lg:sticky lg:top-24 lg:col-span-5">
          <div className={cn("relative w-full max-w-[300px] overflow-hidden rounded-2xl bg-black/60 shadow-2xl ring-1 ring-white/10 transition-[aspect-ratio] duration-300", aspectClass(shownRatio))}>
            {active?.status === "READY" && active.videoUrl ? (
              <video key={active.id} src={assetUrl(active.videoUrl)} poster={assetUrl(active.sourceImageUrl)} controls autoPlay loop muted playsInline className="size-full object-cover" />
            ) : !active && avatar ? (
              /* A model was picked: show the piece on that body rather than lying flat. */
              <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.14),transparent_70%)]">
                <span className="absolute bottom-[6%] left-1/2 h-[84%] -translate-x-1/2">
                  <AvatarFigure build={avatar.build} skin={avatar.skin} pose={pose} className="h-full w-auto drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]" />
                  {activeImage && (
                    <span aria-hidden className="pointer-events-none absolute left-1/2 top-[23%] h-[36%] w-[46%] -translate-x-1/2 overflow-hidden rounded-[40%_40%_28%_28%/30%_30%_18%_18%] opacity-85 mix-blend-soft-light">
                      <Photo src={activeImage} alt="" />
                    </span>
                  )}
                </span>
              </span>
            ) : (active?.sourceImageUrl ?? activeImage) ? (
              <Photo src={active?.sourceImageUrl ?? activeImage} alt="Garment photo" className={cn("transition-all duration-700", active?.status === "RENDERING" && "scale-105 brightness-50 blur-[2px]")} />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted">
                <Shirt className="size-8" strokeWidth={1.5} aria-hidden />
                Pick or upload a garment photo
              </span>
            )}
            {active?.status === "RENDERING" && <RenderingOverlay video={active} />}
            {active?.status === "FAILED" && (
              <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-5 text-center">
                <AlertTriangle className="size-6 text-amber-300" aria-hidden />
                <p className="text-xs font-medium text-white">This render didn&apos;t work</p>
                <p className="line-clamp-4 text-[11px] text-muted">{active.error}</p>
                {active.refunded && <p className="text-[11px] text-green">{active.credits} credits were returned.</p>}
              </div>
            )}
          </div>

          {active?.status === "READY" && active.videoUrl && (
            <div className="flex w-full max-w-[300px] gap-2">
              <a href={assetUrl(active.videoUrl)} download={`${active.presetName.replace(/\s+/g, "-").toLowerCase()}.mp4`} className="btn-primary flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium hover:brightness-110">
                <Download className="size-4" aria-hidden /> Download MP4
              </a>
              <button type="button" onClick={() => copyLink(active.videoUrl!)} className="glass-pill flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-white hover:brightness-125">
                <Link2 className="size-4" aria-hidden /> {copied ? "Copied" : "Link"}
              </button>
            </div>
          )}
          {active && (
            <button type="button" onClick={() => setActiveId(null)} className="flex items-center gap-1.5 text-xs text-accent-bright hover:underline">
              <RotateCcw className="size-3.5" aria-hidden /> Set up a new video
            </button>
          )}
        </div>

        {/* ── Set-up ── */}
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <Label>1. Garment photo</Label>
              {custom ? (
                <button type="button" onClick={() => setCustom(null)} className="text-accent-bright hover:underline">
                  Clear
                </button>
              ) : (
                activeProduct && <span className="truncate text-muted">{activeProduct.title}</span>
              )}
            </div>

            {/* Uploading is the way in: a photo is all this needs, catalog or no catalog. */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border border-dashed px-4 py-4 text-left transition-colors",
                custom ? "border-accent bg-accent/15" : "border-white/20 hover:border-accent-bright hover:bg-accent/5"
              )}
            >
              <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06]">
                {custom ? <Photo src={custom.dataUrl} alt="" /> : <Upload className="size-5 text-accent-bright" strokeWidth={1.75} aria-hidden />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">{custom ? custom.name : "Upload a photo"}</span>
                <span className="block text-[11px] text-muted">One person, full outfit in frame, good light</span>
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />

            {/* The catalog is a shortcut for brands that have one, never a requirement. */}
            {products.length > 0 && (
              <>
                <p className="text-[11px] text-muted">or pick from your catalog</p>
                <GarmentSearch picker={picker} />
              </>
            )}
            <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
              {picker.list.map((p) => {
                const selected = !custom && activeProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setProductId(p.id);
                      picker.pick(p);
                      setCustom(null);
                      setActiveId(null);
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
                      <span className="block truncate text-[10px] text-muted">{p.category}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Who wears it: the photo as it is, or draped on one of our models ── */}
          <div className="space-y-2.5">
            <Label>2. Model</Label>
            <div role="radiogroup" aria-label="Model" className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
              <button
                type="button"
                role="radio"
                aria-checked={avatarId === null}
                onClick={() => setAvatarId(null)}
                className={cn("group overflow-hidden rounded-2xl transition-all", avatarId === null ? "ring-2 ring-accent-bright" : "ring-1 ring-white/10 hover:ring-white/25")}
              >
                <span className="relative flex aspect-[3/4] items-center justify-center bg-white/[0.03]">
                  {activeImage ? <Photo src={activeImage} alt="" /> : <Shirt className="size-5 text-white/25" aria-hidden />}
                </span>
                <span className={cn("block truncate px-2 py-1.5 text-[11px] font-medium", avatarId === null ? "bg-accent/20 text-white" : "bg-white/[0.03] text-subtle group-hover:text-white")}>Photo as is</span>
              </button>
              {AVATARS.map((a) => (
                <AvatarTile key={a.id} avatar={a} pose={pose} selected={avatarId === a.id} onSelect={() => setAvatarId(a.id)} />
              ))}
            </div>
            {avatar && <p className="text-[11px] text-muted">The piece is draped on this model first, then the camera moves.</p>}
          </div>

          {avatar && (
            <div className="space-y-2.5">
              <Label>3. Pose</Label>
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
          )}

          <div className="space-y-2">
            <Label>{avatar ? "4." : "3."} Motion look</Label>
            {presets.status === "loading" ? (
              <div className="grid gap-2.5 sm:grid-cols-2" aria-busy>
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : presets.status === "error" ? (
              <ErrorState message={presets.error} onRetry={presets.reload} className="py-6" />
            ) : (
              <>
                <div role="radiogroup" aria-label="Motion look" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {list.map((m) => (
                    <MotionTile key={m.id} preset={m} selected={activePreset?.id === m.id} onSelect={() => setPresetId(m.id)} />
                  ))}
                </div>
                {activePreset && <p className="text-[11px] leading-relaxed text-muted">{activePreset.description}</p>}
              </>
            )}
          </div>

          {ratios.length > 1 && (
            <div className="space-y-2">
              <Label>{avatar ? "5." : "4."} Shape</Label>
              <Segmented label="Shape" value={activeRatio} onChange={setRatio} options={ratios.map((r) => ({ id: r, label: RATIO_LABEL[r] ?? r }))} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="studio-prompt">{(avatar ? 5 : 4) + (ratios.length > 1 ? 1 : 0)}. Creative direction (optional)</Label>
            <textarea
              id="studio-prompt"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={300}
              placeholder="e.g. Golden-hour light on a palace terrace, a soft breeze lifting the dupatta"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20"
            />
            <p className="text-right text-[10px] text-dim tabular-nums">{prompt.length}/300</p>
          </div>

          <ActionButton onClick={generate} loading={starting} disabled={!canRun} className="h-12 w-full">
            {!starting && <Sparkles className="size-4" aria-hidden />}
            {starting ? "Starting your render…" : `Render ${cfg?.durationSec ? `${cfg.durationSec}-second ` : ""}video · ${cost} credits`}
          </ActionButton>
          <p className="text-center text-[11px] text-muted">
            {rendering.length >= 2
              ? "Two videos are rendering. Start another when one finishes."
              : "Renders take 1–3 minutes and keep going if you leave this page. If one fails, its credits come back."}
          </p>
        </div>
      </div>

      <VideoGallery videos={videos} activeId={activeId} onOpen={setActiveId} onDelete={remove} />
    </div>
  );
}

function RenderingOverlay({ video }: { video: BrandVideo }) {
  const seconds = useElapsed(video.createdAt);
  return (
    <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 p-5 text-center">
      <span className="relative flex size-12 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-accent-bright/30 border-t-accent-bright" />
        <Clapperboard className="size-5 text-white" aria-hidden />
      </span>
      <p className="text-xs font-medium text-white">{stage(seconds)}</p>
      <p className="font-mono text-[11px] tabular-nums text-muted">{clock(seconds)}</p>
    </div>
  );
}

function VideoGallery({
  videos,
  activeId,
  onOpen,
  onDelete,
}: {
  videos: ReturnType<typeof useResource<BrandVideo[]>>;
  activeId: string | null;
  onOpen: (id: string) => void;
  onDelete: (v: BrandVideo) => void;
}) {
  const list = useMemo(() => videos.data ?? [], [videos.data]);
  return (
    <section aria-label="Your videos" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-white">
          <Film className="size-4 text-accent-bright" aria-hidden /> Your videos
        </h2>
        {list.length > 0 && <span className="text-xs text-muted">{list.length}</span>}
      </div>
      {videos.status === "loading" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-[9/16]" />
          ))}
        </div>
      ) : videos.status === "error" ? (
        <ErrorState message={videos.error} onRetry={videos.reload} className="py-6" />
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-muted">Your rendered videos will appear here, ready to download.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((v) => (
            <article key={v.id} className={cn("group relative overflow-hidden rounded-xl bg-black/50 ring-1 transition", v.id === activeId ? "ring-2 ring-accent-bright" : "ring-white/10 hover:ring-white/25")}>
              <button type="button" onClick={() => onOpen(v.id)} aria-label={`Open ${v.presetName} video`} className={cn("relative block w-full", aspectClass(v.aspectRatio))}>
                {v.status === "READY" && v.videoUrl ? (
                  <video src={`${assetUrl(v.videoUrl)}#t=0.5`} muted playsInline preload="metadata" className="size-full object-cover" />
                ) : (
                  <Photo src={v.sourceImageUrl} alt="" className={cn(v.status !== "READY" && "brightness-50")} />
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  {v.status === "RENDERING" ? (
                    <LoaderCircle className="size-6 animate-spin text-white" aria-label="Rendering" />
                  ) : v.status === "READY" ? (
                    <span className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white opacity-90 backdrop-blur transition group-hover:scale-110">
                      <Play className="size-4 fill-white" aria-hidden />
                    </span>
                  ) : (
                    <AlertTriangle className="size-5 text-amber-300" aria-label="Failed" />
                  )}
                </span>
              </button>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-medium text-white">{v.presetName}</span>
                  <span className={cn("block text-[10px]", v.status === "FAILED" ? "text-amber-300" : "text-muted")}>
                    {v.status === "RENDERING" ? "Rendering…" : v.status === "FAILED" ? (v.refunded ? "Failed · refunded" : "Failed") : new Date(v.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </span>
                {v.status !== "RENDERING" && (
                  <button type="button" onClick={() => onDelete(v)} aria-label="Delete video" className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-red-500/15 hover:text-red-300">
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
