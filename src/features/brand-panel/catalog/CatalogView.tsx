"use client";

import { useMemo, useState } from "react";
import { Layers, Plus, RefreshCw, Search, SearchX, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import type { ProductItem } from "../types";
import { ALL } from "./constants";
import { EditBuyUrlForm } from "./EditBuyUrlForm";
import { GarmentForm } from "./GarmentForm";
import { ProductCard } from "./ProductCard";

export function CatalogView() {
  const { products, brand, addProduct, updateBuyUrl } = useReadyPanel();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);

  const categories = useMemo(() => [ALL, ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))], [products]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === ALL || p.category === category) &&
        (!q || p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
  }, [products, search, category]);

  const clear = () => {
    setSearch("");
    setCategory(ALL);
  };

  return (
    <div className="space-y-6">
      <BrandPageHeader
        eyebrow="Catalog"
        title="Your garments"
        blurb={
          <>
            <span className="text-white">{products.length}</span> {products.length === 1 ? "garment" : "garments"} in your store. Shoppers can try each one on and head to your website to buy.
          </>
        }
        actions={
          <>
            <ActionButton variant="ghost" disabled title="Shopify sync is coming soon">
              <RefreshCw className="size-4" aria-hidden />
              Shopify sync
              <Badge tone="accent" className="h-5 px-2">
                Soon
              </Badge>
            </ActionButton>
            <ActionButton onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden />
              Add garment
            </ActionButton>
          </>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Your catalog is empty"
          description="Add your first garment so shoppers can try it on and head to your store."
          action={<ActionButton onClick={() => setAdding(true)}>Add your first garment</ActionButton>}
          className="py-16"
        />
      ) : (
        <>
          <div className="sticky top-(--app-header) z-20 -mx-4 border-y border-white/8 bg-canvas/80 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative block lg:w-80">
                <span className="sr-only">Search garments</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, SKU or category"
                  className="glass-pill h-11 w-full rounded-full pl-11 pr-10 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-accent-bright/70 [&::-webkit-search-cancel-button]:hidden"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-white">
                    <X className="size-4" />
                  </button>
                )}
              </label>
              <div role="group" aria-label="Filter by category" className="no-scrollbar flex gap-2 overflow-x-auto">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                    className={cn("h-9 shrink-0 rounded-full border px-4 text-sm transition-colors", category === c ? "border-transparent chip-on" : "border-white/12 text-subtle hover:border-white/25 hover:text-white")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {shown.length === 0 ? (
            <EmptyState icon={SearchX} title="No garments match" description="Try another word or category." action={<ActionButton variant="ghost" onClick={clear}>Clear filters</ActionButton>} />
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
              {shown.map((p) => (
                <ProductCard key={p.id} product={p} onEditLink={() => setEditing(p)} />
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a garment">
        <GarmentForm defaultBuyUrl={brand.websiteUrl ?? ""} onAdd={addProduct} onDone={() => setAdding(false)} />
      </Modal>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit buy link">
        {editing && <EditBuyUrlForm key={editing.id} product={editing} onSave={updateBuyUrl} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
