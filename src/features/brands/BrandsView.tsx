"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search, SearchX, ShieldCheck, Shirt, X } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { useDynamicDiscover } from "@/features/discover/dynamicData";
import { BrandStoreModal } from "./BrandStoreModal";
import { useAuth } from "@/features/auth/AuthProvider";
import { type BrandDetail } from "@/data/discover-shelves";
import { cn } from "@/lib/utils";

const copy = {
  eyebrow: "Brands",
  title: "Every house, on you first",
  blurb: "Step into a brand's store and drape any piece on your own selfie before you buy.",
  all: "All brands",
  search: "Search brands, categories…",
  clearSearch: "Clear search",
  spotlight: "Brand of the month",
  enter: "Open store",
  trySignature: "Try a piece on",
  explore: "Open store",
  looks: (n: number) => `${n} ${n === 1 ? "look" : "looks"}`,
  priceUnknown: "Price at store",
  emptyTitle: "No brands match that",
  emptyBody: "Try another name or category, or reset the filters.",
  reset: "Reset filters",
};

const rupees = (n: number) => (n > 0 ? `₹${n.toLocaleString("en-IN")}` : copy.priceUnknown);

/** "Raw Mango Atelier" → "RM": the crest each plate is stamped with. */
const monogram = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/** Each brand's own colour drives its plate; falls back to the app accent. */
const brandStyle = (brand: BrandDetail) => ({ "--brand": /^#[0-9a-f]{6}$/i.test(brand.themeAccent) ? brand.themeAccent : "#6645eb" }) as CSSProperties;

const drapeHref = (brand: BrandDetail) => {
  const piece = brand.catalog[0];
  return `/drape?image=${encodeURIComponent(piece.images[0])}&garmentUrl=${encodeURIComponent(piece.images[0])}&title=${encodeURIComponent(
    piece.title
  )}&brand=${encodeURIComponent(brand.name)}&category=${encodeURIComponent(piece.category || "")}`;
};

/* ── Maison plate: a tall card that reads like the brand's own lookbook cover ── */
function BrandPlate({ brand, onOpen }: { brand: BrandDetail; onOpen: () => void }) {
  const deck = brand.catalog.slice(0, 3);
  const collections = brand.collections.filter(Boolean).slice(0, 3);

  return (
    <article style={brandStyle(brand)} className="group relative">
      <div
        className={cn(
          "relative overflow-hidden rounded-[26px] bg-[#0b0c22] transition-[transform,box-shadow] duration-300 ease-(--ease-premium)",
          "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_24px_60px_-34px_rgba(0,0,0,0.95)]",
          "md:group-hover:-translate-y-1.5 md:group-hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand)_55%,transparent),0_36px_70px_-30px_color-mix(in_srgb,var(--brand)_55%,transparent)]"
        )}
      >
        <div className="relative aspect-[4/5] w-full">
          <Image
            src={brand.banner}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-(--ease-premium) md:group-hover:scale-[1.04]"
          />
          {/* Dark scrim, then the brand's own colour glowing up from the base. */}
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,2,20,0.35)_0%,rgba(1,2,20,0.05)_30%,rgba(1,2,20,0.55)_60%,rgba(1,2,20,0.96)_100%)]" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_80%_70%_at_50%_110%,color-mix(in_srgb,var(--brand)_45%,transparent),transparent_70%)] opacity-70 transition-opacity duration-300 md:group-hover:opacity-100" />

          <button type="button" onClick={onOpen} aria-label={`Open ${brand.name}`} className="absolute inset-0 rounded-[26px] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent-bright" />

          {/* Crest: the monogram stamped in the brand colour. */}
          <span aria-hidden className="pointer-events-none absolute -right-2 top-1 select-none font-medium leading-none tracking-[-0.08em] text-[112px] text-[color-mix(in_srgb,var(--brand)_70%,white)] opacity-[0.16] mix-blend-screen">
            {monogram(brand.name)}
          </span>

          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2.5">
            <span className="relative size-11 overflow-hidden rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.45)] ring-2 ring-[color-mix(in_srgb,var(--brand)_80%,white)]">
              <Image src={brand.logo} alt="" fill sizes="44px" className="object-contain p-1.5" />
            </span>
            <span className="glass-pill rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] text-white/90">{brand.category}</span>
          </div>

          {/* Lookbook deck: three pieces fanned like cards; the fan opens on hover. */}
          {deck.length > 0 && (
            <div aria-hidden className="pointer-events-none absolute bottom-[132px] right-5 h-[108px] w-[84px] sm:bottom-[140px]">
              {deck.map((item, i) => {
                const mid = (deck.length - 1) / 2;
                const off = i - mid;
                return (
                  <span
                    key={item.id}
                    style={{ ["--r" as string]: `${off * 9}deg`, ["--x" as string]: `${off * 14}px`, zIndex: i }}
                    className="absolute inset-0 origin-bottom overflow-hidden rounded-[10px] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.9)] ring-1 ring-white/25 transition-transform duration-500 ease-(--ease-premium) [transform:translateX(calc(var(--x)*0.5))_rotate(calc(var(--r)*0.5))] md:group-hover:[transform:translateX(var(--x))_rotate(var(--r))_translateY(-6px)]"
                  >
                    <Image src={item.images[0]} alt="" fill sizes="84px" className="object-cover object-top" />
                  </span>
                );
              })}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-5 bottom-5">
            <h3 className="flex items-center gap-1.5 text-[26px] font-medium leading-none tracking-[-0.03em] text-white">
              <span className="truncate">{brand.name}</span>
              {brand.isVerified && <ShieldCheck className="size-[18px] shrink-0 text-[color-mix(in_srgb,var(--brand)_60%,white)]" aria-label="Verified brand" />}
            </h3>
            <p className="mt-2 line-clamp-2 max-w-[85%] text-[13px] leading-snug text-white/70">{brand.tagline || brand.story}</p>
            {collections.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {collections.map((c) => (
                  <li key={c} className="rounded-full bg-[color-mix(in_srgb,var(--brand)_28%,transparent)] px-2.5 py-1 text-[11px] text-white ring-1 ring-[color-mix(in_srgb,var(--brand)_55%,transparent)]">
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* The brand's own announcement as a one-line ticker, in its colour. */}
        {brand.announcementText && (
          <p className="flex items-center gap-2 border-t border-white/8 px-5 py-2.5 text-[12px] text-subtle">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-(--brand) shadow-[0_0_10px_var(--brand)]" />
            <span className="truncate">{brand.announcementText}</span>
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-xs text-muted">{copy.looks(brand.catalog.length)}</span>
        <button type="button" onClick={onOpen} className="flex h-10 items-center gap-1 rounded-full text-sm text-white/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright">
          {copy.explore}
          <ArrowUpRight className="size-4 text-[color-mix(in_srgb,var(--brand)_70%,white)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
}

function BrandsSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-8" aria-busy aria-label="Loading brands">
      <div className="pt-6 sm:pt-10">
        <div className="shimmer h-3 w-20 rounded-full" />
        <div className="shimmer mt-3 h-9 w-[min(360px,80%)] rounded-lg" />
      </div>
      <div className="shimmer mt-7 h-[340px] w-full rounded-[28px] sm:h-[400px]" />
      <div className="no-scrollbar mt-6 flex gap-2 overflow-hidden py-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="shimmer h-9 w-24 flex-none rounded-full" />
        ))}
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="shimmer aspect-[4/5] rounded-[26px]" />
        ))}
      </div>
    </div>
  );
}

export function BrandsView() {
  const { token } = useAuth();
  const { loading, brandsDirectory, biddingWinners } = useDynamicDiscover(token);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(copy.all);
  const [selectedBrand, setSelectedBrand] = useState<BrandDetail | null>(null);

  const featured = brandsDirectory[0];

  const categories = useMemo(() => {
    const set = new Set<string>();
    brandsDirectory.forEach((b) => b.category && set.add(b.category));
    return [copy.all, ...Array.from(set)];
  }, [brandsDirectory]);

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    return brandsDirectory.filter((brand) => {
      const matchesSearch = !q || brand.name.toLowerCase().includes(q) || brand.category.toLowerCase().includes(q) || brand.story.toLowerCase().includes(q);
      const matchesCat = selectedCategory === copy.all || brand.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [brandsDirectory, search, selectedCategory]);

  if (loading) return <BrandsSkeleton />;

  const showSpotlight = !search && selectedCategory === copy.all && featured;

  return (
    <div className="relative min-h-dvh">
      <header className="relative mx-auto max-w-[1280px] px-4 pt-6 sm:px-8 sm:pt-10">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[min(720px,100%)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(214,31,255,0.16),rgba(102,69,235,0.14)_45%,transparent_70%)] blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan">{copy.eyebrow}</p>
            <h1 className="chrome mt-2 text-h2 font-medium">{copy.title}</h1>
            <p className="mt-2 max-w-[460px] text-sm text-muted sm:text-body">{copy.blurb}</p>
          </div>
          <label className="relative block w-full lg:w-[380px]">
            <span className="sr-only">Search brands</span>
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
        </div>
      </header>

      {/* Spotlight: full-bleed banner tinted with the brand's colour, floating pieces on desktop. */}
      {showSpotlight && (
        <Reveal y={24} className="mx-auto mt-7 max-w-[1280px] px-4 sm:px-8">
          <section
            aria-label={copy.spotlight}
            style={brandStyle(featured)}
            className="relative overflow-hidden rounded-[28px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_40px_90px_-40px_color-mix(in_srgb,var(--brand)_70%,transparent)]"
          >
            <Image src={featured.banner} alt="" fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover object-center" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,2,20,0.94)_0%,rgba(1,2,20,0.7)_45%,rgba(1,2,20,0.15)_100%)] max-md:bg-[linear-gradient(180deg,rgba(1,2,20,0.3)_0%,rgba(1,2,20,0.95)_75%)]" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_60%_80%_at_20%_110%,color-mix(in_srgb,var(--brand)_40%,transparent),transparent_70%)]" />
            <span aria-hidden className="pointer-events-none absolute -right-4 -top-6 hidden select-none font-medium leading-none tracking-[-0.08em] text-[220px] text-[color-mix(in_srgb,var(--brand)_70%,white)] opacity-[0.12] mix-blend-screen lg:block">
              {monogram(featured.name)}
            </span>

            <div className="relative flex min-h-[380px] flex-col justify-end gap-8 p-6 sm:min-h-[420px] sm:p-10 lg:flex-row lg:items-end lg:justify-between lg:p-12">
              <div className="max-w-[520px]">
                <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#f6c453]">
                  <span className="size-1.5 rounded-full bg-[#f6c453]" />
                  {copy.spotlight}
                  {biddingWinners[0] ? ` · #${biddingWinners[0].rank}` : ""}
                </span>
                <div className="mt-4 flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-[color-mix(in_srgb,var(--brand)_80%,white)]">
                    <Image src={featured.logo} alt="" fill sizes="48px" className="object-contain p-1.5" />
                  </span>
                  <h2 className="chrome-soft text-h1 font-medium text-balance">{featured.name}</h2>
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-subtle sm:text-body">{featured.story}</p>
                {featured.collections.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {featured.collections.slice(0, 4).map((c) => (
                      <li key={c} className="rounded-full bg-[color-mix(in_srgb,var(--brand)_28%,transparent)] px-2.5 py-1 text-[11px] text-white ring-1 ring-[color-mix(in_srgb,var(--brand)_55%,transparent)]">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => setSelectedBrand(featured)} className="btn-primary h-12 rounded-full px-6 text-sm font-medium transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110">
                    {copy.enter}
                  </button>
                  {featured.catalog[0] && (
                    <Link href={drapeHref(featured)} className="glass-pill flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium text-white transition-[filter] hover:brightness-125">
                      <Shirt className="size-4" />
                      {copy.trySignature}
                    </Link>
                  )}
                </div>
              </div>

              <div className="hidden shrink-0 gap-4 lg:flex">
                {featured.catalog.slice(0, 2).map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedBrand(featured)}
                    aria-label={`Open ${item.title}`}
                    className={cn(
                      "group w-[176px] overflow-hidden rounded-[18px] text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),0_24px_50px_-20px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-(--ease-premium) hover:-translate-y-2",
                      i === 1 && "translate-y-5 hover:translate-y-3"
                    )}
                  >
                    <span className="relative block aspect-[3/4] bg-[#0b0c22]">
                      <Image src={item.images[0]} alt={item.title} fill sizes="176px" className="object-cover object-top" />
                      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(1,2,20,0.92)_100%)]" />
                      <span className="absolute inset-x-3 bottom-2.5 block">
                        <span className="block truncate text-xs font-medium text-white">{item.title}</span>
                        <span className="block text-[11px] text-subtle">{rupees(item.price)}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      <div className="sticky top-(--app-header) z-30 mt-6 border-y border-white/8 bg-canvas/80 backdrop-blur-xl">
        <div role="tablist" aria-label="Filter brands" className="no-scrollbar mx-auto flex max-w-[1280px] snap-x gap-2 overflow-x-auto scroll-px-4 px-4 py-2.5 sm:scroll-px-8 sm:px-8">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "h-9 flex-none snap-start whitespace-nowrap rounded-full px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
                  active ? "chip-on font-medium" : "glass-pill text-subtle hover:text-white"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-[1280px] px-4 pb-10 pt-6 sm:px-8 sm:pt-8">
        {filteredBrands.length === 0 ? (
          <div className="card-violet flex flex-col items-center rounded-(--radius-panel) px-6 py-14 text-center">
            <span className="keycap flex size-14 items-center justify-center rounded-2xl">
              <SearchX className="size-6 text-[#c9bcff]" strokeWidth={1.75} />
            </span>
            <h2 className="chrome-soft mt-5 text-h3 font-medium">{copy.emptyTitle}</h2>
            <p className="mt-2 max-w-[360px] text-sm text-muted">{copy.emptyBody}</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory(copy.all);
              }}
              className="btn-primary mt-7 h-11 rounded-full px-6 text-sm font-medium transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
            >
              {copy.reset}
            </button>
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBrands.map((brand, i) => (
              <Reveal key={brand.id} y={20} delay={(i % 3) * 0.06}>
                <BrandPlate brand={brand} onOpen={() => setSelectedBrand(brand)} />
              </Reveal>
            ))}
          </div>
        )}
      </main>

      {selectedBrand && <BrandStoreModal brand={selectedBrand} onClose={() => setSelectedBrand(null)} />}
    </div>
  );
}
