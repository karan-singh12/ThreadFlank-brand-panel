"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Search, SearchX, ShieldCheck, Shirt, X } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { type BrandDetail, type ShelfOutfit } from "@/data/discover-shelves";
import { BrandStoreModal } from "@/features/brands/BrandStoreModal";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { useDynamicDiscover } from "./dynamicData";
import { OutfitQuickModal } from "./OutfitQuickModal";

const copy = {
  eyebrow: "Discover",
  title: "Fresh drops, on you first",
  blurb: "Every look here is one tap from a drape on your own selfie.",
  search: "Search outfits, brands, fabrics…",
  clearSearch: "Clear search",
  promoted: "Promoted brands",
  allBrands: "All brands",
  tryOn: "Try on",
  priceUnknown: "Price at store",
  emptyTitle: "Nothing matches that yet",
  emptyBody: "Try another word, or clear the filters to see every shelf.",
  clearFilters: "Clear filters",
  prev: "Scroll back",
  next: "Scroll forward",
};

const rupees = (n: number) => (n > 0 ? `₹${n.toLocaleString("en-IN")}` : copy.priceUnknown);

const drapeHref = (o: ShelfOutfit) =>
  `/drape?image=${encodeURIComponent(o.imageUrl)}&garmentUrl=${encodeURIComponent(o.imageUrl)}&title=${encodeURIComponent(
    o.title
  )}&brand=${encodeURIComponent(o.brandName)}&category=${encodeURIComponent(o.category || "")}`;

/* ── Outfit card: photo first, rank numeral for ranked shelves, "Try on" reachable on touch ── */
function OutfitCard({ outfit, onOpen }: { outfit: ShelfOutfit; onOpen: () => void }) {
  const ranked = typeof outfit.rank === "number";
  const podium = ranked && outfit.rank! <= 3;

  return (
    <article className="group relative w-[172px] flex-none snap-start sm:w-[204px] md:w-[236px]">
      <div
        className={cn(
          "relative overflow-hidden rounded-[18px] transition-transform duration-300 ease-(--ease-premium) md:group-hover:-translate-y-1.5",
          "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_20px_50px_-30px_rgba(0,0,0,0.9)] md:group-hover:shadow-[inset_0_0_0_1px_rgba(171,154,255,0.45),0_30px_60px_-24px_rgba(102,69,235,0.55)]"
        )}
      >
        <div className="relative aspect-[3/4] w-full bg-[#0b0c22]">
          <Image
            src={outfit.imageUrl}
            alt={`${outfit.title} by ${outfit.brandName}`}
            fill
            sizes="(min-width: 768px) 236px, (min-width: 640px) 204px, 172px"
            className="object-cover object-top transition-transform duration-500 ease-(--ease-premium) md:group-hover:scale-[1.04]"
          />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,2,20,0.25)_0%,transparent_30%,transparent_55%,rgba(1,2,20,0.92)_100%)]" />

          {/* Whole card opens the quick view; the Try on link sits above it. */}
          <button type="button" onClick={onOpen} aria-label={`Open ${outfit.title}`} className="absolute inset-0 rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent-bright" />

          {ranked ? (
            <span
              aria-label={`Rank ${outfit.rank}`}
              className={cn(
                "pointer-events-none absolute bottom-2.5 left-3 font-medium leading-none tracking-[-0.06em] tabular-nums drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]",
                "text-[40px] md:text-[48px]",
                podium ? "text-[#f6c453]" : "text-white"
              )}
            >
              {String(outfit.rank).padStart(2, "0")}
            </span>
          ) : outfit.fabric ? (
            <span className="glass-pill pointer-events-none absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] text-white/90">{outfit.fabric}</span>
          ) : null}

          <Link
            href={drapeHref(outfit)}
            aria-label={`${copy.tryOn}: ${outfit.title}`}
            className={cn(
              "btn-primary absolute bottom-2.5 right-2.5 z-10 flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-[opacity,transform] duration-200",
              "md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100"
            )}
          >
            <Shirt className="size-3.5" strokeWidth={2} />
            {copy.tryOn}
          </Link>
        </div>
      </div>

      <div className="px-1 pt-3">
        <p className="flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-muted">
          <span className="truncate">{outfit.brandName}</span>
          {outfit.isVerified && <ShieldCheck className="size-3 shrink-0 text-accent-bright" aria-label="Verified brand" />}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm leading-snug text-white">{outfit.title}</h3>
        <p className={cn("mt-1.5 text-sm", outfit.price > 0 ? "font-medium text-ink-soft" : "text-muted")}>{rupees(outfit.price)}</p>
      </div>
    </article>
  );
}

/* ── A shelf: heading, optional badge, snap-scrolling track with desktop arrows ── */
function ShelfRow({ id, title, subtitle, badge, items, onSelectOutfit }: { id: string; title: string; subtitle?: string; badge?: string; items: ShelfOutfit[]; onSelectOutfit: (o: ShelfOutfit) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const check = () => {
    const el = track.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };
  useEffect(check, [items]);

  const scroll = (dir: -1 | 1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <Reveal y={24}>
      <section id={id} aria-labelledby={`${id}-title`} className="py-6 sm:py-8">
        <div className="mb-4 flex items-end justify-between gap-4 px-4 sm:px-8">
          <div className="min-w-0">
            {badge && <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-cyan">{badge}</p>}
            <h2 id={`${id}-title`} className="chrome-soft text-h3 font-medium tracking-[-0.02em] text-balance">
              {title}
            </h2>
            {subtitle && <p className="mt-1 hidden max-w-[560px] text-sm text-muted sm:block">{subtitle}</p>}
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            {([-1, 1] as const).map((dir) => {
              const enabled = dir < 0 ? canLeft : canRight;
              const Icon = dir < 0 ? ChevronLeft : ChevronRight;
              return (
                <button
                  key={dir}
                  type="button"
                  onClick={() => scroll(dir)}
                  disabled={!enabled}
                  aria-label={dir < 0 ? copy.prev : copy.next}
                  className="glass-pill flex size-11 items-center justify-center rounded-full text-white transition-opacity hover:brightness-125 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright"
                >
                  <Icon className="size-4" strokeWidth={2} />
                </button>
              );
            })}
          </div>
        </div>

        <div
          ref={track}
          onScroll={check}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 pt-1 sm:scroll-px-8 sm:gap-4 sm:px-8"
        >
          {items.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} onOpen={() => onSelectOutfit(outfit)} />
          ))}
        </div>
      </section>
    </Reveal>
  );
}

/* ── Skeleton with a light sweep while the feed loads ── */
function DiscoverSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px]" aria-busy aria-label="Loading Discover">
      <div className="px-4 pt-6 sm:px-8">
        <div className="shimmer h-3 w-20 rounded-full" />
        <div className="shimmer mt-3 h-9 w-[min(360px,80%)] rounded-lg" />
        <div className="shimmer mt-5 h-12 w-full max-w-[560px] rounded-full" />
      </div>
      <div className="no-scrollbar mt-7 flex gap-5 overflow-hidden px-4 sm:px-8">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-none flex-col items-center gap-2">
            <div className="shimmer size-16 rounded-full" />
            <div className="shimmer h-2.5 w-14 rounded-full" />
          </div>
        ))}
      </div>
      <div className="no-scrollbar mt-6 flex gap-2 overflow-hidden border-y border-white/8 px-4 py-3 sm:px-8">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="shimmer h-9 w-24 flex-none rounded-full" />
        ))}
      </div>
      {Array.from({ length: 2 }, (_, s) => (
        <div key={s} className="py-8">
          <div className="shimmer mx-4 h-6 w-64 rounded-md sm:mx-8" />
          <div className="no-scrollbar mt-5 flex gap-3 overflow-hidden px-4 sm:gap-4 sm:px-8">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="w-[172px] flex-none sm:w-[204px] md:w-[236px]">
                <div className="shimmer aspect-[3/4] rounded-[18px]" />
                <div className="shimmer mt-3 h-2.5 w-16 rounded-full" />
                <div className="shimmer mt-2 h-3.5 w-3/4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscoverView() {
  const { token } = useAuth();
  const { loading, biddingWinners, brandsDirectory, shelves, categories } = useDynamicDiscover(token);

  const [selectedOutfit, setSelectedOutfit] = useState<ShelfOutfit | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandDetail | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredShelves = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shelves.filter((shelf) => {
      const matchesTab = activeCategory === "all" || shelf.category === activeCategory;
      const matchesSearch =
        !q || shelf.title.toLowerCase().includes(q) || shelf.items.some((i) => i.title.toLowerCase().includes(q) || i.brandName.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [shelves, activeCategory, search]);

  const openBrand = (brand: (typeof biddingWinners)[number]) => {
    const match = brandsDirectory.find((b) => b.id === brand.id || b.slug === brand.slug);
    setSelectedBrand(
      match ?? {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        banner: brand.banner,
        story: brand.tagline,
        category: "Atelier",
        isVerified: true,
        followersCount: brand.followersCount,
        totalDrapes: brand.monthlyScore,
        themeAccent: "#7f62f6",
        websiteUrl: `https://${brand.slug}.com`,
        collections: ["All Collections"],
        catalog: [
          {
            id: brand.heroOutfit.id,
            title: brand.heroOutfit.title,
            sku: `SKU-${brand.id}`,
            price: brand.heroOutfit.price,
            images: [brand.heroOutfit.imageUrl],
            category: "Runway",
            occasions: ["Celebration", "Runway"],
            colors: ["Midnight", "Gold"],
            sizes: ["S", "M", "L"],
            fabric: "Fine Silk",
            stock: 10,
            drapesCount: brand.heroOutfit.drapes,
            likesCount: 300,
            isDrapeReady: true,
            buyUrl: `https://${brand.slug}.com`,
            collection: "Signature",
          },
        ],
      }
    );
  };

  if (loading) return <DiscoverSkeleton />;

  const searchField = (
    <label className="relative block w-full">
      <span className="sr-only">Search</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={copy.search}
        className="glass-pill h-12 w-full rounded-full pl-11 pr-11 text-sm text-white placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright/70 [&::-webkit-search-cancel-button]:hidden"
      />
      {search && (
        <button type="button" onClick={() => setSearch("")} aria-label={copy.clearSearch} className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-white">
          <X className="size-4" />
        </button>
      )}
    </label>
  );

  return (
    <div className="relative min-h-dvh">
      {/* Header: editorial title with the search beside it on desktop. */}
      <header className="relative mx-auto max-w-[1280px] px-4 pt-6 sm:px-8 sm:pt-10">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[min(720px,100%)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(214,31,255,0.16),rgba(102,69,235,0.14)_45%,transparent_70%)] blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan">{copy.eyebrow}</p>
            <h1 className="chrome mt-2 text-h2 font-medium">{copy.title}</h1>
            <p className="mt-2 max-w-[460px] text-sm text-muted sm:text-body">{copy.blurb}</p>
          </div>
          <div className="w-full lg:w-[380px]">{searchField}</div>
        </div>
      </header>

      {/* Promoted brands: story rings. Only partner data the API returns (or the demo set) shows here. */}
      {biddingWinners.length > 0 && (
        <section aria-label={copy.promoted} className="mx-auto mt-7 max-w-[1280px]">
          <div className="mb-3 flex items-center justify-between px-4 sm:px-8">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">{copy.promoted}</h2>
            <Link href="/brands" className="group flex h-9 items-center gap-1 rounded-full px-2 text-xs text-accent-bright transition-colors hover:text-white">
              {copy.allBrands}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="no-scrollbar fade-x flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 pb-1 sm:scroll-px-8 sm:gap-6 sm:px-8">
            {biddingWinners.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => openBrand(brand)}
                aria-label={`${brand.name}, rank ${brand.rank}`}
                className="group flex w-[76px] flex-none snap-start flex-col items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright sm:w-[88px]"
              >
                <span className="relative rounded-full bg-[conic-gradient(from_200deg,#6645eb,#d61fff,#f6c453,#6645eb)] p-[2px] transition-transform duration-300 ease-(--ease-premium) group-hover:scale-105">
                  <span className="relative block size-[62px] overflow-hidden rounded-full border-[3px] border-canvas bg-white sm:size-[70px]">
                    <Image src={brand.logo} alt="" fill sizes="70px" className="object-contain p-2.5" />
                  </span>
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-canvas px-1.5 py-px text-[10px] font-medium tabular-nums text-[#f6c453] ring-1 ring-white/15">
                    {String(brand.rank).padStart(2, "0")}
                  </span>
                </span>
                <span className="w-full truncate text-center text-[11px] text-subtle transition-colors group-hover:text-white sm:text-xs">{brand.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sticky filter chips under the app header. */}
      <div className="sticky top-(--app-header) z-30 mt-5 border-y border-white/8 bg-canvas/80 backdrop-blur-xl">
        <div role="tablist" aria-label="Filter shelves" className="no-scrollbar mx-auto flex max-w-[1280px] snap-x gap-2 overflow-x-auto scroll-px-4 px-4 py-2.5 sm:scroll-px-8 sm:px-8">
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "h-9 flex-none snap-start whitespace-nowrap rounded-full px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
                  active ? "chip-on font-medium" : "glass-pill text-subtle hover:text-white"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-[1280px] pb-10 pt-2">
        {filteredShelves.length === 0 ? (
          <div className="card-violet mx-4 mt-8 flex flex-col items-center rounded-(--radius-panel) px-6 py-14 text-center sm:mx-8">
            <span className="keycap flex size-14 items-center justify-center rounded-2xl">
              <SearchX className="size-6 text-[#c9bcff]" strokeWidth={1.75} />
            </span>
            <h2 className="chrome-soft mt-5 text-h3 font-medium">{copy.emptyTitle}</h2>
            <p className="mt-2 max-w-[360px] text-sm text-muted">{copy.emptyBody}</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
              className="btn-primary mt-7 h-11 rounded-full px-6 text-sm font-medium transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
            >
              {copy.clearFilters}
            </button>
          </div>
        ) : (
          filteredShelves.map((shelf) => (
            <ShelfRow key={shelf.id} id={shelf.id} title={shelf.title} subtitle={shelf.subtitle} badge={shelf.badge} items={shelf.items} onSelectOutfit={setSelectedOutfit} />
          ))
        )}
      </main>

      {selectedOutfit && <OutfitQuickModal outfit={selectedOutfit} onClose={() => setSelectedOutfit(null)} />}
      {selectedBrand && <BrandStoreModal brand={selectedBrand} onClose={() => setSelectedBrand(null)} />}
    </div>
  );
}
