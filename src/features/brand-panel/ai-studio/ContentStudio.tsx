"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Copy, FileText, Mail, Megaphone, MessageSquareQuote, PenLine, RefreshCw, Search, Shirt, Sparkles, Tag, X, type LucideIcon } from "lucide-react";
import { ActionButton, Label, Notice, Segmented } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn, formatRupee } from "@/lib/utils";
import { brandApi } from "../api";
import { useReadyPanel } from "../BrandPanelProvider";
import type { ContentLanguage, ContentLength, ContentRequest, ContentResult, ContentTone, ContentType } from "../types";
import { errorMessage } from "../useResource";

/** Credits one generation costs (fixed by the backend). */
const COST = 2;
const MAX_KEYWORDS = 8;
const MAX_NOTES = 300;

type TypeMeta = { id: ContentType; label: string; blurb: string; limit: number; icon: LucideIcon };
const TYPES: readonly TypeMeta[] = [
  { id: "product_description", label: "Product description", blurb: "For your product page", limit: 900, icon: FileText },
  { id: "instagram_caption", label: "Instagram caption", blurb: "With hashtags", limit: 1200, icon: MessageSquareQuote },
  { id: "launch_announcement", label: "Launch announcement", blurb: "For a drop or collection", limit: 1000, icon: Megaphone },
  { id: "email_blurb", label: "Email blurb", blurb: "Subject line and body", limit: 800, icon: Mail },
  { id: "seo_meta", label: "SEO title and description", blurb: "For search results", limit: 230, icon: Search },
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
const LENGTHS: readonly { id: ContentLength; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
];

const fieldBase =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20";

/** SEO output is two lines with their own limits; everything else has one overall limit. */
function seoParts(text: string) {
  const title = /^\s*Title:\s*(.*)$/im.exec(text)?.[1]?.trim() ?? "";
  const description = /^\s*Description:\s*(.*)$/im.exec(text)?.[1]?.trim() ?? "";
  return { title, description };
}

export function ContentStudio() {
  const { token } = useAuth();
  const { brand, products, setCredits } = useReadyPanel();

  const [type, setType] = useState<ContentType>("product_description");
  const [garmentId, setGarmentId] = useState<string | null>(null);
  const [tone, setTone] = useState<ContentTone>("luxe");
  const [language, setLanguage] = useState<ContentLanguage>("english");
  const [length, setLength] = useState<ContentLength>("medium");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ContentResult | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const meta = TYPES.find((t) => t.id === type)!;
  const garment = products.find((p) => p.id === garmentId);
  const canAfford = brand.aiCredits >= COST;
  const canRun = canAfford && !busy;

  const facts = useMemo(() => {
    const list: string[] = [];
    if (garment) {
      list.push(garment.title, garment.category, formatRupee(garment.price), ...(garment.occasions ?? []));
    } else {
      list.push(brand.name);
    }
    return list.filter(Boolean);
  }, [garment, brand.name]);

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

  const generate = async () => {
    if (!token || !canRun) return;
    setBusy(true);
    setError("");
    const body: ContentRequest = {
      contentType: type,
      garmentId: garmentId ?? undefined,
      tone,
      language,
      length,
      keywords: keywordDraft.trim() ? [...keywords, keywordDraft.trim().slice(0, 30)].slice(0, MAX_KEYWORDS) : keywords,
      notes: notes.trim() || undefined,
      variants: 3,
    };
    try {
      const res = await brandApi.generateContent(token, body);
      setResult(res);
      setDrafts(Object.fromEntries(res.variants.map((v) => [v.id, v.text])));
      if (typeof res.remainingCredits === "number") setCredits(res.remainingCredits);
    } catch (e) {
      // Nothing was charged on a failure, so the previous results stay on screen.
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(drafts[id] ?? "");
      setCopied(id);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("Your browser blocked copying. Select the text and copy it by hand.");
    }
  };

  const resultMeta = result ? TYPES.find((t) => t.id === result.contentType)! : meta;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* ── Brief ───────────────────────────────────────────── */}
      <div className="space-y-6 rounded-(--radius-panel) bg-white/[0.02] p-5 ring-1 ring-white/[0.06] sm:p-6 lg:col-span-5">
        <section className="space-y-2.5">
          <Label>1. What are you writing?</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {TYPES.map((t) => {
              const active = t.id === type;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    active ? "border-accent bg-accent/20 ring-1 ring-accent" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                  )}
                >
                  <t.icon className={cn("mt-0.5 size-4 shrink-0", active ? "text-accent-bright" : "text-muted")} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-white">{t.label}</span>
                    <span className="block text-[11px] text-muted">{t.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2.5">
          <Label>2. About</Label>
          <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
            <button
              type="button"
              aria-pressed={!garmentId}
              onClick={() => setGarmentId(null)}
              className={cn(
                "shrink-0 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-colors",
                !garmentId ? "border-accent bg-accent/20 text-white ring-1 ring-accent" : "border-white/[0.06] bg-white/[0.02] text-muted hover:border-white/15 hover:text-white"
              )}
            >
              Whole brand
            </button>
            {products.map((p) => {
              const selected = garmentId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setGarmentId(p.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pr-3 text-left transition-colors",
                    selected ? "border-accent bg-accent/20 text-white ring-1 ring-accent" : "border-white/[0.06] bg-white/[0.02] text-muted hover:border-white/15 hover:text-white"
                  )}
                >
                  <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
                    {p.images?.[0] ? <Photo src={p.images[0]} alt={p.title} /> : <Shirt className="size-4 text-muted" aria-hidden />}
                  </span>
                  <span className="block max-w-[130px] truncate text-[11px] font-medium text-white">{p.title}</span>
                </button>
              );
            })}
          </div>
          <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
            We&apos;ll only write from:
            {facts.map((f) => (
              <span key={f} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-white/80">
                {f}
              </span>
            ))}
          </p>
        </section>

        <section className="space-y-3">
          <Label>3. Voice</Label>
          <Segmented label="Tone" value={tone} onChange={setTone} options={TONES} />
          <Segmented label="Language" value={language} onChange={setLanguage} options={LANGUAGES} />
          <Segmented label="Length" value={length} onChange={setLength} options={LENGTHS} />
        </section>

        <section className="space-y-2.5">
          <Label htmlFor="content-keywords">4. Keywords (optional)</Label>
          <div className={cn(fieldBase, "flex min-h-11 flex-wrap items-center gap-1.5 px-2.5 py-2")}>
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
              placeholder={keywords.length ? "" : "e.g. banarasi silk, wedding guest"}
              className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-muted/70"
            />
          </div>
          <p className="text-[11px] text-muted">
            Press Enter to add. {keywords.length}/{MAX_KEYWORDS}
          </p>
        </section>

        <section className="space-y-2">
          <Label htmlFor="content-notes">5. Anything else? (optional)</Label>
          <textarea
            id="content-notes"
            rows={3}
            maxLength={MAX_NOTES}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Mention it's handwoven in Varanasi. Avoid the word 'cheap'."
            className={cn(fieldBase, "resize-none px-3.5 py-3")}
          />
          <p className="text-right text-[11px] tabular-nums text-muted">
            {notes.length}/{MAX_NOTES}
          </p>
        </section>

        {!canAfford && <Notice tone="info">You need at least {COST} AI credits to write copy.</Notice>}
        <ActionButton onClick={generate} loading={busy} disabled={!canRun} className="w-full">
          {!busy && <Sparkles className="size-4" aria-hidden />}
          {busy ? "Writing…" : result ? `Write new options (${COST} credits)` : `Write copy (${COST} credits)`}
        </ActionButton>
        <p className="-mt-3 text-center text-[11px] text-muted">
          {brand.aiCredits} credits available · not charged if writing fails
        </p>
      </div>

      {/* ── Results ─────────────────────────────────────────── */}
      <div className="space-y-4 lg:col-span-7">
        {error && <Notice tone="error">{error}</Notice>}

        {busy ? (
          <div className="space-y-4" aria-busy role="status">
            <p className="text-sm text-muted">Writing three different angles…</p>
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : result ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                <span className="text-white">{resultMeta.label}</span> · {result.variants.length} options. Edit anything before you copy it.
              </p>
              <ActionButton variant="ghost" onClick={generate} disabled={!canRun}>
                <RefreshCw className="size-4" aria-hidden />
                Try again
              </ActionButton>
            </div>
            {result.variants.map((v, i) => {
              const text = drafts[v.id] ?? v.text;
              const seo = result.contentType === "seo_meta" ? seoParts(text) : null;
              const over = seo ? seo.title.length > 60 || seo.description.length > 155 : text.length > resultMeta.limit;
              return (
                <article key={v.id} className="card-violet rounded-(--radius-panel) p-4 sm:p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-accent-bright">
                      <PenLine className="size-3.5" aria-hidden /> Option {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(v.id)}
                      className="glass-pill flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-white/90 transition-[filter] hover:brightness-125"
                    >
                      {copied === v.id ? <Check className="size-3.5 text-green" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                      {copied === v.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <textarea
                    aria-label={`Option ${i + 1} text`}
                    value={text}
                    onChange={(e) => setDrafts((d) => ({ ...d, [v.id]: e.target.value }))}
                    rows={Math.min(14, Math.max(4, text.split("\n").length + Math.ceil(text.length / 70)))}
                    className="w-full resize-y rounded-xl bg-black/20 p-3 text-sm leading-relaxed text-white outline-none ring-1 ring-white/[0.06] focus:ring-accent-bright/60"
                  />
                  <p className={cn("mt-1.5 text-right text-[11px] tabular-nums", over ? "text-red-300" : "text-muted")}>
                    {seo ? `Title ${seo.title.length}/60 · Description ${seo.description.length}/155` : `${text.length}/${resultMeta.limit}`}
                  </p>
                </article>
              );
            })}
            <p className="text-[11px] text-muted">AI can make mistakes. Check names, prices and claims before you publish.</p>
          </>
        ) : (
          <div className="flex min-h-[22rem] flex-col items-center justify-center gap-3 rounded-(--radius-panel) border border-dashed border-white/12 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/30">
              <PenLine className="size-5 text-accent-bright" aria-hidden />
            </span>
            <p className="text-sm font-medium text-white">Your copy appears here</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted">
              Pick what you&apos;re writing and who it&apos;s about, set the voice, and we&apos;ll write three different options you can edit and copy straight into your store, Instagram or email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
