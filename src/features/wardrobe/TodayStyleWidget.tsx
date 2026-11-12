"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle, Shirt } from "lucide-react";
import { ActionButton, Field, Notice, SelectField, TextArea } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type OccasionPlan, type PlannedOutfit, type WardrobeItem } from "@/features/workspace/api";
import { OCCASIONS, wardrobeContent as copy } from "@/data/studio-content";
import { rupees } from "./WardrobeView";

const DRESS_CODES = ["", "Casual", "Smart casual", "Business", "Formal", "Black tie", "Traditional / ethnic"];

const shopLinks = (q: string) => [
  { label: "Myntra", href: `https://www.myntra.com/${encodeURIComponent(q.trim().replace(/\s+/g, "-"))}` },
  { label: "Nykaa Fashion", href: `https://www.nykaafashion.com/catalogsearch/result/?q=${encodeURIComponent(q)}` },
  { label: "Amazon", href: `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
];

export function TodayStyleWidget({ items }: { items: WardrobeItem[] }) {
  const { token } = useAuth();
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0].id);
  const [dressCode, setDressCode] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState<OccasionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const ask = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const label = OCCASIONS.find((o) => o.id === occasion)?.label ?? occasion;
      setPlan(
        await workspaceApi.planOccasion(token, {
          eventType: label,
          dressCode: dressCode || undefined,
          location: location.trim() || undefined,
          budget: budget ? Math.round(Number(budget)) : undefined,
          notes: notes.trim()
            ? `${notes.trim()} | Prioritize items from wardrobe for today's outfit.`
            : "Prioritize items from wardrobe for today's outfit.",
        })
      );
    } catch {
      setError(copy.plannerError);
    } finally {
      setLoading(false);
    }
  };

  const outfits: PlannedOutfit[] = plan?.outfits?.outfits ?? [];

  return (
    <section className="card-violet flex flex-col gap-4 rounded-(--radius-panel) p-5">
      <h2 className="text-body font-medium text-white">
        Today&apos;s Outfit
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Occasion"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          options={OCCASIONS.map((o) => ({ value: o.id, label: o.label }))}
        />
        <SelectField
          label="Dress code"
          value={dressCode}
          onChange={(e) => setDressCode(e.target.value)}
          options={DRESS_CODES.map((d) => ({ value: d, label: d || "Any" }))}
        />
        <Field
          label="Location"
          maxLength={80}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Udaipur"
        />
        <Field
          label="Budget (₹)"
          type="number"
          min={0}
          inputMode="numeric"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>

      <TextArea
        label="Notes"
        rows={2}
        maxLength={300}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={copy.plannerNotes}
      />

      <button
        type="button"
        onClick={ask}
        disabled={loading}
        style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.12)" }}
        className="btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {loading && <LoaderCircle className="size-4 animate-spin text-white" />}
        Ask with AI
      </button>

      {error && <Notice tone="error">{error}</Notice>}

      {outfits.length > 0 && plan?.styleGuide && plan.styleGuide.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-muted">Style rules used:</span>
          {plan.styleGuide.map((title) => (
            <span key={title} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-subtle">
              {title}
            </span>
          ))}
        </div>
      )}

      {plan && outfits.length === 0 && (
        <p className="whitespace-pre-wrap rounded-xl border border-white/8 bg-white/[0.02] p-3 text-sm text-subtle">
          {plan.raw}
        </p>
      )}

      {outfits.map((o, i) => {
        const pieces = (o.itemIds ?? []).map((id) => byId.get(id)).filter((p): p is WardrobeItem => Boolean(p));
        const missing =
          typeof o.missing === "string"
            ? o.missing
              ? [{ item: o.missing.replace(/^Missing:\s*/i, ""), searchQuery: o.missing.replace(/^Missing:\s*/i, "") }]
              : []
            : o.missing ?? [];

        return (
          <article key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-white">{o.name || `Outfit ${i + 1}`}</p>
              {o.confidence != null && (
                <span className="shrink-0 rounded-full bg-accent/25 px-2 py-0.5 text-[11px] text-accent-bright">
                  {Math.round(o.confidence)}% match
                </span>
              )}
            </div>

            {pieces.length > 0 && (
              <div className="mt-2 flex gap-1.5">
                {pieces.map((p) => (
                  <Link
                    key={p.id}
                    href={`/drape?item=${p.id}`}
                    title={p.name}
                    className="aspect-square w-12 overflow-hidden rounded-lg bg-white/[0.05]"
                  >
                    <Photo src={p.image} alt={p.name} fit="contain" />
                  </Link>
                ))}
              </div>
            )}

            {o.why && <p className="mt-2 text-xs text-subtle">{o.why}</p>}

            {missing.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 border-t border-white/6 pt-2">
                {missing.map((m) => (
                  <div key={m.item} className="text-xs">
                    <p className="text-amber-200">
                      Missing: {m.item}
                      {m.estimatedPrice ? <span className="text-muted"> · ~{rupees(m.estimatedPrice)}</span> : null}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {shopLinks(m.searchQuery || m.item).map((l) => (
                        <a
                          key={l.label}
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-accent-bright hover:text-white"
                        >
                          {l.label}
                          <ExternalLink className="size-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pieces[0] && (
              <Link
                href={`/drape?item=${pieces[0].id}`}
                className="mt-2 inline-flex items-center gap-1 text-xs text-accent-bright hover:text-white"
              >
                <Shirt className="size-3" />
                Drape it
              </Link>
            )}
          </article>
        );
      })}
    </section>
  );
}
