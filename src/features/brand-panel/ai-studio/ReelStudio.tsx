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

const MAX_UPLOAD_MB = 8;
const POLL_MS = 8000;

const loadStyles = brandApi.reelStyles;
const loadStatus = brandApi.reelStatus;
const loadReels = brandApi.reels;

/** One outfit the brand has lined up, before the reel is started. */
type Slot = { key: string; product?: ProductItem; upload?: { dataUrl: string; name: string } };

const slotImage = (s: Slot) => s.upload?.dataUrl ?? s.product?.images?.[0] ?? "";
const slotLabel = (s: Slot) => s.product?.title ?? s.upload?.name.replace(/\.[^.]+$/, "") ?? "";

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Promo reels: several outfits, the brand's own cards, one film ready to post. */
export function ReelStudio() {
  const { token } = useAuth();
  const { brand, products, setCredits } = useReadyPanel();
  const picker = useGarmentPicker();
  const styles = useResource(loadStyles);
  const status = useResource(loadStatus);
  const reels = useResource(loadReels);

  const [slots, setSlots] = useState<Slot[]>([]);
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
  const { data: reelData } = reels;
  const all = useMemo(() => reelData ?? [], [reelData]);
  const busyReel = all.find((r) => r.status === "RENDERING" || r.status === "COMPOSING");
  const open = all.find((r) => r.id === openId) ?? null;

  const enough = slots.length >= minShots;
  const canAfford = brand.aiCredits >= cost;
  const canRun = Boolean(cfg?.available && enough && canAfford && !starting && !busyReel);
  const runtime = style ? style.introSec + style.outroSec + slots.length * shotSeconds : 0;

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

  const addProduct = (p: ProductItem) => {
    setSlots((list) => (list.length >= maxShots || list.some((s) => s.product?.id === p.id) ? list : [...list, { key: `p-${p.id}`, product: p }]));
  };

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setError("");
    for (const file of files) {
      if (slots.length >= maxShots) break;
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
        setSlots((list) => (list.length >= maxShots ? list : [...list, { key: `u-${file.name}-${Date.now()}`, upload: { dataUrl, name: file.name } }]));
      } catch {
        setError(`We couldn't read ${file.name}.`);
      }
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slots.length) return;
    setSlots((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const start = async () => {
    if (!token || !style || !canRun) return;
    setStarting(true);
    setError("");
    try {
      // Uploads are stored first, so the request carries links rather than megabytes of image data.
      const shots: ReelShotInput[] = [];
      for (const slot of slots) {
        if (slot.upload) {
          const { url } = await brandApi.uploadBase64(token, slot.upload.dataUrl, slot.upload.name);
          shots.push({ customImageUrl: url, label: slotLabel(slot) });
        } else if (slot.product) {
          shots.push({ garmentId: slot.product.id, label: slot.product.title, caption: formatRupee(slot.product.price) });
        }
      }
      const { reel, remainingCredits } = await brandApi.createReel(token, { title: title.trim() || undefined, styleId: style.id, shots });
      setCredits(remainingCredits);
      setReels((prev) => [reel, ...(prev ?? [])]);
      setOpenId(reel.id);
      setSlots([]);
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

  return (
    <div className="space-y-6">
      <BrandPageHeader
        eyebrow="AI Studio"
        title="Promo reel"
        blurb={`${minShots}–${maxShots} outfits, your name on the front and back, one film to post.`}
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
            ? "Reels need video stitching, which isn't switched on for this server yet. You can line up a reel now; nothing is charged until it can run."
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

      {/* ── The storyboard: what the reel will actually run ── */}
      <section className="space-y-3 rounded-(--radius-panel) bg-white/[0.02] p-5 ring-1 ring-white/[0.06] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Label>Your reel</Label>
          <span className="text-[11px] tabular-nums text-muted">
            {slots.length}/{maxShots} outfits
            {slots.length > 0 && style ? ` · about ${runtime}s` : ""}
          </span>
        </div>

        <div className="no-scrollbar flex items-stretch gap-2.5 overflow-x-auto pb-1">
          <Card label={brand.name} sub="Opening" />
          {slots.map((slot, i) => (
            <figure key={slot.key} className="group relative w-[112px] shrink-0">
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black/50 ring-1 ring-white/12">
                {slotImage(slot) ? <Photo src={slotImage(slot)} alt="" /> : <span className="absolute inset-0 grid place-items-center"><Shirt className="size-6 text-white/20" /></span>}
                <span className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-medium text-white tabular-nums">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => setSlots((l) => l.filter((s) => s.key !== slot.key))}
                  aria-label={`Remove outfit ${i + 1}`}
                  className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-500/80 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X className="size-3" aria-hidden />
                </button>
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1.5 pt-5">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier" className="text-white/70 hover:text-white disabled:opacity-25">
                    <GripVertical className="size-3.5 rotate-90" aria-hidden />
                  </button>
                  <span className="min-w-0 truncate text-[9px] text-white/80">{slotLabel(slot) || "Outfit"}</span>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === slots.length - 1} aria-label="Move later" className="text-white/70 hover:text-white disabled:opacity-25">
                    <GripVertical className="size-3.5 -rotate-90" aria-hidden />
                  </button>
                </span>
              </div>
            </figure>
          ))}
          {slots.length < maxShots && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-[112px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 transition-colors hover:border-accent-bright hover:bg-accent/5"
              style={{ aspectRatio: "9 / 16" }}
            >
              <Plus className="size-5 text-accent-bright" aria-hidden />
              <span className="text-[10px] text-white/80">Add outfit</span>
            </button>
          )}
          <Card label="Shop now" sub="Closing" />
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onUpload} className="hidden" />

        {!enough && <p className="text-[11px] text-muted">Add at least {minShots} outfits to make a reel.</p>}

        {products.length > 0 && (
          <div className="space-y-2.5 border-t border-white/8 pt-4">
            <p className="text-[11px] text-muted">or add from your catalog</p>
            <GarmentSearch picker={picker} />
            <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
              {picker.list.map((p) => {
                const added = slots.some((s) => s.product?.id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={added || slots.length >= maxShots}
                    onClick={() => addProduct(p)}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pr-3 text-left transition-colors disabled:opacity-40",
                      added ? "border-accent bg-accent/15" : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                    )}
                  >
                    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
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
          </div>
        )}
      </section>

      {/* ── Style ── */}
      <section className="space-y-3">
        <Label>Style</Label>
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
                    <span className="flex h-16 items-center justify-center" style={{ background: `#${s.cardColor.replace(/^0x/, "")}` }}>
                      <Clapperboard className="size-5 text-white/70" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className={cn("block px-3 py-2.5", on ? "bg-accent/20" : "bg-white/[0.03]")}>
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
      </section>

      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder={style ? `${brand.name} — ${style.name}` : "Reel name"}
          aria-label="Reel name"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20"
        />
        <ActionButton onClick={start} loading={starting} disabled={!canRun} className="h-12 w-full">
          {!starting && <Sparkles className="size-4" aria-hidden />}
          {starting ? "Starting your reel…" : `Make the reel · ${cost} credits`}
        </ActionButton>
        <p className="text-center text-[11px] text-muted">
          {busyReel
            ? "A reel is already being made. Start another once it finishes."
            : `Every outfit renders, then they're stitched with your cards. 5-15 minutes, and it keeps going if you leave. If it fails, the ${cost} credits come back.`}
        </p>
      </div>

      <ReelGallery reels={all} loading={reels.status === "loading"} error={reels.status === "error" ? reels.error : ""} onRetry={reels.reload} openId={openId} onOpen={setOpenId} onDelete={remove} />

      {open?.status === "READY" && open.videoUrl && (
        <section className="space-y-3 rounded-(--radius-panel) bg-white/[0.02] p-5 ring-1 ring-white/[0.06]">
          <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl bg-black ring-1 ring-white/12">
            <video key={open.id} src={assetUrl(open.videoUrl)} controls autoPlay loop playsInline className="aspect-[9/16] w-full object-cover" />
          </div>
          <div className="mx-auto flex w-full max-w-[300px] gap-2">
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
        </section>
      )}
    </div>
  );
}

/** The brand cards that top and tail every reel, shown so the storyboard reads end to end. */
function Card({ label, sub }: { label: string; sub: string }) {
  return (
    <figure className="w-[92px] shrink-0">
      <div className="relative flex aspect-[9/16] flex-col items-center justify-center gap-1 overflow-hidden rounded-xl bg-[#0b0b1e] px-2 text-center ring-1 ring-white/10">
        <span className="truncate text-[10px] font-medium text-white/90">{label}</span>
        <span className="text-[8px] uppercase tracking-[0.12em] text-muted">{sub}</span>
      </div>
    </figure>
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
                    <span className="absolute inset-0 grid place-items-center"><Shirt className="size-6 text-white/20" /></span>
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
