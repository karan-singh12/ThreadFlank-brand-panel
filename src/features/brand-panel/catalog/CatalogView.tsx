"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, EyeOff, FolderInput, Layers, LoaderCircle, Plus, Search, SearchX, Tags, Trash2, Upload, X } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ActionButton, Field, Notice } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { brandApi } from "../api";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import type { BulkAction, CatalogQuery, CatalogSort, ProductItem } from "../types";
import { errorMessage, useResource } from "../useResource";
import { CATEGORIES, OCCASIONS } from "./constants";
import { COLUMNS, download, productToRow, toCsv } from "./csv";
import { GarmentForm } from "./GarmentForm";
import { ImportDialog } from "./ImportDialog";
import { ProductCard } from "./ProductCard";
import { useCatalogFeed } from "./useCatalogFeed";

const EMPTY: CatalogQuery = { q: "", category: "", collection: "", status: "", stock: "", notReady: false, sort: "newest" };
const BULK_MAX = 500;

const SORTS: { id: CatalogSort; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "popular", label: "Most tried on" },
  { id: "price_low", label: "Price: low to high" },
  { id: "price_high", label: "Price: high to low" },
  { id: "stock_low", label: "Lowest stock" },
];

const chip = (on: boolean) => cn("h-9 shrink-0 rounded-full border px-4 text-sm transition-colors", on ? "border-transparent chip-on" : "border-white/12 text-subtle hover:border-white/25 hover:text-white");
const selectCls = "glass-pill h-11 appearance-none rounded-full px-4 pr-8 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-accent-bright/70 [&>option]:bg-[#0b0b1e]";

export function CatalogView() {
  const { token } = useAuth();
  const { brand, addProduct, updateProduct, deleteProduct, facets, refreshFacets } = useReadyPanel();
  // Admins manage these lists; the built-in ones only cover the moment before any exist.
  const taxonomy = useResource(brandApi.taxonomy);
  const categoryChoices = taxonomy.data?.categories.length ? taxonomy.data.categories : CATEGORIES;
  const occasionChoices = taxonomy.data?.occasions.length ? taxonomy.data.occasions : OCCASIONS;

  const [query, setQuery] = useState<CatalogQuery>(EMPTY);
  const [searchText, setSearchText] = useState("");
  const feed = useCatalogFeed(query);
  const patch = useCallback((p: Partial<CatalogQuery>) => setQuery((q) => ({ ...q, ...p })), []);

  // Typing waits a beat so a fast typist sends one request, not one per key.
  useEffect(() => {
    const t = setTimeout(() => patch({ q: searchText }), 300);
    return () => clearTimeout(t);
  }, [searchText, patch]);

  // Infinite scroll: load the next page when the end of the grid scrolls into view.
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasMore, phase, loadMore } = feed;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, phase, loadMore]);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [deleting, setDeleting] = useState<{ item?: ProductItem } | null>(null);
  const [moving, setMoving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [recategorising, setRecategorising] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState("");

  const collectionNames = useMemo(() => facets?.collections.map((c) => c.name) ?? [], [facets]);
  const filtered = Boolean(query.q || query.category || query.collection || query.status || query.stock || query.notReady);
  const total = facets?.total ?? 0;

  const clear = () => {
    setSearchText("");
    setQuery(EMPTY);
  };
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else if (next.size < BULK_MAX) next.add(id);
      return next;
    });
  const selectLoaded = () => setSelected(new Set(feed.items.slice(0, BULK_MAX).map((p) => p.id)));

  const run = async (action: BulkAction, extra: { collection?: string; category?: string } = {}) => {
    if (!token || selected.size === 0) return false;
    setBusy(true);
    setActionError("");
    try {
      const ids = [...selected];
      const { affected } = await brandApi.bulk(token, ids, action, extra);
      setSelected(new Set());
      setToast(`${affected} ${affected === 1 ? "garment" : "garments"} updated`);
      // Filters can hide or reveal pieces after a change, so reload the page and the counts.
      feed.refresh();
      refreshFacets();
      return true;
    } catch (e) {
      setActionError(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  /** Every piece that matches the current filters, a page at a time, as a CSV the importer can read back. */
  const exportCsv = async () => {
    if (!token) return;
    setExporting(true);
    setActionError("");
    try {
      const lines: string[][] = [];
      let cursor: string | null = null;
      do {
        const page: Awaited<ReturnType<typeof brandApi.catalogPage>> = await brandApi.catalogPage(token, query, { cursor, limit: 100 });
        for (const p of page.items) lines.push(productToRow(p));
        cursor = page.nextCursor;
      } while (cursor);
      download(`threadflank-catalog-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(COLUMNS.map((c) => c.label), lines));
      setToast(`Exported ${lines.length.toLocaleString("en-IN")} garments`);
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setActionError("");
    try {
      if (deleting.item) {
        await deleteProduct(deleting.item.id);
        feed.remove([deleting.item.id]);
        setSelected((s) => {
          const next = new Set(s);
          next.delete(deleting.item!.id);
          return next;
        });
        refreshFacets();
        setDeleting(null);
      } else if (await run("delete")) {
        setDeleting(null);
      }
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSave = async (id: string, p: Parameters<typeof updateProduct>[1]) => {
    await updateProduct(id, p);
    // The edit may have changed its collection, stock or visibility, so counts and filters need a fresh read.
    feed.refresh();
    refreshFacets();
  };
  const onAdd = async (g: Parameters<typeof addProduct>[0]) => {
    const created = await addProduct(g);
    feed.refresh();
    refreshFacets();
    return created;
  };

  const headline = facets ? (
    <>
      <span className="text-white">{total.toLocaleString("en-IN")}</span> {total === 1 ? "garment" : "garments"} across <span className="text-white">{facets.collections.length}</span>{" "}
      {facets.collections.length === 1 ? "collection" : "collections"}. Shoppers can try each one on and head to your website to buy.
    </>
  ) : (
    "Shoppers can try each garment on and head to your website to buy."
  );

  const stats: { label: string; value: number; on: boolean; apply: Partial<CatalogQuery> }[] = facets
    ? [
        { label: "Live", value: facets.status.published, on: query.status === "PUBLISHED", apply: { status: query.status === "PUBLISHED" ? "" : "PUBLISHED" } },
        { label: "Draft", value: facets.status.draft, on: query.status === "DRAFT", apply: { status: query.status === "DRAFT" ? "" : "DRAFT" } },
        { label: "Low stock", value: facets.lowStock, on: query.stock === "low", apply: { stock: query.stock === "low" ? "" : "low" } },
        { label: "Out of stock", value: facets.outOfStock, on: query.stock === "out", apply: { stock: query.stock === "out" ? "" : "out" } },
        { label: "No image", value: facets.notReady, on: query.notReady, apply: { notReady: !query.notReady } },
      ]
    : [];

  return (
    <div className="space-y-6 pb-24">
      <BrandPageHeader
        eyebrow="Catalog"
        title="Your garments"
        blurb={headline}
        actions={
          <>
            <ActionButton variant="ghost" onClick={() => setImporting(true)}>
              <Upload className="size-4" aria-hidden />
              Import CSV
            </ActionButton>
            <ActionButton variant="ghost" loading={exporting} disabled={total === 0} onClick={() => void exportCsv()} title="Downloads the garments that match your filters">
              <Download className="size-4" aria-hidden />
              Export
            </ActionButton>
            <ActionButton onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden />
              Add garment
            </ActionButton>
          </>
        }
      />

      {facets && total === 0 ? (
        <EmptyState
          icon={Layers}
          title="Your catalog is empty"
          description="Add your first garment so shoppers can try it on and head to your store."
          action={<ActionButton onClick={() => setAdding(true)}>Add your first garment</ActionButton>}
          className="py-16"
        />
      ) : (
        <>
          {stats.length > 0 && (
            <div role="group" aria-label="Quick filters" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {stats.map((s) => (
                <button key={s.label} type="button" aria-pressed={s.on} onClick={() => patch(s.apply)} disabled={s.value === 0 && !s.on} className={cn(chip(s.on), "flex items-center gap-2 disabled:opacity-40")}>
                  {s.label}
                  <span className="tabular-nums opacity-80">{s.value.toLocaleString("en-IN")}</span>
                </button>
              ))}
            </div>
          )}

          {facets && (facets.collections.length > 0 || facets.uncollected > 0) && (
            <div role="group" aria-label="Filter by collection" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <button type="button" aria-pressed={query.collection === ""} onClick={() => patch({ collection: "" })} className={chip(query.collection === "")}>
                All collections
              </button>
              {facets.collections.map((c) => (
                <button key={c.name} type="button" aria-pressed={query.collection === c.name} onClick={() => patch({ collection: c.name })} className={cn(chip(query.collection === c.name), "flex items-center gap-2")}>
                  {c.name}
                  <span className="tabular-nums opacity-70">{c.count}</span>
                </button>
              ))}
              {facets.uncollected > 0 && facets.collections.length > 0 && (
                <button type="button" aria-pressed={query.collection === "none"} onClick={() => patch({ collection: "none" })} className={cn(chip(query.collection === "none"), "flex items-center gap-2")}>
                  No collection
                  <span className="tabular-nums opacity-70">{facets.uncollected}</span>
                </button>
              )}
            </div>
          )}

          <div className="sticky top-(--app-header) z-20 -mx-4 border-y border-white/8 bg-canvas/80 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative block lg:w-80">
                <span className="sr-only">Search garments</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search name, SKU or collection"
                  className="glass-pill h-11 w-full rounded-full pl-11 pr-10 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-accent-bright/70 [&::-webkit-search-cancel-button]:hidden"
                />
                {searchText && (
                  <button type="button" onClick={() => setSearchText("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-white">
                    <X className="size-4" />
                  </button>
                )}
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Category" value={query.category} onChange={(e) => patch({ category: e.target.value })} className={selectCls}>
                  <option value="">All categories</option>
                  {(facets?.categories ?? []).map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
                <select aria-label="Sort by" value={query.sort} onChange={(e) => patch({ sort: e.target.value as CatalogSort })} className={selectCls}>
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {filtered && (
                  <button type="button" onClick={clear} className="h-9 rounded-full px-3 text-sm text-accent-bright hover:text-white">
                    Clear filters
                  </button>
                )}
              </div>
              <p className="text-xs tabular-nums text-muted lg:ml-auto" aria-live="polite">
                {feed.phase === "loading" ? "Loading…" : feed.total != null ? `${feed.items.length.toLocaleString("en-IN")} of ${feed.total.toLocaleString("en-IN")} shown` : ""}
              </p>
            </div>
          </div>

          {toast && <Notice tone="success">{toast}</Notice>}
          {actionError && !deleting && !moving && <Notice tone="error">{actionError}</Notice>}

          {feed.error && feed.items.length === 0 ? (
            <ErrorState message={feed.error} onRetry={feed.refresh} />
          ) : feed.phase === "loading" && feed.items.length === 0 ? (
            <Grid>
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-[18px]" />
              ))}
            </Grid>
          ) : feed.items.length === 0 ? (
            <EmptyState icon={SearchX} title="No garments match" description="Try another word, or remove a filter." action={<ActionButton variant="ghost" onClick={clear}>Clear filters</ActionButton>} />
          ) : (
            <>
              <Grid>
                {feed.items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    selected={selected.has(p.id)}
                    onToggleSelect={() => toggle(p.id)}
                    onEdit={() => setEditing(p)}
                    onDelete={() => {
                      setActionError("");
                      setDeleting({ item: p });
                    }}
                  />
                ))}
              </Grid>
              <div ref={sentinel} className="flex min-h-16 items-center justify-center">
                {feed.phase === "more" ? (
                  <LoaderCircle className="size-5 animate-spin text-muted" aria-label="Loading more" />
                ) : feed.hasMore ? (
                  <ActionButton variant="ghost" onClick={feed.loadMore}>
                    Load more
                  </ActionButton>
                ) : (
                  <p className="text-xs text-muted">You&apos;ve reached the end.</p>
                )}
              </div>
              {feed.error && <Notice tone="error">{feed.error}</Notice>}
            </>
          )}
        </>
      )}

      {selected.size > 0 && (
        <div role="toolbar" aria-label="Bulk actions" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-3xl border border-white/12 bg-canvas/90 p-3 shadow-2xl backdrop-blur-xl sm:bottom-6">
          <p className="px-2 text-sm text-white">
            <span className="tabular-nums">{selected.size}</span> selected
          </p>
          <button type="button" onClick={selectLoaded} className="text-xs text-accent-bright hover:text-white">
            Select all {Math.min(feed.items.length, BULK_MAX)} loaded
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <ActionButton variant="ghost" className="h-9 px-4" loading={busy} onClick={() => run("publish")}>
              <Eye className="size-4" aria-hidden /> Go live
            </ActionButton>
            <ActionButton variant="ghost" className="h-9 px-4" loading={busy} onClick={() => run("draft")}>
              <EyeOff className="size-4" aria-hidden /> Hide
            </ActionButton>
            <ActionButton
              variant="ghost"
              className="h-9 px-4"
              onClick={() => {
                setActionError("");
                setCollectionName("");
                setMoving(true);
              }}
            >
              <FolderInput className="size-4" aria-hidden /> Collection
            </ActionButton>
            <ActionButton
              variant="ghost"
              className="h-9 px-4"
              onClick={() => {
                setActionError("");
                setCategoryName(categoryChoices[0] ?? "");
                setRecategorising(true);
              }}
            >
              <Tags className="size-4" aria-hidden /> Category
            </ActionButton>
            <ActionButton
              variant="danger"
              className="h-9 px-4"
              onClick={() => {
                setActionError("");
                setDeleting({});
              }}
            >
              <Trash2 className="size-4" aria-hidden /> Delete
            </ActionButton>
            <button type="button" onClick={() => setSelected(new Set())} aria-label="Clear selection" className="flex size-9 items-center justify-center rounded-full text-muted hover:text-white">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a garment">
        <GarmentForm categories={categoryChoices} occasions={occasionChoices} collections={collectionNames} defaultBuyUrl={brand.websiteUrl ?? ""} onAdd={onAdd} onDone={() => setAdding(false)} />
      </Modal>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit garment">
        {editing && <GarmentForm key={editing.id} categories={categoryChoices} occasions={occasionChoices} collections={collectionNames} defaultBuyUrl={brand.websiteUrl ?? ""} garment={editing} onSave={onSave} onDone={() => setEditing(null)} />}
      </Modal>

      <ImportDialog
        open={importing}
        onClose={() => setImporting(false)}
        categories={categoryChoices}
        occasions={occasionChoices}
        onFinished={() => {
          feed.refresh();
          refreshFacets();
        }}
      />

      <Modal open={recategorising} onClose={() => setRecategorising(false)} title={`Change category of ${selected.size} garments`}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run("category", { category: categoryName })) setRecategorising(false);
          }}
        >
          {actionError && <Notice tone="error">{actionError}</Notice>}
          <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">
            New category
            <select value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="h-11 appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm normal-case tracking-normal text-white outline-none focus:border-accent-bright/70 [&>option]:bg-[#0b0b1e]">
              {categoryChoices.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <ActionButton variant="ghost" onClick={() => setRecategorising(false)}>
              Cancel
            </ActionButton>
            <ActionButton type="submit" loading={busy}>
              Change category
            </ActionButton>
          </div>
        </form>
      </Modal>

      <Modal open={moving} onClose={() => setMoving(false)} title={`Move ${selected.size} to a collection`}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run("collection", { collection: collectionName.trim() })) setMoving(false);
          }}
        >
          {actionError && <Notice tone="error">{actionError}</Notice>}
          <Field label="Collection name" list="move-collections" maxLength={80} value={collectionName} onChange={(e) => setCollectionName(e.target.value)} placeholder="e.g. Wedding Edit 2026" hint="Leave empty to take these pieces out of their collection." autoFocus />
          <datalist id="move-collections">
            {collectionNames.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div className="flex justify-end gap-2">
            <ActionButton variant="ghost" onClick={() => setMoving(false)}>
              Cancel
            </ActionButton>
            <ActionButton type="submit" loading={busy}>
              {collectionName.trim() ? "Move" : "Remove from collection"}
            </ActionButton>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title={deleting?.item ? "Delete garment?" : `Delete ${selected.size} garments?`}>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {deleting?.item ? (
              <>
                <span className="text-white">{deleting.item.title}</span> will be removed from your catalog.
              </>
            ) : (
              <>
                <span className="text-white">{selected.size}</span> selected garments will be removed from your catalog.
              </>
            )}{" "}
            This can&apos;t be undone.
          </p>
          {actionError && <Notice tone="error">{actionError}</Notice>}
          <div className="flex justify-end gap-2">
            <ActionButton variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </ActionButton>
            <ActionButton variant="danger" loading={busy} onClick={confirmDelete}>
              Delete
            </ActionButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4 2xl:grid-cols-5">{children}</div>;
}
