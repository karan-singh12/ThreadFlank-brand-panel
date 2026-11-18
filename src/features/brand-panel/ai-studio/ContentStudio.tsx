"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  BookmarkPlus,
  Camera,
  Check,
  CheckCheck,
  Copy,
  FileText,
  Heart,
  Mail,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
  Shirt,
  Sparkles,
  Tag,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import { ActionButton, Label, Notice, Segmented } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn, formatRupee } from "@/lib/utils";
import { brandApi } from "../api";
import { BrandAvatar } from "../BrandAvatar";
import { useReadyPanel } from "../BrandPanelProvider";
import { GarmentSearch, useGarmentPicker } from "../useGarmentPicker";
import type { ContentLanguage, ContentLength, ContentRequest, ContentResult, ContentTone, ContentType, ProductItem } from "../types";
import { errorMessage } from "../useResource";

/** Credits one generation costs (fixed by the backend). */
const COST = 2;
const MAX_KEYWORDS = 8;
const MAX_NOTE = 240;

type PreviewKind = "instagram" | "whatsapp" | "email" | "google" | "product" | "title" | "launch";

type Channel = {
  id: ContentType;
  label: string;
  where: string;
  icon: LucideIcon;
  /** Gradient for the card's icon tile, in the channel's own colours. */
  tint: string;
  limit: number;
  /** Set by the channel, not the brand: an SEO line is never "long". */
  length: ContentLength;
  preview: PreviewKind;
  /** Copy that describes one piece is useless without one. */
  needsGarment?: boolean;
};

/** Where the copy is going. The form and the preview both follow from this. */
const CHANNELS: readonly Channel[] = [
  { id: "instagram_caption", label: "Instagram", where: "Post caption", icon: Camera, tint: "from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]", limit: 1200, length: "medium", preview: "instagram" },
  { id: "product_description", label: "Product page", where: "Full description", icon: FileText, tint: "from-[#1fc5db] to-[#1f8fff]", limit: 900, length: "medium", preview: "product", needsGarment: true },
  { id: "product_title", label: "Product title", where: "Short, searchable", icon: Type, tint: "from-[#8d90a5] to-[#4b4b5f]", limit: 120, length: "short", preview: "title", needsGarment: true },
  { id: "whatsapp_broadcast", label: "WhatsApp", where: "Broadcast message", icon: MessageCircle, tint: "from-[#25d366] to-[#0b7a5a]", limit: 600, length: "short", preview: "whatsapp" },
  { id: "email_blurb", label: "Email", where: "Subject and body", icon: Mail, tint: "from-[#7f62f6] to-[#3f20be]", limit: 800, length: "medium", preview: "email" },
  { id: "seo_meta", label: "Google", where: "Search result", icon: Search, tint: "from-[#4285f4] via-[#ea4335] to-[#fbbc05]", limit: 230, length: "short", preview: "google", needsGarment: true },
  { id: "launch_announcement", label: "Launch", where: "Drop announcement", icon: Megaphone, tint: "from-[#7f62f6] to-[#d61fff]", limit: 1000, length: "medium", preview: "launch" },
];

const TONES: readonly { id: ContentTone; label: string }[] = [
  { id: "luxe", label: "Luxe" },
  { id: "playful", label: "Playful" },
  { id: "minimal", label: "Minimal" },
  { id: "festive", label: "Festive" },
  { id: "bold", label: "Bold" },
];

const LANGUAGES: readonly { id: ContentLanguage; label: string }[] = [
  { id: "english", label: "English" },
  { id: "hindi", label: "हिन्दी" },
  { id: "hinglish", label: "Hinglish" },
];

// ─── Splitting the two-part outputs ──────────────────────────────────────────

/** SEO comes back as "Title: …" / "Description: …"; fall back to the first line and the rest. */
function seoParts(text: string) {
  const title = /^\s*Title:\s*(.*)$/im.exec(text)?.[1]?.trim();
  const description = /^\s*Description:\s*(.*)$/im.exec(text)?.[1]?.trim();
  if (title !== undefined || description !== undefined) return { title: title ?? "", description: description ?? "" };
  const [first = "", ...rest] = text.split("\n").filter((l) => l.trim());
  return { title: first.trim(), description: rest.join(" ").trim() };
}
const composeSeo = (title: string, description: string) => `Title: ${title}\nDescription: ${description}`;

/** Email comes back as "Subject: …" then the body; fall back to the first line as the subject. */
function emailParts(text: string) {
  const m = /^\s*Subject:\s*(.*)$/im.exec(text);
  if (m) return { subject: m[1].trim(), body: text.slice(m.index + m[0].length).trim() };
  const [first = "", ...rest] = text.split("\n");
  return { subject: first.trim(), body: rest.join("\n").trim() };
}
const composeEmail = (subject: string, body: string) => `Subject: ${subject}\n\n${body}`;

const handleOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourbrand";

function domainOf(brandName: string, websiteUrl?: string) {
  if (websiteUrl) {
    try {
      return new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`).hostname.replace(/^www\./, "");
    } catch {
      /* fall through to the handle */
    }
  }
  return `${handleOf(brandName)}.com`;
}

// ─── Pieces the previews are built from ──────────────────────────────────────

/** A borderless field that grows with its text, so edits happen inside the mockup. */
function AutoText({
  value,
  onChange,
  ariaLabel,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full resize-none overflow-hidden rounded-md bg-transparent outline-none transition placeholder:text-current/40",
        "focus:bg-white/[0.07] focus:ring-1 focus:ring-white/25",
        className
      )}
    />
  );
}

function GarmentShot({ src, className }: { src?: string; className?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-white/[0.05]", className)}>
      {src ? (
        <Photo src={src} alt="" />
      ) : (
        <span className="absolute inset-0 grid place-items-center">
          <Shirt className="size-10 text-white/15" strokeWidth={1.25} aria-hidden />
        </span>
      )}
    </div>
  );
}

type PreviewProps = {
  text: string;
  onChange: (v: string) => void;
  brandName: string;
  logo?: string;
  websiteUrl?: string;
  garment?: ProductItem;
  image?: string;
};

const SHELL = "mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl ring-1 ring-white/12 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]";

function InstagramPreview({ text, onChange, brandName, logo, image }: PreviewProps) {
  return (
    <div className={cn(SHELL, "bg-black")}>
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span className="rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
          <BrandAvatar name={brandName} src={logo} className="size-7 text-[11px] ring-2 ring-black" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{handleOf(brandName)}</span>
        <MoreHorizontal className="size-4 shrink-0 text-white/70" aria-hidden />
      </div>
      <GarmentShot src={image} className="aspect-square" />
      <div className="flex items-center gap-4 px-3 pt-2.5 text-white">
        <Heart className="size-[22px]" strokeWidth={1.6} aria-hidden />
        <MessageCircle className="size-[22px] -scale-x-100" strokeWidth={1.6} aria-hidden />
        <Send className="size-[22px]" strokeWidth={1.6} aria-hidden />
      </div>
      <p className="px-3 pt-2 text-[13px] font-semibold text-white">1,284 likes</p>
      <div className="px-2.5 pb-4 pt-1">
        <AutoText value={text} onChange={onChange} ariaLabel="Instagram caption" className="px-0.5 text-[13px] leading-[1.45] text-white" />
      </div>
    </div>
  );
}

function WhatsAppPreview({ text, onChange, brandName, logo }: PreviewProps) {
  return (
    <div className={cn(SHELL, "bg-[#0b141a]")}>
      <div className="flex items-center gap-2.5 bg-[#1f2c33] px-3 py-2.5">
        <BrandAvatar name={brandName} src={logo} className="size-8 text-xs" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white">{brandName}</span>
        <span className="shrink-0 rounded-full bg-[#25d366]/15 px-2 py-0.5 text-[10px] font-medium text-[#25d366]">Broadcast</span>
      </div>
      <div className="min-h-[180px] bg-[#0b141a] p-3">
        <div className="ml-auto max-w-[88%] rounded-xl rounded-tr-sm bg-[#005c4b] px-2 py-1.5">
          <AutoText value={text} onChange={onChange} ariaLabel="WhatsApp message" className="px-0.5 text-[13px] leading-[1.45] text-white" />
          <p className="mt-0.5 flex items-center justify-end gap-1 pr-0.5 text-[10px] text-white/55">
            10:05
            <CheckCheck className="size-3.5 text-[#53bdeb]" aria-hidden />
          </p>
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ text, onChange, brandName, logo, websiteUrl }: PreviewProps) {
  const { subject, body } = emailParts(text);
  return (
    <div className={cn(SHELL, "bg-[#0f1021]")}>
      <div className="space-y-3 border-b border-white/8 px-4 py-3.5">
        <AutoText
          value={subject}
          onChange={(v) => onChange(composeEmail(v.replace(/\n/g, " "), body))}
          ariaLabel="Email subject line"
          placeholder="Subject line"
          className="text-[15px] font-semibold leading-snug text-white"
        />
        <div className="flex items-center gap-2.5">
          <BrandAvatar name={brandName} src={logo} className="size-8 text-xs" />
          <span className="min-w-0 text-[12px] leading-tight">
            <span className="block truncate text-white">
              {brandName} <span className="text-muted">&lt;hello@{domainOf(brandName, websiteUrl)}&gt;</span>
            </span>
            <span className="block text-muted">to me</span>
          </span>
        </div>
      </div>
      <div className="px-3.5 py-4">
        <AutoText
          value={body}
          onChange={(v) => onChange(composeEmail(subject, v))}
          ariaLabel="Email body"
          placeholder="Email body"
          className="px-0.5 text-[13px] leading-relaxed text-white/85"
        />
      </div>
    </div>
  );
}

function GooglePreview({ text, onChange, brandName, logo, websiteUrl, garment }: PreviewProps) {
  const { title, description } = seoParts(text);
  const domain = domainOf(brandName, websiteUrl);
  return (
    <div className={cn(SHELL, "bg-[#202124] p-4")}>
      <div className="mb-2.5 flex items-center gap-2.5">
        <BrandAvatar name={brandName} src={logo} className="size-6 text-[10px]" />
        <span className="min-w-0 text-[12px] leading-tight">
          <span className="block truncate text-[#e8eaed]">{brandName}</span>
          <span className="block truncate text-[#9aa0a6]">
            {domain}
            {garment?.category ? ` › ${garment.category.toLowerCase()}` : ""}
          </span>
        </span>
      </div>
      <AutoText
        value={title}
        onChange={(v) => onChange(composeSeo(v.replace(/\n/g, " "), description))}
        ariaLabel="SEO title"
        placeholder="Page title"
        className="text-[18px] leading-snug text-[#8ab4f8]"
      />
      <AutoText
        value={description}
        onChange={(v) => onChange(composeSeo(title, v.replace(/\n/g, " ")))}
        ariaLabel="SEO meta description"
        placeholder="Meta description"
        className="mt-1 text-[13px] leading-[1.45] text-[#bdc1c6]"
      />
      <p className="mt-2.5 flex gap-3 border-t border-white/10 pt-2 text-[11px] tabular-nums">
        <span className={title.length > 60 ? "text-red-300" : "text-[#9aa0a6]"}>Title {title.length}/60</span>
        <span className={description.length > 155 ? "text-red-300" : "text-[#9aa0a6]"}>Description {description.length}/155</span>
      </p>
    </div>
  );
}

function ProductPreview({ text, onChange, brandName, garment, image, kind }: PreviewProps & { kind: "product" | "title" }) {
  const isTitle = kind === "title";
  return (
    <div className={cn(SHELL, "bg-[#0b0b1e]")}>
      <GarmentShot src={image} className="aspect-[4/3]" />
      <div className="space-y-2 p-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-cyan">{brandName}</p>
        {isTitle ? (
          <AutoText value={text} onChange={onChange} ariaLabel="Product title" placeholder="Product title" className="text-[18px] font-medium leading-snug text-white" />
        ) : (
          <p className="text-[18px] font-medium leading-snug text-white">{garment?.title ?? "Your product"}</p>
        )}
        {garment && <p className="text-[15px] text-white/90">{formatRupee(garment.price)}</p>}
        <div className="h-px bg-white/10" />
        {isTitle ? (
          <p className="text-[13px] leading-relaxed text-muted">{garment?.description?.trim() || "Your product description sits here."}</p>
        ) : (
          <AutoText value={text} onChange={onChange} ariaLabel="Product description" className="px-0.5 text-[13px] leading-relaxed text-white/85" />
        )}
        <div aria-hidden className="btn-primary mt-1 flex h-10 items-center justify-center rounded-full text-sm font-medium">
          Try it on
        </div>
      </div>
    </div>
  );
}

function LaunchPreview({ text, onChange, brandName, logo, image }: PreviewProps) {
  return (
    <div className={cn(SHELL, "card-violet")}>
      <GarmentShot src={image} className="aspect-[16/9]" />
      <div className="space-y-2.5 p-4">
        <div className="flex items-center gap-2.5">
          <BrandAvatar name={brandName} src={logo} className="size-7 text-[11px]" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white">{brandName}</span>
          <span className="chip-on shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest">Friday, 7 PM</span>
        </div>
        <AutoText value={text} onChange={onChange} ariaLabel="Launch announcement" className="px-0.5 text-[13px] leading-relaxed text-white" />
        <div aria-hidden className="btn-light flex h-10 items-center justify-center rounded-full text-sm font-medium">
          Join the waitlist
        </div>
      </div>
    </div>
  );
}

function ChannelPreview({ kind, ...props }: PreviewProps & { kind: PreviewKind }) {
  if (kind === "instagram") return <InstagramPreview {...props} />;
  if (kind === "whatsapp") return <WhatsAppPreview {...props} />;
  if (kind === "email") return <EmailPreview {...props} />;
  if (kind === "google") return <GooglePreview {...props} />;
  if (kind === "launch") return <LaunchPreview {...props} />;
  return <ProductPreview {...props} kind={kind} />;
}

// ─── The studio ──────────────────────────────────────────────────────────────

export function ContentStudio() {
  const { token } = useAuth();
  const { brand, setCredits } = useReadyPanel();
  const picker = useGarmentPicker();

  const [type, setType] = useState<ContentType>("instagram_caption");
  const [garmentId, setGarmentId] = useState<string | null>(null);
  const [tone, setTone] = useState<ContentTone>("luxe");
  const [language, setLanguage] = useState<ContentLanguage>("english");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [note, setNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ContentResult | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [option, setOption] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const channel = CHANNELS.find((c) => c.id === type)!;
  const garment = picker.selected && picker.selected.id === garmentId ? picker.selected : undefined;
  const image = garment?.images?.[0];
  const canAfford = brand.aiCredits >= COST;
  const needsPiece = Boolean(channel.needsGarment && !garment);
  const canRun = canAfford && !needsPiece && !busy;

  const resultChannel = useMemo(() => (result ? (CHANNELS.find((c) => c.id === result.contentType) ?? channel) : channel), [result, channel]);
  // The preview shows the piece the copy was actually written about, not whatever is selected now.
  const resultGarment = result?.garmentId && garment?.id === result.garmentId ? garment : undefined;
  const variants = result?.variants ?? [];
  const current = variants[Math.min(option, Math.max(0, variants.length - 1))];
  const text = current ? (drafts[current.id] ?? current.text) : "";

  const addKeyword = (raw: string) => {
    const word = raw.trim().replace(/\s+/g, " ").slice(0, 30);
    if (!word || keywords.some((k) => k.toLowerCase() === word.toLowerCase()) || keywords.length >= MAX_KEYWORDS) return;
    setKeywords((k) => [...k, word]);
  };
  const onKeywordKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(keywordDraft);
      setKeywordDraft("");
    } else if (e.key === "Backspace" && !keywordDraft && keywords.length) {
      setKeywords((k) => k.slice(0, -1));
    }
  };

  const pickChannel = (next: Channel) => {
    setType(next.id);
    // A piece-specific channel with nothing picked yet: start on the first garment in view.
    if (next.needsGarment && !garment && picker.list[0]) {
      setGarmentId(picker.list[0].id);
      picker.pick(picker.list[0]);
    }
  };

  const generate = async () => {
    if (!token || !canRun) return;
    setBusy(true);
    setError("");
    const body: ContentRequest = {
      contentType: type,
      garmentId: garment?.id,
      tone,
      language,
      length: channel.length,
      keywords: type === "seo_meta" ? (keywordDraft.trim() ? [...keywords, keywordDraft.trim().slice(0, 30)].slice(0, MAX_KEYWORDS) : keywords) : [],
      notes: note.trim() || undefined,
      variants: 3,
    };
    try {
      const res = await brandApi.generateContent(token, body);
      setResult(res);
      setSaved({});
      setOption(0);
      setDrafts(Object.fromEntries(res.variants.map((v) => [v.id, v.text])));
      if (typeof res.remainingCredits === "number") setCredits(res.remainingCredits);
    } catch (e) {
      // Nothing was charged on a failure, so the previous result stays on screen.
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Your browser blocked copying. Select the text and copy it by hand.");
    }
  };

  const save = async () => {
    if (!token || !result || !current) return;
    try {
      await brandApi.saveContent(token, { contentType: result.contentType, text, garmentId: result.garmentId });
      setSaved((s) => ({ ...s, [current.id]: true }));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* ── Brief ───────────────────────────────────────────── */}
      <div className="space-y-6 rounded-(--radius-panel) bg-white/[0.02] p-5 ring-1 ring-white/[0.06] sm:p-6 lg:col-span-6 xl:col-span-5">
        <section className="space-y-3">
          <Label>Where is this going?</Label>
          <div role="radiogroup" aria-label="Where the copy is going" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            {CHANNELS.map((c) => {
              const on = c.id === type;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pickChannel(c)}
                  className={cn(
                    "group flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all",
                    on ? "border-accent bg-accent/15 ring-1 ring-accent" : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  )}
                >
                  <span className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white transition-transform group-hover:scale-105", c.tint, !on && "opacity-80 saturate-[0.85]")}>
                    <c.icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-white">{c.label}</span>
                    <span className="block text-[10px] leading-tight text-muted">{c.where}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label>Which piece?</Label>
            <span className="text-[11px] text-muted">{channel.needsGarment ? "Required for this one" : "Optional — leave it on your brand"}</span>
          </div>
          <GarmentSearch picker={picker} />
          <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
            {!channel.needsGarment && (
              <button
                type="button"
                aria-pressed={!garment}
                onClick={() => setGarmentId(null)}
                className={cn(
                  "flex h-[52px] shrink-0 items-center rounded-xl border px-3.5 text-xs font-medium transition-colors",
                  !garment ? "border-accent bg-accent/20 text-white ring-1 ring-accent" : "border-white/[0.07] bg-white/[0.02] text-muted hover:border-white/20 hover:text-white"
                )}
              >
                Whole brand
              </button>
            )}
            {picker.list.map((p) => {
              const on = garment?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setGarmentId(p.id);
                    picker.pick(p);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pr-3 text-left transition-colors",
                    on ? "border-accent bg-accent/20 ring-1 ring-accent" : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
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
          <p className="text-[11px] text-muted">
            {garment ? `Written from this piece's real details only: ${[garment.category, formatRupee(garment.price), ...(garment.occasions ?? []).slice(0, 2)].filter(Boolean).join(" · ")}` : `Written about ${brand.name} only — no invented details.`}
          </p>
        </section>

        <section className="space-y-3">
          <Label>Voice</Label>
          <Segmented label="Tone" value={tone} onChange={setTone} options={TONES} />
          <Segmented label="Language" value={language} onChange={setLanguage} options={LANGUAGES} />
        </section>

        {type === "seo_meta" && (
          <section className="space-y-2.5">
            <Label htmlFor="content-keywords">What do shoppers search for?</Label>
            <div className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 transition hover:border-white/20 focus-within:border-accent-bright/70 focus-within:ring-4 focus-within:ring-accent/20">
              {keywords.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-full bg-accent/25 py-1 pl-2.5 pr-1.5 text-xs text-white">
                  <Tag className="size-3 text-accent-bright" aria-hidden />
                  {k}
                  <button type="button" aria-label={`Remove ${k}`} onClick={() => setKeywords((l) => l.filter((x) => x !== k))} className="rounded-full p-0.5 text-white/60 hover:text-white">
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
              <input
                id="content-keywords"
                value={keywordDraft}
                onChange={(e) => setKeywordDraft(e.target.value.replace(",", ""))}
                onKeyDown={onKeywordKey}
                onBlur={() => {
                  addKeyword(keywordDraft);
                  setKeywordDraft("");
                }}
                disabled={keywords.length >= MAX_KEYWORDS}
                maxLength={30}
                placeholder={keywords.length ? "" : "banarasi silk saree, wedding guest"}
                className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-muted/70"
              />
            </div>
            <p className="text-[11px] text-muted">
              Press Enter after each. {keywords.length}/{MAX_KEYWORDS}
            </p>
          </section>
        )}

        <section className="space-y-2">
          <Label htmlFor="content-note">Add anything? (optional)</Label>
          <textarea
            id="content-note"
            rows={2}
            maxLength={MAX_NOTE}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Handwoven in Varanasi. Don't mention a discount."
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20"
          />
          <p className="text-right text-[11px] tabular-nums text-muted">
            {note.length}/{MAX_NOTE}
          </p>
        </section>

        {!canAfford && (
          <Notice tone="info">
            You need at least {COST} AI credits to write copy.{" "}
            <Link href="/billing" className="font-medium text-white underline">
              Buy credits
            </Link>
          </Notice>
        )}

        <div className="space-y-2">
          <ActionButton onClick={generate} loading={busy} disabled={!canRun} className="h-12 w-full">
            {!busy && <Sparkles className="size-4" aria-hidden />}
            {busy ? "Writing…" : result ? `Write 3 new options · ${COST} credits` : `Write 3 options · ${COST} credits`}
          </ActionButton>
          <p className="text-center text-[11px] text-muted">
            {needsPiece ? `Pick a piece first — a ${channel.label.toLowerCase()} ${channel.where.toLowerCase()} needs one.` : `${brand.aiCredits} credits available · nothing charged if writing fails`}
          </p>
        </div>
      </div>

      {/* ── Live preview ────────────────────────────────────── */}
      <div className="space-y-4 lg:col-span-6 lg:sticky lg:top-24 xl:col-span-7">
        {error && <Notice tone="error">{error}</Notice>}

        {busy ? (
          <div className="space-y-3" aria-busy role="status">
            <p className="text-sm text-muted">Writing three different angles…</p>
            <Skeleton className="mx-auto h-[460px] w-full max-w-[400px] rounded-2xl" />
          </div>
        ) : result && current ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Options" className="glass-pill inline-flex rounded-full p-1">
                {variants.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    role="tab"
                    aria-selected={i === option}
                    onClick={() => setOption(i)}
                    className={cn("h-8 rounded-full px-4 text-xs transition-colors", i === option ? "chip-on font-medium" : "text-subtle hover:text-white")}
                  >
                    Option {i + 1}
                  </button>
                ))}
              </div>
              <ActionButton variant="ghost" onClick={generate} disabled={!canRun} className="h-9 px-4 text-xs">
                <RefreshCw className="size-3.5" aria-hidden />
                Try again
              </ActionButton>
            </div>

            <ChannelPreview
              kind={resultChannel.preview}
              text={text}
              onChange={(v) => setDrafts((d) => ({ ...d, [current.id]: v }))}
              brandName={brand.name}
              logo={brand.logo}
              websiteUrl={brand.websiteUrl}
              garment={resultGarment}
              image={resultGarment?.images?.[0]}
            />

            <div className="mx-auto flex w-full max-w-[400px] items-center gap-2">
              <ActionButton onClick={copy} className="h-10 flex-1">
                {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </ActionButton>
              <ActionButton variant="ghost" onClick={save} disabled={saved[current.id]} className="h-10 px-4">
                {saved[current.id] ? <Check className="size-4 text-green" aria-hidden /> : <BookmarkPlus className="size-4" aria-hidden />}
                {saved[current.id] ? "Saved" : "Save"}
              </ActionButton>
            </div>

            {resultChannel.preview !== "google" && (
              <p className={cn("mx-auto w-full max-w-[400px] text-right text-[11px] tabular-nums", text.length > resultChannel.limit ? "text-red-300" : "text-muted")}>
                {text.length}/{resultChannel.limit} characters
              </p>
            )}
            <p className="mx-auto w-full max-w-[400px] text-[11px] leading-relaxed text-muted">
              Tap any line in the preview to edit it. AI can make mistakes — check names, prices and claims before you publish.
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <div className="pointer-events-none select-none opacity-40 blur-[1px]">
              <ChannelPreview
                kind={channel.preview}
                text=""
                onChange={() => undefined}
                brandName={brand.name}
                logo={brand.logo}
                websiteUrl={brand.websiteUrl}
                garment={garment}
                image={image}
              />
            </div>
            <div className="mx-auto max-w-[400px] text-center">
              <p className="text-sm font-medium text-white">
                Your {channel.label} {channel.where.toLowerCase()}, as it will look
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                We write three options straight into this preview. Edit any line in place, then copy it across.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
