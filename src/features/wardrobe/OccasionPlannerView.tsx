"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Layers, LoaderCircle, MapPin, Shirt, Sparkles } from "lucide-react";
import { Notice } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type OccasionPlan, type PlannedOutfit, type WardrobeItem } from "@/features/workspace/api";
import { cn } from "@/lib/utils";

const OCCASIONS = [
  { id: "wedding", label: "Wedding" },
  { id: "festive", label: "Festive" },
  { id: "gala", label: "Cocktail & Gala" },
  { id: "party", label: "Night Out" },
  { id: "corporate", label: "Corporate" },
  { id: "date", label: "Date Night" },
  { id: "vacation", label: "Vacation" },
  { id: "casual", label: "Casual" },
] as const;

const WEDDING_EVENTS = ["Haldi", "Mehendi", "Sangeet", "Phere / Wedding", "Reception", "Cocktail"];
const WEDDING_ROLES = ["Bride / Groom", "Immediate Family", "Close Friend", "Guest"];
const WEDDING_DURATIONS = ["1 Day", "2 Days", "3 Days", "4+ Days"];

const SOURCING_OPTIONS = [
  { id: "wardrobe_only", label: "Wardrobe only", hint: "Style 100% from your closet" },
  { id: "mix_match", label: "Smart Mix & Match", hint: "Match wardrobe with key additions" },
  { id: "new_purchase", label: "Curate New", hint: "Fresh brand recommendations" },
] as const;

const FESTIVE_TYPES = ["Diwali", "Eid", "Navratri", "Pooja", "Celebration"];

const shopLinks = (q: string) => [
  { label: "Myntra", href: `https://www.myntra.com/${encodeURIComponent(q.trim().replace(/\s+/g, "-"))}` },
  { label: "Nykaa Fashion", href: `https://www.nykaafashion.com/catalogsearch/result/?q=${encodeURIComponent(q)}` },
  { label: "Amazon", href: `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
];

const field =
  "glass-pill h-12 w-full rounded-full px-5 text-sm text-white placeholder:text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent-bright/70";

const chipCls = (active: boolean) =>
  cn(
    "flex min-h-10 items-center gap-1.5 rounded-full px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
    active ? "chip-on font-medium" : "glass-pill text-subtle hover:text-white"
  );

/** A numbered step of the planner form. */
function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="card-violet rounded-(--radius-panel) p-5 sm:p-6">
      <h2 className="flex items-center gap-3 text-sm font-medium text-white">
        <span className="keycap flex size-7 items-center justify-center rounded-full text-xs text-[#c9bcff]">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{children}</p>;
}

export function OccasionPlannerView({ items }: { items: WardrobeItem[] }) {
  const { token } = useAuth();

  const [selectedOccasion, setSelectedOccasion] = useState<string>("wedding");
  const [weddingDuration, setWeddingDuration] = useState<string>("3 Days");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["Sangeet", "Phere / Wedding", "Reception"]);
  const [weddingRole, setWeddingRole] = useState<string>("Close Friend");
  const [festiveType, setFestiveType] = useState<string>("Diwali");
  const [sourcingStrategy, setSourcingStrategy] = useState<string>("mix_match");

  const [location, setLocation] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [dressCode, setDressCode] = useState<string>("");
  const [personalNotes] = useState<string>("");

  const [plan, setPlan] = useState<OccasionPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const toggleEvent = (evt: string) => {
    setSelectedEvents((prev) => (prev.includes(evt) ? (prev.length > 1 ? prev.filter((id) => id !== evt) : prev) : [...prev, evt]));
  };

  const executePlan = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    setPlan(null);

    const occasionLabel = OCCASIONS.find((o) => o.id === selectedOccasion)?.label ?? selectedOccasion;
    const contextParts: string[] = [`Occasion: ${occasionLabel}`];

    if (selectedOccasion === "wedding") {
      contextParts.push(`Duration: ${weddingDuration}`);
      contextParts.push(`Ceremonies: ${selectedEvents.join(", ")}`);
      contextParts.push(`Role: ${weddingRole}`);
    } else if (selectedOccasion === "festive") {
      contextParts.push(`Festive Occasion: ${festiveType}`);
    }

    const strat = SOURCING_OPTIONS.find((s) => s.id === sourcingStrategy);
    contextParts.push(`Sourcing: ${strat?.label} (${strat?.hint})`);

    if (personalNotes.trim()) contextParts.push(`Notes: ${personalNotes.trim()}`);

    try {
      const result = await workspaceApi.planOccasion(token, {
        eventType: occasionLabel,
        dressCode: dressCode.trim() || undefined,
        location: location.trim() || undefined,
        budget: budget ? Math.round(Number(budget)) : undefined,
        notes: contextParts.join(" | "),
      });
      setPlan(result);
    } catch {
      setError("Unable to generate outfit plan. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const outfits: PlannedOutfit[] = plan?.outfits?.outfits ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left: the planner as four short steps. */}
      <div className="flex flex-col gap-4">
        <Step n={1} title="What's the occasion?">
          <div role="group" aria-label="Occasion" className="flex flex-wrap gap-2">
            {OCCASIONS.map((occ) => (
              <button key={occ.id} type="button" aria-pressed={selectedOccasion === occ.id} onClick={() => setSelectedOccasion(occ.id)} className={chipCls(selectedOccasion === occ.id)}>
                {occ.label}
              </button>
            ))}
          </div>

          {selectedOccasion === "wedding" && (
            <div className="mt-5 space-y-5 border-t border-white/8 pt-5">
              <div>
                <Label>How long</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEDDING_DURATIONS.map((dur) => (
                    <button key={dur} type="button" aria-pressed={weddingDuration === dur} onClick={() => setWeddingDuration(dur)} className={chipCls(weddingDuration === dur)}>
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Ceremonies to style</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEDDING_EVENTS.map((evt) => {
                    const active = selectedEvents.includes(evt);
                    return (
                      <button key={evt} type="button" aria-pressed={active} onClick={() => toggleEvent(evt)} className={chipCls(active)}>
                        {active && <Check className="size-3.5" strokeWidth={2.5} />}
                        {evt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Your role</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEDDING_ROLES.map((role) => (
                    <button key={role} type="button" aria-pressed={weddingRole === role} onClick={() => setWeddingRole(role)} className={chipCls(weddingRole === role)}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedOccasion === "festive" && (
            <div className="mt-5 border-t border-white/8 pt-5">
              <Label>Which festival</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {FESTIVE_TYPES.map((fest) => (
                  <button key={fest} type="button" aria-pressed={festiveType === fest} onClick={() => setFestiveType(fest)} className={chipCls(festiveType === fest)}>
                    {fest}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Step>

        <Step n={2} title="Where should the outfits come from?">
          <div role="radiogroup" aria-label="Outfit sourcing" className="grid gap-2.5 sm:grid-cols-3">
            {SOURCING_OPTIONS.map((opt) => {
              const active = sourcingStrategy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSourcingStrategy(opt.id)}
                  className={cn(
                    "flex flex-col items-start rounded-2xl p-4 text-left transition-[box-shadow,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
                    active ? "bg-accent/20 shadow-[inset_0_0_0_1.5px_rgba(171,154,255,0.7)]" : "bg-white/[0.03] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/[0.06]"
                  )}
                >
                  <span className="text-sm font-medium text-white">{opt.label}</span>
                  <span className="mt-1 text-xs leading-snug text-muted">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step n={3} title="A few details">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="plan-city" className="sr-only">City</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input id="plan-city" type="text" maxLength={80} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, e.g. Udaipur" className={cn(field, "pl-11")} />
              </div>
            </div>
            <div>
              <label htmlFor="plan-budget" className="sr-only">Budget in rupees</label>
              <div className="relative">
                <span aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                <input id="plan-budget" type="number" min={0} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget (optional)" className={cn(field, "pl-10")} />
              </div>
            </div>
          </div>
          <label htmlFor="plan-code" className="sr-only">Dress code</label>
          <input id="plan-code" type="text" maxLength={120} value={dressCode} onChange={(e) => setDressCode(e.target.value)} placeholder="Dress code, e.g. Traditional, Pastel, Indo-Western" className={cn(field, "mt-3")} />
        </Step>

        {error && <Notice tone="error">{error}</Notice>}

        <button
          type="button"
          onClick={executePlan}
          disabled={loading}
          className="btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-medium transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110 disabled:translate-y-0 disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
          {loading ? "Planning your looks…" : "Plan my outfits"}
        </button>
      </div>

      {/* Right: results, pinned beside the form on desktop. */}
      <section aria-live="polite" className="flex flex-col gap-4 lg:sticky lg:top-40 lg:h-fit">
        <div>
          <h2 className="chrome-soft text-h3 font-medium">Your looks</h2>
          <p className="mt-1 text-sm text-muted">{outfits.length > 0 ? `${outfits.length} tailored ${outfits.length === 1 ? "combination" : "combinations"}` : "They'll appear here"}</p>
        </div>

        {loading && (
          <div aria-busy className="flex flex-col gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="card-violet rounded-(--radius-panel) p-5">
                <div className="shimmer h-4 w-40 rounded-full" />
                <div className="mt-4 flex gap-3">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="shimmer aspect-[3/4] w-24 rounded-xl" />
                  ))}
                </div>
                <div className="shimmer mt-4 h-3 w-full rounded-full" />
                <div className="shimmer mt-2 h-3 w-2/3 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && outfits.length === 0 && !plan && (
          <div className="card-violet flex flex-col items-center rounded-(--radius-panel) px-6 py-14 text-center">
            <span className="keycap flex size-14 items-center justify-center rounded-2xl">
              <Layers className="size-6 text-[#c9bcff]" strokeWidth={1.75} />
            </span>
            <p className="mt-5 max-w-[300px] text-sm text-muted">Pick an occasion, add a few details, then tap &ldquo;Plan my outfits&rdquo;.</p>
          </div>
        )}

        {!loading && plan && outfits.length === 0 && (
          <div className="card-violet rounded-(--radius-panel) p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-subtle">{plan.raw}</p>
          </div>
        )}

        {!loading && plan?.styleGuide && plan.styleGuide.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted">Style rules applied</span>
            {plan.styleGuide.map((rule) => (
              <span key={rule} className="glass-pill rounded-full px-2.5 py-1 text-[11px] text-subtle">
                {rule}
              </span>
            ))}
          </div>
        )}

        {!loading &&
          outfits.map((outfit, idx) => {
            const pieces = (outfit.itemIds ?? []).map((id) => byId.get(id)).filter((p): p is WardrobeItem => Boolean(p));
            const missing =
              typeof outfit.missing === "string"
                ? outfit.missing
                  ? [{ item: outfit.missing.replace(/^Missing:\s*/i, ""), searchQuery: outfit.missing.replace(/^Missing:\s*/i, "") }]
                  : []
                : outfit.missing ?? [];

            return (
              <article key={idx} className="card-violet-strong animate-rise-in overflow-hidden rounded-(--radius-panel)" style={{ animationDelay: `${idx * 70}ms` }}>
                <div className="flex items-center justify-between gap-3 px-5 pt-5">
                  <h3 className="text-base font-medium text-white">{outfit.name || `Look ${idx + 1}`}</h3>
                  {outfit.confidence != null && (
                    <span className="rounded-full bg-[#f6c453]/15 px-2.5 py-1 text-[11px] font-medium text-[#f6c453] ring-1 ring-[#f6c453]/30">{Math.round(outfit.confidence)}% match</span>
                  )}
                </div>

                <div className="px-5 pb-5 pt-4">
                  {pieces.length > 0 && (
                    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
                      {pieces.map((p) => (
                        <div key={p.id} className="w-24 flex-none">
                          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_50%_30%,#1c1840_0%,#0b0c22_75%)] p-1.5 ring-1 ring-white/10">
                            <Photo src={p.image} alt={p.name} fit="contain" />
                          </div>
                          <p className="mt-1.5 truncate text-[11px] text-subtle">{p.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {outfit.why && <p className="mt-4 text-sm leading-relaxed text-subtle">{outfit.why}</p>}

                  {missing.length > 0 && (
                    <div className="mt-4 rounded-2xl bg-[#f6c453]/[0.06] p-3.5 ring-1 ring-[#f6c453]/20">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#f6c453]">Worth adding</p>
                      <div className="mt-2 flex flex-col gap-2.5">
                        {missing.map((m, mIdx) => (
                          <div key={mIdx} className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm text-white">{m.item}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {shopLinks(m.searchQuery || m.item).map((sl) => (
                                <a key={sl.label} href={sl.href} target="_blank" rel="noreferrer" className="glass-pill flex h-8 items-center rounded-full px-3 text-[11px] text-ink-soft transition-[filter] hover:brightness-125">
                                  {sl.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pieces[0] && (
                    <Link href={`/drape?item=${pieces[0].id}`} className="btn-primary mt-4 flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110">
                      <Shirt className="size-4" />
                      Drape this look
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
      </section>
    </div>
  );
}
