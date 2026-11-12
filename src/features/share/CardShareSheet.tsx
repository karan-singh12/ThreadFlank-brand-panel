"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, Check, Copy, Download, LoaderCircle, MessageCircle, Share2 } from "lucide-react";
import { ActionButton, Notice } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { SendToChat } from "./SendToChat";

export type ShareChannel = "whatsapp" | "instagram" | "link";
/** Card formats the sheet offers (the link-preview `og` format is only used by the share pages). */
type CardFormat = "whatsapp" | "story";
/** A share link and its branded card. `card(format)` is the card image URL for that format. */
export type PreparedShare = { url: string; card: (format: CardFormat) => string };

const FORMATS: { id: CardFormat; label: string; ratio: string }[] = [
  { id: "whatsapp", label: "Post · 4:5", ratio: "aspect-[4/5]" },
  { id: "story", label: "Story · 9:16", ratio: "aspect-[9/16]" },
];

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "look";

async function cardFile(cardUrl: string, name: string) {
  const res = await fetch(cardUrl);
  if (!res.ok) throw new Error("Couldn't render the card. Try again.");
  const blob = await res.blob();
  return new File([blob], `threadflank-${slug(name)}.png`, { type: "image/png" });
}

function download(file: File) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** The OS share sheet with the card attached, when this browser can share files (mostly phones). */
const canShareFiles = (file: File) => typeof navigator !== "undefined" && Boolean(navigator.canShare?.({ files: [file] }));

/**
 * Branded share cards (feature #22): a live preview of the designed card, and sharing that
 * card itself rather than a screenshot. On phones WhatsApp and Instagram get the card image
 * with the deep link; on desktop WhatsApp gets the link, which unfurls into the same card.
 * `prepare(channel)` creates (or reuses) the share link for a channel.
 */
export function CardShareSheet({
  open,
  onClose,
  title,
  name,
  image,
  video,
  shareText,
  prepare,
  note,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** What's being shared, for the caption and file names. */
  name: string;
  /** Plain image sent with in-app chat messages. */
  image: string;
  video?: string | null;
  /** Message that goes with the link, e.g. "Ivory kurta — what do you think?". */
  shareText: string;
  prepare: (channel: ShareChannel) => Promise<PreparedShare>;
  note?: ReactNode;
}) {
  const [format, setFormat] = useState<CardFormat>("whatsapp");
  const [preview, setPreview] = useState<PreparedShare | null>(null);
  const [loadedCard, setLoadedCard] = useState<string | null>(null);
  const [busy, setBusy] = useState<ShareChannel | "download" | "more" | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // One share link per channel for the life of the sheet, so retries and double taps reuse it.
  const prepared = useRef(new Map<ShareChannel, Promise<PreparedShare>>());
  const prepareOnce = (channel: ShareChannel) => {
    let pending = prepared.current.get(channel);
    if (!pending) {
      pending = prepare(channel);
      prepared.current.set(channel, pending);
      pending.catch(() => prepared.current.delete(channel));
    }
    return pending;
  };

  useEffect(() => {
    if (!open || preview) return;
    let cancelled = false;
    prepareOnce("link")
      .then((p) => !cancelled && setPreview(p))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
    // prepareOnce caches by channel, so it's safe to leave out of the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preview]);

  const run = async (kind: ShareChannel | "download" | "more", fn: () => Promise<void>) => {
    setBusy(kind);
    setError("");
    try {
      await fn();
    } catch (e) {
      // Closing the OS share sheet without picking an app isn't an error.
      if (!(e instanceof DOMException && e.name === "AbortError")) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const whatsapp = () =>
    run("whatsapp", async () => {
      const share = await prepareOnce("whatsapp");
      const text = `${shareText} ${share.url}`;
      const file = await cardFile(share.card("whatsapp"), name).catch(() => null);
      if (file && canShareFiles(file)) {
        await navigator.share({ files: [file], text });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      }
    });

  // Instagram has no web share URL: hand the story-sized card to the OS share sheet, or download it.
  const instagram = () =>
    run("instagram", async () => {
      const share = await prepareOnce("instagram");
      const file = await cardFile(share.card("story"), name);
      if (canShareFiles(file)) await navigator.share({ files: [file], title: name, text: share.url });
      else download(file);
    });

  const downloadCard = () =>
    run("download", async () => {
      const share = await prepareOnce("link");
      download(await cardFile(share.card(format), name));
    });

  const copyLink = () =>
    run("link", async () => {
      const share = await prepareOnce("link");
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });

  const more = () =>
    run("more", async () => {
      const share = await prepareOnce("link");
      await navigator.share({ title: name, text: shareText, url: share.url });
    });

  const cardSrc = preview?.card(format) ?? null;
  const ratio = FORMATS.find((f) => f.id === format)!.ratio;
  const nativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Modal open={open} onClose={onClose} title={title} className="sm:max-w-[640px]">
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          {/* The card exactly as it will be shared */}
          <div className="flex flex-col gap-2">
            <div className={cn("relative mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]", ratio)}>
              {cardSrc && (
                // eslint-disable-next-line @next/next/no-img-element -- server-rendered card, not an optimisable asset
                <img
                  key={cardSrc}
                  src={cardSrc}
                  alt={`Share card for ${name}`}
                  onLoad={() => setLoadedCard(cardSrc)}
                  onError={() => setLoadedCard(cardSrc)}
                  className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300", loadedCard === cardSrc ? "opacity-100" : "opacity-0")}
                />
              )}
              {loadedCard !== cardSrc && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted">
                  <LoaderCircle className="size-5 animate-spin text-accent-bright" />
                  {preview ? "Designing your card…" : "Preparing link…"}
                </div>
              )}
            </div>
            <div role="radiogroup" aria-label="Card format" className="mx-auto flex gap-1 rounded-full border border-white/10 p-0.5">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={format === f.id}
                  onClick={() => setFormat(f.id)}
                  className={cn("h-7 rounded-full px-3 text-[11px] transition-colors", format === f.id ? "chip-on" : "text-muted hover:text-white")}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div>
              <p className="truncate text-body font-medium text-white">{name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Shared as a branded card with a link back here, so anyone can open it and try it on their own twin.
              </p>
              {note && <div className="mt-1.5 text-xs text-muted">{note}</div>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ShareButton onClick={whatsapp} busy={busy === "whatsapp"} label="WhatsApp" className="bg-[#1faa53]/15 text-[#5ee08e] hover:bg-[#1faa53]/25">
                <MessageCircle className="size-5" />
              </ShareButton>
              <ShareButton onClick={instagram} busy={busy === "instagram"} label="Instagram Story" className="bg-[#c13584]/15 text-[#f58fd0] hover:bg-[#c13584]/25">
                <Camera className="size-5" />
              </ShareButton>
              <ShareButton onClick={downloadCard} busy={busy === "download"} label="Download card" className="bg-violet-300/10 text-violet-100 hover:bg-violet-300/15">
                <Download className="size-5" />
              </ShareButton>
              <ShareButton onClick={copyLink} busy={busy === "link"} label={copied ? "Copied" : "Copy link"} className="bg-white/8 text-white hover:bg-white/12">
                {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
              </ShareButton>
            </div>
            {nativeShare && (
              <button type="button" onClick={more} disabled={busy === "more"} className="inline-flex items-center gap-2 self-start text-sm text-accent-bright hover:text-white disabled:opacity-60">
                <Share2 className="size-4" />
                More apps…
              </button>
            )}
            {video && (
              <a href={assetUrl(video)} download="threadflank-look.mp4" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-accent-bright hover:text-white">
                <Download className="size-4" />
                Download the video for Reels / Stories
              </a>
            )}
          </div>
        </div>

        <SendToChat image={image} message={shareText} onError={setError} />

        {error && <Notice tone="error">{error}</Notice>}
        <ActionButton variant="ghost" onClick={onClose} className="self-end">
          Done
        </ActionButton>
      </div>
    </Modal>
  );
}

function ShareButton({ onClick, busy, label, className, children }: { onClick: () => void; busy: boolean; label: string; className: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} className={cn("flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl text-xs font-medium transition-colors disabled:opacity-60", className)}>
      {busy ? <LoaderCircle className="size-5 animate-spin" /> : children}
      {label}
    </button>
  );
}
