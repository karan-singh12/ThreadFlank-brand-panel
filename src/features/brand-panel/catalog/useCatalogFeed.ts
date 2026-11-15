"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { brandApi } from "../api";
import type { CatalogQuery, ProductItem } from "../types";
import { errorMessage } from "../useResource";

const PAGE = 24;

type Feed = {
  /** The request this state answers; when it differs from the current one we are loading a new list. */
  for: string;
  items: ProductItem[];
  total: number | null;
  cursor: string | null;
  /** loading = first page of a (new) query; more = a later page; idle = nothing in flight. */
  phase: "loading" | "more" | "idle";
  error: string;
};

const INITIAL: Feed = { for: "", items: [], total: null, cursor: null, phase: "loading", error: "" };

/**
 * The catalog list as the server sees it: filtered and sorted there, fetched a page at a time.
 * Changing `query` starts over from page one; `loadMore` appends the next page. A response that
 * arrives for an old query (the user kept typing) is discarded.
 */
export function useCatalogFeed(query: CatalogQuery) {
  const { token } = useAuth();
  const [feed, setFeed] = useState<Feed>(INITIAL);
  const [version, setVersion] = useState(0);
  const moreController = useRef<AbortController | null>(null);

  // Stable key so an unchanged filter does not refetch.
  const key = JSON.stringify(query);
  const requestKey = `${key}#${version}`;

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const q = JSON.parse(key) as CatalogQuery;
    brandApi
      .catalogPage(token, q, { limit: PAGE, signal: controller.signal })
      .then((page) => setFeed({ for: requestKey, items: page.items, total: page.total, cursor: page.nextCursor, phase: "idle", error: "" }))
      .catch((e) => {
        if (controller.signal.aborted) return;
        setFeed({ for: requestKey, items: [], total: null, cursor: null, phase: "idle", error: errorMessage(e) });
      });
    return () => {
      controller.abort();
      moreController.current?.abort();
    };
  }, [token, key, version, requestKey]);

  const loadMore = useCallback(() => {
    if (!token || !feed.cursor || feed.phase !== "idle") return;
    const controller = new AbortController();
    moreController.current = controller;
    const cursor = feed.cursor;
    setFeed((f) => ({ ...f, phase: "more", error: "" }));
    brandApi
      .catalogPage(token, JSON.parse(key) as CatalogQuery, { cursor, limit: PAGE, signal: controller.signal })
      .then((page) =>
        setFeed((f) => {
          // The same piece can show up twice if the list changed between pages.
          const seen = new Set(f.items.map((p) => p.id));
          return { ...f, items: [...f.items, ...page.items.filter((p) => !seen.has(p.id))], cursor: page.nextCursor, phase: "idle" };
        })
      )
      .catch((e) => {
        if (controller.signal.aborted) return;
        setFeed((f) => ({ ...f, phase: "idle", error: errorMessage(e) }));
      });
  }, [token, feed.cursor, feed.phase, key]);

  /** Start over from page one (after adding pieces or a bulk change). */
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const replace = useCallback((item: ProductItem) => setFeed((f) => ({ ...f, items: f.items.map((p) => (p.id === item.id ? item : p)) })), []);

  const remove = useCallback(
    (ids: string[]) => {
      const gone = new Set(ids);
      setFeed((f) => ({ ...f, items: f.items.filter((p) => !gone.has(p.id)), total: f.total == null ? null : Math.max(0, f.total - ids.length) }));
    },
    []
  );

  // Until the answer for the current query arrives, the old list is not shown as if it matched.
  const stale = feed.for !== requestKey;
  return { ...feed, items: stale ? [] : feed.items, phase: stale ? ("loading" as const) : feed.phase, error: stale ? "" : feed.error, hasMore: !stale && feed.cursor !== null, loadMore, refresh, replace, remove };
}
