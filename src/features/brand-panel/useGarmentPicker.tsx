"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { brandApi } from "./api";
import { useReadyPanel } from "./BrandPanelProvider";
import type { ProductItem } from "./types";

const RESULTS = 40;

/**
 * Choosing a garment from a catalog of hundreds. With nothing typed it offers the newest pieces;
 * typing asks the server (name, SKU or collection), so any piece can be found, not just the first 100.
 * The chosen piece is kept here, so it stays selected while the search results change.
 */
export function useGarmentPicker() {
  const { token } = useAuth();
  const { products } = useReadyPanel();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ q: string; items: ProductItem[] } | null>(null);
  const [selected, pick] = useState<ProductItem | null>(null);

  const q = query.trim();
  useEffect(() => {
    if (!q || !token) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      brandApi
        .catalogPage(token, { q }, { limit: RESULTS, signal: controller.signal })
        .then((page) => setFound({ q, items: page.items }))
        .catch(() => {
          if (!controller.signal.aborted) setFound({ q, items: [] });
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, token]);

  const searching = Boolean(q) && found?.q !== q;
  const list = q ? (found?.q === q ? found.items : []) : products;
  return { query, setQuery, list, searching, selected, pick, hasSearch: Boolean(q) };
}

export function GarmentSearch({ picker }: { picker: ReturnType<typeof useGarmentPicker> }) {
  return (
    <label className="relative block max-w-sm">
      <span className="sr-only">Search your catalog</span>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={picker.query}
        onChange={(e) => picker.setQuery(e.target.value)}
        placeholder="Search your catalog by name or SKU"
        className="glass-pill h-10 w-full rounded-full pl-10 pr-9 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-accent-bright/70 [&::-webkit-search-cancel-button]:hidden"
      />
      {picker.query && (
        <button type="button" onClick={() => picker.setQuery("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-white">
          <X className="size-4" />
        </button>
      )}
      {picker.hasSearch && !picker.searching && picker.list.length === 0 && <span className="mt-1 block text-xs text-muted">No garments match.</span>}
    </label>
  );
}
