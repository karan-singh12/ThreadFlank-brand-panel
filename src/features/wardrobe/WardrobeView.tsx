"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, SearchX, Shirt, X } from "lucide-react";
import { ActionButton, Notice } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/motion/Reveal";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { errorMessage, useWardrobe } from "@/features/workspace/hooks";
import { cn } from "@/lib/utils";
import { WARDROBE_CATEGORIES, wardrobeContent as copy } from "@/data/studio-content";
import { AddItemForm } from "./AddItemForm";
import { InsightsPanel } from "./InsightsPanel";
import { TodayStyleWidget } from "./TodayStyleWidget";
import { OccasionPlannerView } from "./OccasionPlannerView";
import { ItemDetailModal } from "./ItemDetailModal";

const TABS = [
  { id: "items", label: "My Wardrobe" },
  { id: "planner", label: "Outfit Planner" },
  { id: "insights", label: "Insights" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const UNWORN_DAYS = 90;
const DAY_MS = 86_400_000;

export const rupees = (n: number | null | undefined) => (n == null ? "—" : `₹${n.toLocaleString("en-IN")}`);

/** Owned for 90+ days and never worn, or last worn 90+ days ago. */
export function isUnworn(item: WardrobeItem) {
  const ref = item.lastWornAt ?? item.createdAt;
  return Date.now() - new Date(ref).getTime() > UNWORN_DAYS * DAY_MS;
}

export function WardrobeView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawTab = params.get("tab");
  const tab: Tab = TABS.some((t) => t.id === rawTab) ? (rawTab as Tab) : "items";
  const wardrobe = useWardrobe();

  return (
    <div className="relative">
      {/* Segmented tabs, pinned under the app header. */}
      <div className="sticky top-(--app-header) z-30 border-b border-white/8 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-3.5 py-2.5 sm:px-8">
          <div role="tablist" aria-label="Wardrobe sections" className="glass-pill no-scrollbar flex w-full gap-1 overflow-x-auto rounded-full p-1 sm:w-fit">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => router.replace(`${pathname}?tab=${t.id}`, { scroll: false })}
                  className={cn(
                    "h-10 flex-1 shrink-0 whitespace-nowrap rounded-full px-5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright sm:flex-none",
                    active ? "chip-on font-medium" : "text-subtle hover:text-white"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1280px] px-3.5 pb-10 pt-6 sm:px-8 sm:pt-8">
        {tab === "items" && <ItemsTab wardrobe={wardrobe} />}
        {tab === "planner" && <OccasionPlannerView items={wardrobe.items} />}
        {tab === "insights" && <InsightsPanel />}
      </main>
    </div>
  );
}

function ItemsSkeleton() {
  return (
    <div aria-busy aria-label="Loading wardrobe" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i}>
          <div className="shimmer aspect-[3/4] rounded-[18px]" />
          <div className="shimmer mt-3 h-3 w-2/3 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ItemsTab({ wardrobe }: { wardrobe: ReturnType<typeof useWardrobe> }) {
  const { token } = useAuth();
  const { items, setItems, status, error } = wardrobe;
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState<string>(copy.all);
  const [query, setQuery] = useState("");
  const [unwornOnly, setUnwornOnly] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [pricing, setPricing] = useState<WardrobeItem | null>(null);
  const [viewingItem, setViewingItem] = useState<WardrobeItem | null>(null);

  const presentCategories = useMemo(() => WARDROBE_CATEGORIES.filter((c) => items.some((i) => i.category === c)), [items]);
  const unwornCount = useMemo(() => items.filter(isUnworn).length, [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (category === copy.all || i.category === category) &&
        (!unwornOnly || isUnworn(i)) &&
        (!q || i.name.toLowerCase().includes(q) || i.brand?.toLowerCase().includes(q) || i.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [items, category, query, unwornOnly]);

  const act = async (id: string, fn: (t: string) => Promise<WardrobeItem | void>) => {
    if (!token) return;
    setBusy(id);
    setActionError("");
    try {
      const next = await fn(token);
      if (next) {
        setItems((list) => list.map((i) => (i.id === next.id ? next : i)));
        if (viewingItem?.id === next.id) setViewingItem(next);
      }
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = (id: string) =>
    act(id, async (t) => {
      await workspaceApi.removeWardrobeItem(t, id);
      setItems((list) => list.filter((i) => i.id !== id));
      if (viewingItem?.id === id) setViewingItem(null);
    });

  if (status === "loading") return <ItemsSkeleton />;
  if (status === "error") return <Notice tone="error">{error}</Notice>;

  const chip = (active: boolean) =>
    cn(
      "h-9 flex-none snap-start whitespace-nowrap rounded-full px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
      active ? "chip-on font-medium" : "glass-pill text-subtle hover:text-white"
    );

  return (
    <>
      {items.length === 0 ? (
        <div className="card-violet flex flex-col items-center rounded-(--radius-panel) px-6 py-16 text-center">
          <span className="keycap flex size-14 items-center justify-center rounded-2xl">
            <Shirt className="size-6 text-[#c9bcff]" strokeWidth={1.75} />
          </span>
          <h2 className="chrome-soft mt-5 text-h3 font-medium">{copy.emptyTitle}</h2>
          <p className="mt-2 max-w-[380px] text-sm text-muted">{copy.emptyDescription}</p>
          <ActionButton className="mt-7" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            {copy.add}
          </ActionButton>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 xl:grid-cols-[1fr_380px]">
          <div className="block lg:hidden">
            <TodayStyleWidget items={items} />
          </div>

          <section className="min-w-0">
            <label className="relative block">
              <span className="sr-only">{copy.searchPlaceholder}</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="glass-pill h-12 w-full rounded-full pl-11 pr-11 text-sm text-white placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright/70 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-white">
                  <X className="size-4" />
                </button>
              )}
            </label>

            <div role="group" aria-label="Filter by category" className="no-scrollbar -mx-3.5 mt-3 flex snap-x gap-2 overflow-x-auto px-3.5 sm:mx-0 sm:px-0">
              <button type="button" aria-pressed={category === copy.all} onClick={() => setCategory(copy.all)} className={chip(category === copy.all)}>
                All · {items.length}
              </button>
              {presentCategories.map((c) => (
                <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={chip(category === c)}>
                  {c} · {items.filter((i) => i.category === c).length}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={unwornOnly}
                onClick={() => setUnwornOnly((v) => !v)}
                title="Show items unworn for 90+ days"
                className={cn(
                  "h-9 flex-none snap-start whitespace-nowrap rounded-full px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
                  unwornOnly ? "bg-[#f6c453] font-medium text-canvas" : "glass-pill text-[#f6c453] hover:brightness-125"
                )}
              >
                Unworn 90d+{unwornCount > 0 ? ` · ${unwornCount}` : ""}
              </button>
            </div>

            {actionError && (
              <div className="mt-4">
                <Notice tone="error">{actionError}</Notice>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="group flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-accent-bright/40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(102,69,235,0.18),transparent_70%)] text-center transition-colors hover:border-accent-bright/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright"
              >
                <span className="btn-primary flex size-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110">
                  <Plus className="size-5" strokeWidth={2} />
                </span>
                <span className="text-sm text-ink-soft">Add a piece</span>
              </button>

              {shown.map((item, i) => (
                <Reveal key={item.id} y={16} delay={Math.min(i % 4, 3) * 0.04}>
                  <ItemCard item={item} onClick={() => setViewingItem(item)} />
                </Reveal>
              ))}
            </div>

            {shown.length === 0 && (
              <div className="mt-8 flex flex-col items-center rounded-(--radius-panel) bg-white/[0.03] px-6 py-10 text-center ring-1 ring-white/8">
                <SearchX className="size-6 text-muted" strokeWidth={1.75} />
                <p className="mt-3 text-sm text-subtle">Nothing in your closet matches that.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory(copy.all);
                    setUnwornOnly(false);
                  }}
                  className="mt-4 h-10 rounded-full px-4 text-sm text-accent-bright hover:text-white"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>

          <aside className="hidden lg:sticky lg:top-40 lg:flex lg:h-fit lg:flex-col lg:gap-5">
            <TodayStyleWidget items={items} />
          </aside>
        </div>
      )}

      <ItemDetailModal
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        onWorn={(item) => act(item.id, (t) => workspaceApi.markWorn(t, item.id))}
        onUndo={(item) => act(item.id, (t) => workspaceApi.undoWorn(t, item.id))}
        onEditPrice={(item) => setPricing(item)}
        onRemove={(item) => remove(item.id)}
        busy={busy === viewingItem?.id}
      />

      <Modal open={adding} onClose={() => setAdding(false)} title={copy.form.title}>
        {adding && (
          <AddItemForm
            onAdded={(item) => {
              setItems((list) => [item, ...list]);
              setAdding(false);
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(pricing)} onClose={() => setPricing(null)} title="Price paid">
        {pricing && (
          <PriceForm
            item={pricing}
            onSaved={(next) => {
              setItems((list) => list.map((i) => (i.id === next.id ? next : i)));
              if (viewingItem?.id === next.id) setViewingItem(next);
              setPricing(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

/** Garment card: the piece on a soft studio plate, name beneath. Tapping opens the detail sheet. */
function ItemCard({ item, onClick }: { item: WardrobeItem; onClick: () => void }) {
  const unworn = isUnworn(item);

  return (
    <button type="button" onClick={onClick} aria-label={`Open ${item.name}`} className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-bright">
      <span className="relative block aspect-[3/4] overflow-hidden rounded-[18px] bg-[radial-gradient(ellipse_at_50%_30%,#1c1840_0%,#0b0c22_75%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_20px_50px_-30px_rgba(0,0,0,0.9)] transition-[transform,box-shadow] duration-300 ease-(--ease-premium) md:group-hover:-translate-y-1.5 md:group-hover:shadow-[inset_0_0_0_1px_rgba(171,154,255,0.45),0_30px_60px_-24px_rgba(102,69,235,0.5)]">
        <span className="absolute inset-0 p-3 transition-transform duration-500 ease-(--ease-premium) md:group-hover:scale-105">
          <Photo src={item.image} alt={item.name} fit="contain" />
        </span>
        {unworn && <span className="glass-pill absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-[#f6c453]">Unworn 90d+</span>}
      </span>
      <span className="mt-3 block truncate px-1 text-sm text-white">{item.name}</span>
      {item.brand && <span className="block truncate px-1 text-[11px] uppercase tracking-[0.08em] text-muted">{item.brand}</span>}
    </button>
  );
}

function PriceForm({ item, onSaved }: { item: WardrobeItem; onSaved: (next: WardrobeItem) => void }) {
  const { token } = useAuth();
  const [value, setValue] = useState(item.costPaid != null ? String(item.costPaid) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      onSaved(
        await workspaceApi.updateWardrobeItem(token, item.id, {
          costPaid: value.trim() ? Math.round(Number(value)) : null,
        })
      );
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className="text-sm text-muted">What did you pay for {item.name}? It is used to calculate cost per wear.</p>
      <div className="flex flex-col gap-2">
        <label htmlFor="price-paid" className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
          Price (₹)
        </label>
        <input
          id="price-paid"
          type="number"
          min={0}
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="glass-pill h-12 rounded-full px-5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-accent-bright/70"
        />
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <ActionButton type="submit" loading={saving}>
        Save
      </ActionButton>
    </form>
  );
}
