"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, Clapperboard, Download, GripVertical, Link2, Play, Plus, Shirt, Sparkles, Trash2, X } from "lucide-react";
import { ActionButton, Label, Notice } from "@/components/ui/Controls";
import { ErrorState } from "@/components/ui/EmptyState";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { assetUrl } from "@/lib/api/config";
import { cn, formatRupee } from "@/lib/utils";
import { brandApi } from "../api";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import type { BrandReel, ProductItem, ReelShotInput } from "../types";
import { GarmentSearch, useGarmentPicker } from "../useGarmentPicker";
import { errorMessage, useResource } from "../useResource";
import { AVATARS, AvatarFigure, AvatarTile, MODEL_POSES, type PoseId } from "./avatars";
import { MAX_UPLOAD_MB, MotionTile, readAsDataUrl } from "./motion";

const POLL_MS = 8000;

const loadStyles = brandApi.reelStyles;
const loadStatus = brandApi.reelStatus;
const loadReels = brandApi.reels;
const loadPresets = brandApi.presets;

/** One shot lined up for the reel: the piece, who wears it, and how the camera moves. */
type Shot = {
  key: string;
  product?: ProductItem;
  upload?: { dataUrl: string; name: string };
  /** null = the garment photo as it is, no model. */
  avatarId: string | null;
  /** null = the style picks the move for this shot. */
  presetId: string | null;
  pose: PoseId;
};

const shotImage = (s: Shot) => s.upload?.dataUrl ?? s.product?.images?.[0] ?? "";
const shotLabel = (s: Shot) => s.product?.title ?? s.upload?.name.replace(/\.[^.]+$/, "") ?? "";

/** A promo reel: several outfits, your cards front and back, one film to post. */
export function ReelStudio() {
  const { token } = useAuth();
  const { brand, products, setCredits } = useReadyPanel();
  const picker = useGarmentPicker();
  const styles = useResource(loadStyles);
  const status = useResource(loadStatus);
  const reels = useResource(loadReels);
  const presets = useResource(loadPresets);

  const [shots, setShots] = useState<Shot[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cfg = status.data;
  const cost = cfg?.cost ?? 60;
  const minShots = cfg?.minShots ?? 3;
  const maxShots = cfg?.maxShots ?? 5;
  const shotSeconds = cfg?.shotSeconds ?? 8;
  const styleList = useMemo(() => styles.data ?? [], [styles.data]);
  const style = styleList.find((s) => s.id === styleId) ?? styleList[0];
  const presetList = useMemo(() => presets.data ?? [], [presets.data]);
  const { data: reelData } = reels;
  const all = useMemo(() => reelData ?? [], [reelData]);
  const busyReel = all.find((r) => r.status === "RENDERING" || r.status === "COMPOSING");
  const open = all.find((r) => r.id === openId) ?? null;

  const shot = shots.find((s) => s.key === current) ?? shots[0] ?? null;
  const avatar = AVATARS.find((a) => a.id === shot?.avatarId);
  const shotPreset = presetList.find((p) => p.id === shot?.presetId);

  const enough = shots.length >= minShots;
  const canAfford = brand.aiCredits >= cost;
  const canRun = Boolean(cfg?.available && enough && canAfford && !starting && !busyReel);
  const runtime = style ? style.introSec + style.outroSec + shots.length * shotSeconds : 0;

  // Reels finish in the background; while one is going, re-list — listing also advances it
  // server-side, which is what collects finished clips and triggers the stitch.
  const { setData: setReels } = reels;
  const poll = useCallback(() => {
    if (!token) return;
    brandApi
      .reels(token)
      .then((next) => setReels(() => next))
      .catch(() => undefined); // a missed check is retried on the next tick
  }, [token, setReels]);
  useEffect(() => {
    if (!busyReel) return;
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [busyReel, poll]);

  const add = (partial: Pick<Shot, "key"> & Partial<Shot>) => {
    setShots((list) => (list.length >= maxShots ? list : [...list, { avatarId: null, presetId: null, pose: "front", ...partial }]));
    setCurrent(partial.key);
    setOpenId(null);
  };

  const patch = (changes: Partial<Shot>) => {
    if (!shot) return;
    setShots((list) => list.map((s) => (s.key === shot.key ? { ...s, ...changes } : s)));
  };

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setError("");
    for (const file of files) {
      if (shots.length >= maxShots) break;
      if (!file.type.startsWith("image/")) {
        setError("Choose image files (JPG, PNG or WebP).");
        continue;
      }
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        setError(`${file.name} is over ${MAX_UPLOAD_MB} MB.`);
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        add({ key: `u-${file.name}-${Date.now()}`, upload: { dataUrl, name: file.name } });
      } catch {
        setError(`We couldn't read ${file.name}.`);
      }
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= shots.length) return;
    setShots((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const drop = (key: string) => {
    setShots((list) => list.filter((s) => s.key !== key));
    setCurrent((c) => (c === key ? null : c));
  };

  const start = async () => {
    if (!token || !style || !canRun) return;
    setStarting(true);
    setError("");
    try {
      // Uploads are stored first, so the request carries links rather than megabytes of image data.
      const payload: ReelShotInput[] = [];
      for (const s of shots) {
        const chosen = s.presetId ? { presetId: s.presetId } : {};
        if (s.upload) {
          const { url } = await brandApi.uploadBase64(token, s.upload.dataUrl, s.upload.name);
          payload.push({ customImageUrl: url, label: shotLabel(s), ...chosen });
        } else if (s.product) {
          payload.push({ garmentId: s.product.id, label: s.product.title, caption: formatRupee(s.product.price), ...chosen });
        }
      }
      const { reel, remainingCredits } = await brandApi.createReel(token, { title: title.trim() || undefined, styleId: style.id, shots: payload });
      setCredits(remainingCredits);
      setReels((prev) => [reel, ...(prev ?? [])]);
      setOpenId(reel.id);
      setShots([]);
      setCurrent(null);
      setTitle("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setStarting(false);
    }
  };

  const remove = async (reel: BrandReel) => {
    if (!token || !confirm("Delete this reel? This can't be undone.")) return;
    try {
      await brandApi.deleteReel(token, reel.id);
      setReels((prev) => (prev ?? []).filter((r) => r.id !== reel.id));
      if (openId === reel.id) setOpenId(null);
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

  const image = shot ? shotImage(shot) : "";
  const step = (n: number) => (avatar ? n + 1 : n);

  return (
    <div className="space-y-6">
      <BrandPageHeader
        eyebrow="AI Studio"
        title="Promo reel"
        blurb={`${minShots}–${maxShots} outfits, your name front and back, one film to post.`}
        actions={
          <p className="glass-pill flex h-11 items-center gap-2 rounded-full px-5 text-sm text-white tabular-nums">
            {cost} credits per reel · <span className="font-medium">{brand.aiCredits} available</span> ·{" "}
            <Link href="/billing" className="text-accent-bright hover:underline">
              Buy more
            </Link>
          </p>
        }
      />

      {status.status === "ready" && !cfg?.available && (
        <Notice tone="info">
          {cfg?.reason === "ffmpeg"
            ? "Reels need video stitching, which isn't switched on for this server yet. You can line one up now; nothing is charged until it can run."
            : "Reels are being switched on for your account. You can line one up now; nothing is charged until rendering works."}
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {cfg?.available && !canAfford && (
        <Notice tone="info">
          A reel costs {cost} credits and you have {brand.aiCredits}.{" "}
          <Link href="/billing" className="font-medium text-white underline">
            Buy a credit pack
          </Link>
        </Notice>
      )}

      <div className="grid grid-cols-1 items-start gap-8 rounded-(--radius-panel) bg-white/[0.02] p-5 ring-1 ring-white/[0.06] sm:p-6 lg:grid-cols-12">
        {/* ── Preview: the shot being set up, or the finished reel ── */}
        <div className="flex flex-col items-center gap-3 lg:sticky lg:top-24 lg:col-span-5">
          <div className="relative aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-2xl bg-black/60 shadow-2xl ring-1 ring-white/10">
            {open?.status === "READY" && open.videoUrl ? (
              <video key={open.id} src={assetUrl(open.videoUrl)} controls autoPlay loop playsInline className="size-full object-cover" />
            ) : avatar && shot ? (
              /* A model was picked for this shot: show the piece on that body. */
              <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.14),transparent_70%)]">
                <span className="absolute bottom-[6%] left-1/2 h-[84%] -translate-x-1/2">
                  <AvatarFigure build={avatar.build} skin={avatar.skin} pose={shot.pose} className="h-full w-auto drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]" />
                  {image && (
                    <span aria-hidden className="pointer-events-none absolute left-1/2 top-[23%] h-[36%] w-[46%] -translate-x-1/2 overflow-hidden rounded-[40%_40%_28%_28%/30%_30%_18%_18%] opacity-85 mix-blend-soft-light">
                      <Photo src={image} alt="" />
                    </span>
                  )}
                </span>
              </span>
            ) : image ? (
              <Photo src={image} alt="" />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted">
                <Shirt className="size-8" strokeWidth={1.5} aria-hidden />
                Add the outfits for your reel
              </span>
            )}
            {!open && shot && (
              <span className="absolute left-2 top-2 flex items-center gap-1.5">
                <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur tabular-nums">
                  Shot {shots.findIndex((s) => s.key === shot.key) + 1}/{shots.length}
                </span>
                {shotPreset && <span className="truncate rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white/85 backdrop-blur">{shotPreset.badge}</span>}
              </span>
            )}
          </div>

          {/* The whole reel, end to end, under the preview. */}
          <div className="no-scrollbar flex w-full max-w-[300px] items-stretch gap-1.5 overflow-x-auto pb-1">
            <EndCard label={brand.name} />
            {shots.map((s, i) => {
              const on = shot?.key === s.key && !open;
              const a = AVATARS.find((x) => x.id === s.avatarId);
              return (
                <span key={s.key} className="group relative w-[52px] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrent(s.key);
                      setOpenId(null);
                    }}
                    aria-label={`Shot ${i + 1}`}
                    className={cn("relative block aspect-[9/16] w-full overflow-hidden rounded-lg bg-black/50 transition", on ? "ring-2 ring-accent-bright" : "ring-1 ring-white/12 hover:ring-white/30")}
                  >
                    {shotImage(s) ? (
                      <Photo src={shotImage(s)} alt="" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center">
                        <Shirt className="size-3.5 text-white/20" />
                      </span>
                    )}
                    <span className="absolute left-0.5 top-0.5 flex size-3.5 items-center justify-center rounded-full bg-black/65 text-[8px] font-medium text-white tabular-nums">{i + 1}</span>
                    {a && (
                      <span className="absolute bottom-0.5 left-1/2 flex h-4 w-3 -translate-x-1/2 items-end justify-center overflow-hidden rounded-sm bg-black/50">
                        <AvatarFigure build={a.build} skin={a.skin} pose={s.pose} className="h-[92%] w-auto" />
                      </span>
                    )}
                  </button>
                  <span className="absolute -top-1 left-1/2 flex -translate-x-1/2 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier" className="rounded-full bg-black/70 text-white/80 hover:text-white disabled:opacity-25">
                      <GripVertical className="size-3 rotate-90" aria-hidden />
                    </button>
                    <button type="button" onClick={() => drop(s.key)} aria-label={`Remove shot ${i + 1}`} className="rounded-full bg-black/70 text-white/80 hover:text-red-300">
                      <X className="size-3" aria-hidden />
                    </button>
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === shots.length - 1} aria-label="Move later" className="rounded-full bg-black/70 text-white/80 hover:text-white disabled:opacity-25">
                      <GripVertical className="size-3 -rotate-90" aria-hidden />
                    </button>
                  </span>
                </span>
              );
            })}
            {shots.length < maxShots && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Add outfit"
                className="flex aspect-[9/16] w-[52px] shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20 transition-colors hover:border-accent-bright hover:bg-accent/5"
              >
                <Plus className="size-4 text-accent-bright" aria-hidden />
              </button>
            )}
            <EndCard label="Shop now" />
          </div>
          <p className="text-[11px] text-muted tabular-nums">
            {shots.length}/{maxShots} outfits{shots.length > 0 && style ? ` · about ${runtime}s` : ""}
          </p>

          {open?.status === "READY" && open.videoUrl && (
            <div className="flex w-full max-w-[300px] gap-2">
              <a
                href={assetUrl(open.videoUrl)}
                download={`${open.title.replace(/[^\w-]+/g, "-").toLowerCase()}.mp4`}
                className="btn-primary flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium hover:brightness-110"
              >
                <Download className="size-4" aria-hidden /> Download MP4
              </a>
              <button type="button" onClick={() => copyLink(open.videoUrl!)} className="glass-pill flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-white hover:brightness-125">
                <Link2 className="size-4" aria-hidden /> {copied ? "Copied" : "Link"}
              </button>
            </div>
          )}
        </div>

        {/* ── Set-up ── */}
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <Label>1. Outfits</Label>
              {!enough && <span className="text-muted">at least {minShots}</span>}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={shots.length >= maxShots}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/20 px-4 py-4 text-left transition-colors hover:border-accent-bright hover:bg-accent/5 disabled:opacity-40"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                <Plus className="size-5 text-accent-bright" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-white">Upload outfit photos</span>
                <span className="block text-[11px] text-muted">One person, full outfit in frame, good light</span>
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={onUpload} className="hidden" />

            {products.length > 0 && (
              <>
                <p className="text-[11px] text-muted">or pick from your catalog</p>
                <GarmentSearch picker={picker} />
                <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
                  {picker.list.map((p) => {
                    const added = shots.some((s) => s.product?.id === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={added || shots.length >= maxShots}
                        onClick={() => add({ key: `p-${p.id}`, product: p })}
                        className={cn(
                          "flex shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pr-3 text-left transition-colors disabled:opacity-40",
                          added ? "border-accent bg-accent/15" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                        )}
                      >
                        <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
                          {p.images?.[0] ? <Photo src={p.images[0]} alt={p.title} /> : <Shirt className="size-4 text-muted" aria-hidden />}
                        </span>
                        <span className="min-w-0 max-w-[130px]">
                          <span className="block truncate text-[11px] font-medium text-white">{p.title}</span>
                          <span className="block truncate text-[10px] text-muted">{formatRupee(p.price)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {shot && (
            <>
              <div className="space-y-2.5">
                <Label>2. Model · shot {shots.findIndex((s) => s.key === shot.key) + 1}</Label>
                <div role="radiogroup" aria-label="Model" className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={shot.avatarId === null}
                    onClick={() => patch({ avatarId: null })}
                    className={cn("group overflow-hidden rounded-2xl transition-all", shot.avatarId === null ? "ring-2 ring-accent-bright" : "ring-1 ring-white/10 hover:ring-white/25")}
                  >
                    <span className="relative flex aspect-[3/4] items-center justify-center bg-white/[0.03]">
                      {image ? <Photo src={image} alt="" /> : <Shirt className="size-5 text-white/25" aria-hidden />}
                    </span>
                    <span className={cn("block truncate px-2 py-1.5 text-[11px] font-medium", shot.avatarId === null ? "bg-accent/20 text-white" : "bg-white/[0.03] text-subtle group-hover:text-white")}>Photo as is</span>
                  </button>
                  {AVATARS.map((a) => (
                    <AvatarTile key={a.id} avatar={a} pose={shot.pose} selected={shot.avatarId === a.id} onSelect={() => patch({ avatarId: a.id })} />
                  ))}
                </div>
              </div>

              {avatar && (
                <div className="space-y-2.5">
                  <Label>3. Pose</Label>
                  <div role="radiogroup" aria-label="Pose" className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
                    {MODEL_POSES.map((p) => {
                      const on = shot.pose === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          aria-label={p.label}
                          onClick={() => patch({ pose: p.id })}
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
                <Label>{step(3)}. Motion look</Label>
                {presets.status === "loading" ? (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" aria-busy>
                    {Array.from({ length: 3 }, (_, i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : presets.status === "error" ? (
                  <ErrorState message={presets.error} onRetry={presets.reload} className="py-6" />
                ) : (
                  <>
                    <div role="radiogroup" aria-label="Motion look" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={shot.presetId === null}
                        onClick={() => patch({ presetId: null })}
                        className={cn("group overflow-hidden rounded-2xl text-left transition-all", shot.presetId === null ? "ring-2 ring-accent-bright" : "ring-1 ring-white/10 hover:ring-white/25")}
                      >
                        <span className="relative flex aspect-[4/3] items-center justify-center bg-[radial-gradient(ellipse_at_50%_20%,#3a3350_0%,#14151f_72%)]">
                          <Sparkles className="size-5 text-white/70" aria-hidden />
                        </span>
                        <span className={cn("block px-3 py-2.5 text-xs font-medium", shot.presetId === null ? "bg-accent/20 text-white" : "bg-white/[0.03] text-subtle group-hover:text-white")}>Style picks</span>
                      </button>
                      {presetList.map((p) => (
                        <MotionTile key={p.id} preset={p} selected={shot.presetId === p.id} onSelect={() => patch({ presetId: p.id })} />
                      ))}
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted">{shotPreset?.description ?? "This shot gets the move the style is known for."}</p>
                  </>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>{shot ? step(4) : 2}. Style</Label>
            {styles.status === "loading" ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : styles.status === "error" ? (
              <ErrorState message={styles.error} onRetry={styles.reload} className="py-6" />
            ) : (
              <>
                <div role="radiogroup" aria-label="Reel style" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {styleList.map((s) => {
                    const on = style?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setStyleId(s.id)}
                        title={s.description}
                        className={cn("overflow-hidden rounded-2xl text-left transition-all", on ? "ring-2 ring-accent-bright" : "ring-1 ring-white/10 hover:ring-white/25")}
                      >
                        <span className="flex h-14 items-center justify-center" style={{ background: `#${s.cardColor.replace(/^0x/, "")}` }}>
                          <Clapperboard className="size-5 text-white/70" strokeWidth={1.5} aria-hidden />
                        </span>
                        <span className={cn("block px-3 py-2", on ? "bg-accent/20" : "bg-white/[0.03]")}>
                          <span className="block truncate text-xs font-medium text-white">{s.name}</span>
                          <span className="block truncate text-[10px] text-muted">{s.badge}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {style && <p className="text-[11px] leading-relaxed text-muted">{style.description}</p>}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reel-title">{shot ? step(5) : 3}. Name (optional)</Label>
            <input
              id="reel-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder={style ? `${brand.name} — ${style.name}` : "Reel name"}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20"
            />
          </div>

          <ActionButton onClick={start} loading={starting} disabled={!canRun} className="h-12 w-full">
            {!starting && <Sparkles className="size-4" aria-hidden />}
            {starting ? "Starting your reel…" : `Make the reel · ${cost} credits`}
          </ActionButton>
          <p className="text-center text-[11px] text-muted">
            {busyReel
              ? "A reel is already being made. Start another once it finishes."
              : `Every shot renders, then they're stitched with your cards. 5-15 minutes, and it keeps going if you leave. If it fails, the ${cost} credits come back.`}
          </p>
        </div>
      </div>

      <ReelGallery reels={all} loading={reels.status === "loading"} error={reels.status === "error" ? reels.error : ""} onRetry={reels.reload} openId={openId} onOpen={setOpenId} onDelete={remove} />
    </div>
  );
}

/** The brand cards that top and tail every reel, shown so the strip reads end to end. */
function EndCard({ label }: { label: string }) {
  return (
    <span className="flex aspect-[9/16] w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0b0b1e] px-1 text-center ring-1 ring-white/10">
      <span className="truncate text-[8px] font-medium text-white/80">{label}</span>
    </span>
  );
}

function ReelGallery({
  reels,
  loading,
  error,
  onRetry,
  openId,
  onOpen,
  onDelete,
}: {
  reels: BrandReel[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  openId: string | null;
  onOpen: (id: string) => void;
  onDelete: (r: BrandReel) => void;
}) {
  return (
    <section aria-label="Your reels" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-white">
          <Clapperboard className="size-4 text-accent-bright" aria-hidden /> Your reels
        </h2>
        {reels.length > 0 && <span className="text-xs text-muted">{reels.length}</span>}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-[9/16]" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} className="py-6" />
      ) : reels.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-muted">Your finished reels appear here, ready to download.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {reels.map((r) => {
            const working = r.status === "RENDERING" || r.status === "COMPOSING";
            const pct = r.shotsTotal ? Math.round((r.shotsReady / r.shotsTotal) * 100) : 0;
            return (
              <article key={r.id} className={cn("group relative overflow-hidden rounded-xl bg-black/50 ring-1 transition", r.id === openId ? "ring-2 ring-accent-bright" : "ring-white/10 hover:ring-white/25")}>
                <button type="button" onClick={() => onOpen(r.id)} aria-label={`Open ${r.title}`} className="relative block aspect-[9/16] w-full">
                  {r.status === "READY" && r.videoUrl ? (
                    <video src={`${assetUrl(r.videoUrl)}#t=0.5`} muted playsInline preload="metadata" className="size-full object-cover" />
                  ) : r.shots[0] ? (
                    <Photo src={r.shots[0].sourceImageUrl} alt="" className={cn(r.status !== "READY" && "brightness-50")} />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center">
                      <Shirt className="size-6 text-white/20" />
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    {working ? (
                      <span className="flex flex-col items-center gap-1.5">
                        <span className="relative flex size-9 items-center justify-center">
                          <span className="absolute inset-0 animate-spin rounded-full border-2 border-accent-bright/30 border-t-accent-bright" />
                        </span>
                        <span className="text-[9px] font-medium text-white">{r.status === "COMPOSING" ? "Stitching…" : `${r.shotsReady}/${r.shotsTotal} clips`}</span>
                      </span>
                    ) : r.status === "READY" ? (
                      <span className="flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition group-hover:scale-110">
                        <Play className="size-3.5 fill-white" aria-hidden />
                      </span>
                    ) : (
                      <AlertTriangle className="size-5 text-amber-300" aria-label="Failed" />
                    )}
                  </span>
                  {working && (
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                      <span className="block h-full bg-accent-bright transition-[width] duration-500" style={{ width: `${r.status === "COMPOSING" ? 100 : pct}%` }} />
                    </span>
                  )}
                </button>
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium text-white">{r.title}</span>
                    <span className={cn("block text-[10px]", r.status === "FAILED" ? "text-amber-300" : "text-muted")}>
                      {r.status === "READY"
                        ? `${r.durationSec}s · ${r.styleName}`
                        : r.status === "FAILED"
                          ? r.refunded
                            ? "Failed · refunded"
                            : "Failed"
                          : r.status === "COMPOSING"
                            ? "Stitching"
                            : "Rendering"}
                    </span>
                  </span>
                  {!working && (
                    <button type="button" onClick={() => onDelete(r)} aria-label="Delete reel" className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-red-500/15 hover:text-red-300">
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
