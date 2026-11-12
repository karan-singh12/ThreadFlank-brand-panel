"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Calendar,
  CalendarHeart,
  Film,
  Filter,
  Heart,
  MessageSquareText,
  LoaderCircle,
  Plus,
  Search,
  Shirt,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ActionButton, Notice } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { EventsPanel, NewEventModal } from "@/features/events/EventsView";
import { LookDetail } from "./LookDetail";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type Look } from "@/features/workspace/api";
import { useLooks } from "@/features/workspace/hooks";
import { OCCASIONS } from "@/data/studio-content";
import { cn } from "@/lib/utils";

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <LoaderCircle className="size-8 animate-spin text-accent-bright" />
    </div>
  );
}

const TABS = [
  { id: "looks", label: "Looks", icon: Bookmark },
  { id: "events", label: "Events", icon: CalendarHeart },
] as const;

/** Saved looks and circle events share one page; the tab lives in ?tab= so links can target it. */
export function SavedView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab") === "events" ? "events" : "looks";
  const [creatingEvent, setCreatingEvent] = useState(false);

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-4 sm:px-8 lg:py-6">
      <div className="border-b border-white/8">
        <div role="tablist" aria-label="Saved sections" className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => router.replace(t.id === "looks" ? pathname : `${pathname}?tab=${t.id}`, { scroll: false })}
              className={cn(
                "-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm transition-colors",
                tab === t.id ? "border-accent-bright text-white font-medium" : "border-transparent text-muted hover:text-white"
              )}
            >
              <t.icon className="size-4" strokeWidth={1.75} />
              {t.label}
            </button>
          ))}

          {/* After Event Tab */}
          <button
            type="button"
            onClick={() => setCreatingEvent(true)}
            className="ml-2 flex h-8 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 text-xs font-medium text-subtle transition-colors hover:border-white/25 hover:bg-white/[0.1] hover:text-white"
          >
            <Plus className="size-3.5" />
            <span>New event</span>
          </button>
        </div>
      </div>

      <div className="mt-6">{tab === "events" ? <EventsPanel onCreate={() => setCreatingEvent(true)} /> : <SavedLooks />}</div>

      <NewEventModal open={creatingEvent} onClose={() => setCreatingEvent(false)} />
    </main>
  );
}

function SavedLooks() {
  const { token } = useAuth();
  const { items: looks, setItems, status, error } = useLooks();
  const [selectedOccasion, setSelectedOccasion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [busyLookId, setBusyLookId] = useState<string | null>(null);
  const params = useSearchParams();
  // Notification links point at /saved?look=<id>.
  const [openId, setOpenId] = useState<string | null>(() => params.get("look"));
  const openLook = looks.find((l) => l.id === openId) ?? null;

  const occasionsList = useMemo(() => {
    return [{ id: "all", label: "All Occasions" }, ...OCCASIONS];
  }, []);

  const filteredLooks = useMemo(() => {
    return looks.filter((look) => {
      const matchOccasion =
        selectedOccasion === "all" ||
        look.occasion.toLowerCase() === selectedOccasion.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        look.name.toLowerCase().includes(query) ||
        look.occasion.toLowerCase().includes(query) ||
        (look.pieces && look.pieces.some((p) => p.toLowerCase().includes(query)));
      return matchOccasion && matchSearch;
    });
  }, [looks, selectedOccasion, searchQuery]);

  const handleToggleLike = async (id: string) => {
    if (!token) return;
    setItems((list) =>
      list.map((look) => (look.id === id ? { ...look, liked: !look.liked } : look))
    );
    try {
      await workspaceApi.toggleLookLike(token, id);
    } catch {
      // Revert on error
      setItems((list) =>
        list.map((look) => (look.id === id ? { ...look, liked: !look.liked } : look))
      );
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to remove "${name}" from your saved looks?`)) return;
    setBusyLookId(id);
    try {
      await workspaceApi.removeLook(token, id);
      setItems((list) => list.filter((look) => look.id !== id));
    } finally {
      setBusyLookId(null);
    }
  };

  return (
    <>
      {/* Filter and Search Bar */}
      {looks.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Occasions Pill Carousel */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {occasionsList.map((occ) => {
              const active = selectedOccasion === occ.id;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => setSelectedOccasion(occ.id)}
                  className={cn(
                    "flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "bg-accent-bright text-white shadow-[0_2px_12px_rgba(102,69,235,0.4)]"
                      : "border border-white/10 bg-white/[0.03] text-subtle hover:border-white/20 hover:text-white"
                  )}
                >
                  {occ.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search looks or pieces…"
              className="h-9 w-full rounded-full border border-white/10 bg-white/[0.04] pl-9 pr-8 text-xs text-white placeholder:text-muted focus:border-accent-bright focus:outline-none focus:ring-1 focus:ring-accent-bright"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content State */}
      <div className="mt-6">
        {status === "loading" && <Loading />}

        {status === "error" && (
          <Notice tone="error">{error || "Failed to load saved looks"}</Notice>
        )}

        {status !== "loading" && status !== "error" && looks.length === 0 && (
          <div className="card-violet flex flex-col items-center justify-center rounded-(--radius-panel) border border-white/10 px-6 py-20 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-accent/20 text-accent-bright ring-1 ring-white/10">
              <Bookmark className="size-8" strokeWidth={1.5} />
            </span>
            <h2 className="mt-5 text-xl font-medium text-white">No saved looks yet</h2>
            <p className="mt-2 max-w-md text-sm text-subtle">
              Experiment with virtual drape, mix-and-match your wardrobe pieces, and save your favourite outfit combinations here.
            </p>
            <Link
              href="/drape"
              className="btn-primary mt-6 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium transition-[filter] hover:brightness-110"
            >
              <Shirt className="size-4" />
              Open Drape Studio
            </Link>
          </div>
        )}

        {status !== "loading" &&
          status !== "error" &&
          looks.length > 0 &&
          filteredLooks.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
              <Filter className="size-8 text-muted" />
              <p className="mt-3 text-sm font-medium text-white">No looks match your filter</p>
              <p className="mt-1 text-xs text-subtle">
                Try searching for another keyword or selecting "All Occasions".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedOccasion("all");
                  setSearchQuery("");
                }}
                className="mt-4 rounded-full border border-white/15 px-4 py-1.5 text-xs text-white hover:bg-white/10"
              >
                Reset filters
              </button>
            </div>
          )}

        {/* Looks Grid */}
        {filteredLooks.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredLooks.map((look) => (
              <LookCard
                key={look.id}
                look={look}
                isBusy={busyLookId === look.id}
                onOpen={() => setOpenId(look.id)}
                onToggleLike={() => handleToggleLike(look.id)}
                onRemove={() => handleRemove(look.id, look.name)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={Boolean(openLook)} onClose={() => setOpenId(null)} title={openLook?.name ?? ""} className="sm:max-w-[760px]">
        {openLook && <LookDetail look={openLook} onChange={(next) => setItems((list) => list.map((l) => (l.id === next.id ? { ...l, ...next } : l)))} />}
      </Modal>
    </>
  );
}

function LookCard({
  look,
  isBusy,
  onOpen,
  onToggleLike,
  onRemove,
}: {
  look: Look;
  isBusy: boolean;
  onOpen: () => void;
  onToggleLike: () => void;
  onRemove: () => void;
}) {
  const occasionLabel =
    OCCASIONS.find((o) => o.id === look.occasion)?.label ?? look.occasion;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e24]/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-white/[0.03]">
        <button type="button" onClick={onOpen} aria-label={`Open ${look.name}`} className="absolute inset-0">
          <Photo
            src={look.image}
            alt={look.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </button>
        <span className="pointer-events-none absolute bottom-12 left-2.5 flex gap-1">
          {look.videoUrl && (
            <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
              <Film className="size-3" /> Video
            </span>
          )}
          {look.poseVariants.length > 0 && <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">{look.poseVariants.length + 1} poses</span>}
          {(look.stylistCommentCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-accent-bright/90 px-2 py-0.5 text-[10px] text-white">
              <MessageSquareText className="size-3" /> {look.stylistCommentCount}
            </span>
          )}
        </span>

        {/* Occasion Badge */}
        <span className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
          {occasionLabel}
        </span>

        {/* Quick Like Overlay Button */}
        <button
          type="button"
          onClick={onToggleLike}
          aria-label={look.liked ? "Unlike look" : "Like look"}
          className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              look.liked ? "fill-rose-500 text-rose-500" : "text-white/80"
            )}
          />
        </button>

        {/* Hover Action Overlay: Try on Look */}
        <div className="absolute inset-x-2 bottom-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Link
            href={`/drape?lookImage=${encodeURIComponent(look.image)}`}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-[#0b0b1e]/90 text-xs font-medium text-white shadow-lg backdrop-blur-md transition-colors hover:bg-accent"
          >
            <Shirt className="size-3.5" />
            Try On In Studio
          </Link>
        </div>
      </div>

      {/* Info Content */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <h2 className="truncate text-sm font-semibold text-white group-hover:text-accent-bright transition-colors">
            {look.name}
          </h2>
          {look.pieces && look.pieces.length > 0 ? (
            <p className="mt-1 line-clamp-1 text-xs text-subtle">
              {look.pieces.join(" · ")}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">Complete Outfit</p>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-2.5">
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <Calendar className="size-3" />
            {look.createdAt
              ? new Date(look.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "Saved"}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRemove}
              disabled={isBusy}
              aria-label={`Delete ${look.name}`}
              className="flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/15 hover:text-red-400"
            >
              {isBusy ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
