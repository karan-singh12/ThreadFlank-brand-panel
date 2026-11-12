"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Heart, LoaderCircle, MessageCircle, Shirt } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { discoverApi, type ApiBrandPost } from "./api";

const HOUR = 3_600_000;

/** Engagement with a time decay, so a fresh drop with momentum beats last month's hit. */
function score(p: ApiBrandPost) {
  const ageHours = Math.max(1, (Date.now() - new Date(p.publishedAt).getTime()) / HOUR);
  return (p.likesCount + p.commentsCount * 3 + 1) / Math.pow(ageHours + 2, 0.8);
}

/** PRD §3 `/trending`: the brand drops getting the most attention right now. */
export function TrendingView() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<ApiBrandPost[] | null>(null);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    discoverApi.listBrandPosts(token, { limit: 60 }).then((res) => setPosts(res.posts));
  }, [token]);

  const ranked = useMemo(() => [...(posts ?? [])].sort((a, b) => score(b) - score(a)), [posts]);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of ranked.slice(0, 30)) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [ranked]);
  const shown = ranked.filter((p) => category === "All" || p.category === category).slice(0, 24);

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 lg:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="chrome flex items-center gap-2 text-[2rem] font-medium leading-tight tracking-[-0.03em]">
          <Flame className="size-7 text-amber-300" />
          Trending now
        </h1>
        <p className="text-sm text-muted">The drops people are liking, discussing and draping this week.</p>
      </header>

      {categories.length > 0 && (
        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
          {[["All", ranked.length] as [string, number], ...categories].map(([c, n]) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn("h-9 shrink-0 rounded-full border px-4 text-sm", category === c ? "border-transparent chip-on" : "border-white/12 text-subtle hover:text-white")}
            >
              #{c.toLowerCase().replace(/\s+/g, "")} <span className="text-xs opacity-60">{n}</span>
            </button>
          ))}
        </div>
      )}

      {posts === null ? (
        <div className="flex justify-center py-20" role="status" aria-label="Loading">
          <LoaderCircle className="size-6 animate-spin text-accent-bright" />
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">Nothing trending yet — check Discover for the latest drops.</p>
      ) : (
        <ol className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p, i) => {
            const image = p.images?.[0] ?? "";
            return (
              <li key={p.id} className="group overflow-hidden rounded-(--radius-card) border border-white/8 bg-white/[0.02]">
                <div className="relative aspect-[4/5] bg-white/[0.04]">
                  {image && <Photo src={image} alt={p.title ?? p.caption} />}
                  <span className={cn("absolute left-2 top-2 flex size-8 items-center justify-center rounded-full text-sm font-semibold", i < 3 ? "bg-amber-300 text-canvas" : "bg-black/60 text-white")}>{i + 1}</span>
                  <Link
                    href={`/drape?image=${encodeURIComponent(image)}&garmentUrl=${encodeURIComponent(image)}&brand=${encodeURIComponent(p.brand.name)}&title=${encodeURIComponent((p.title || p.caption).slice(0, 50))}`}
                    style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.12)" }}
                    className="btn-primary absolute inset-x-2 bottom-2 flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Shirt className="size-3.5" />
                    Try on your twin
                  </Link>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm text-white">{p.brand.name}</p>
                  <p className="truncate text-xs text-muted">{p.title || p.caption}</p>
                  <p className="mt-1.5 flex gap-3 text-[11px] text-subtle">
                    <span className="flex items-center gap-1">
                      <Heart className="size-3" />
                      {p.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="size-3" />
                      {p.commentsCount}
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
