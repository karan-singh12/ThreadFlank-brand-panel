"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, Check, Copy, Trash2 } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Controls";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { brandApi } from "../api";
import type { ContentType, SavedContent } from "../types";
import { errorMessage, useResource } from "../useResource";

const LABEL: Record<ContentType, string> = {
  product_description: "Product description",
  instagram_caption: "Instagram caption",
  launch_announcement: "Launch announcement",
  email_blurb: "Email blurb",
  seo_meta: "SEO title and description",
  whatsapp_broadcast: "WhatsApp broadcast",
  product_title: "Product title",
};

const load = (token: string, signal: AbortSignal) => brandApi.library(token, signal);

/** Copy the brand saved from the writer: filter by kind, copy again, delete what is no longer wanted. */
export function ContentLibrary() {
  const { token } = useAuth();
  const items = useResource(load);
  const [kind, setKind] = useState<ContentType | "all">("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  const list = useMemo(() => items.data ?? [], [items.data]);
  const kinds = useMemo(() => [...new Set(list.map((i) => i.contentType))], [list]);
  const shown = kind === "all" ? list : list.filter((i) => i.contentType === kind);

  const copy = async (item: SavedContent) => {
    try {
      await navigator.clipboard.writeText(item.body);
      setCopied(item.id);
      setTimeout(() => setCopied((c) => (c === item.id ? null : c)), 1800);
    } catch {
      setError("Your browser blocked copying. Select the text and copy it by hand.");
    }
  };

  const remove = async (item: SavedContent) => {
    if (!token) return;
    setError("");
    try {
      await brandApi.deleteSavedContent(token, item.id);
      items.setData((prev) => (prev ?? []).filter((i) => i.id !== item.id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (items.status === "loading") return <Skeleton className="h-56 w-full" />;
  if (items.status === "error") return <ErrorState message={items.error} onRetry={items.reload} />;
  if (list.length === 0) {
    return <EmptyState icon={BookmarkPlus} title="Nothing saved yet" description="Write copy in AI Studio and press Save on the options you like. They are kept here for next time." />;
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <div role="tablist" aria-label="Saved copy" className="no-scrollbar flex gap-2 overflow-x-auto">
        {(["all", ...kinds] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={cn("h-9 flex-none rounded-full px-4 text-sm transition-colors", kind === k ? "chip-on" : "glass-pill text-subtle hover:text-white")}
          >
            {k === "all" ? `All ${list.length}` : LABEL[k]}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {shown.map((item) => (
          <li key={item.id} className="card-violet flex flex-col gap-3 rounded-(--radius-panel) p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-accent-bright">{LABEL[item.contentType] ?? item.contentType}</span>
              <span className="text-[11px] text-muted">{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{item.body}</p>
            <div className="mt-auto flex gap-2">
              <button type="button" onClick={() => copy(item)} className="glass-pill flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-white/90 hover:brightness-125">
                {copied === item.id ? <Check className="size-3.5 text-green" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                {copied === item.id ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={() => remove(item)} aria-label={`Delete saved ${LABEL[item.contentType] ?? "copy"}`} className="glass-pill flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-white/70 hover:text-red-300">
                <Trash2 className="size-3.5" aria-hidden /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
