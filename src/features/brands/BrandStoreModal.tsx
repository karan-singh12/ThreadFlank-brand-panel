"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Shirt,
  ExternalLink,
  ShieldCheck,
  Flame,
  Heart,
  Check,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { type BrandDetail, type BrandCatalogItem } from "@/data/discover-shelves";
import { cn } from "@/lib/utils";

interface BrandStoreModalProps {
  brand: BrandDetail | null;
  onClose: () => void;
  onQuickDrape?: (item: BrandCatalogItem) => void;
}

export function BrandStoreModal({ brand, onClose }: BrandStoreModalProps) {
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedCollection("all");
  }, [brand?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!brand) return null;

  const filteredCatalog =
    selectedCollection === "all"
      ? brand.catalog
      : brand.catalog.filter((c) => c.collection.toLowerCase() === selectedCollection.toLowerCase());

  const toggleLike = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-6xl max-h-[92vh] bg-[#070919] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Minimalist Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95"
          aria-label="Close showroom"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Hero Atelier Header */}
          <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden">
            <Image
              src={brand.banner}
              alt={brand.name}
              fill
              className="object-cover object-center brightness-[0.7] filter"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070919] via-[#070919]/50 to-transparent" />

            {/* Announcement Ribbon */}
            {brand.announcementText && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-medium uppercase tracking-wider border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-bright animate-pulse" />
                <span>{brand.announcementText}</span>
              </div>
            )}

            {/* Atelier Identity Overlay */}
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-8 right-4 sm:right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/15 bg-white p-2 shadow-md shrink-0">
                  <Image src={brand.logo} alt={brand.name} fill className="object-contain p-1" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white tracking-tight">
                      {brand.name}
                    </h2>
                    {brand.isVerified && (
                      <ShieldCheck className="w-5 h-5 text-accent-bright shrink-0" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-subtle max-w-xl line-clamp-2 mt-1 leading-relaxed">
                    {brand.story}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/70">
                    <span className="font-mono">
                      <strong className="text-white">{brand.totalDrapes.toLocaleString()}</strong> Completed Drapes
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      <strong className="text-white">{brand.followersCount.toLocaleString()}</strong> Registered Clients
                    </span>
                  </div>
                </div>
              </div>

              {/* External Atelier Site Button */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] text-white text-xs sm:text-sm font-medium border border-white/15 backdrop-blur-md transition-colors"
                >
                  <span>Official Atelier</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* Collection Pills Bar */}
          <div className="sticky top-0 z-20 flex items-center gap-2 px-4 sm:px-8 py-3 bg-[#070919]/95 backdrop-blur-xl border-y border-white/[0.08] overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase tracking-[0.2em] text-subtle/80 mr-2 font-medium flex items-center gap-1.5 shrink-0">
              <Layers className="w-3.5 h-3.5" /> Collections:
            </span>
            <button
              onClick={() => setSelectedCollection("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap",
                selectedCollection === "all"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-white/[0.03] text-subtle hover:text-white hover:bg-white/[0.07] border border-white/[0.06]"
              )}
            >
              All Items ({brand.catalog.length})
            </button>
            {brand.collections.map((col) => {
              const count = brand.catalog.filter((c) => c.collection.toLowerCase() === col.toLowerCase()).length;
              return (
                <button
                  key={col}
                  onClick={() => setSelectedCollection(col)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap",
                    selectedCollection.toLowerCase() === col.toLowerCase()
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "bg-white/[0.03] text-subtle hover:text-white hover:bg-white/[0.07] border border-white/[0.06]"
                  )}
                >
                  {col} {count > 0 ? `(${count})` : ""}
                </button>
              );
            })}
          </div>

          {/* Catalog Grid */}
          <div className="p-4 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredCatalog.map((item) => {
                const isLiked = likedMap[item.id];
                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col rounded-2xl bg-[#0b0d22] border border-white/[0.07] overflow-hidden hover:border-white/25 transition-all hover:shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700 brightness-[0.92]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        {item.isDrapeReady ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-medium text-white/90 border border-white/10 backdrop-blur-md">
                            <Shirt className="w-2.5 h-2.5 text-accent-bright" /> Drape Ready
                          </span>
                        ) : (
                          <span />
                        )}

                        <button
                          onClick={() => toggleLike(item.id)}
                          className={cn(
                            "p-1.5 rounded-full backdrop-blur-md transition-all shadow",
                            isLiked
                              ? "bg-rose-500/90 text-white"
                              : "bg-black/60 text-white/70 hover:text-white hover:bg-black/80 border border-white/10"
                          )}
                          aria-label="Like garment"
                        >
                          <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                        </button>
                      </div>

                      {/* Fabric / Occasion Pills on Hover */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-black/80 text-[10px] text-white/90 backdrop-blur-md font-mono border border-white/5">
                          {item.fabric}
                        </span>
                        {item.occasions[0] && (
                          <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[10px] text-white backdrop-blur-md font-medium border border-white/10">
                            {item.occasions[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta info & Action Controls */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-medium text-white line-clamp-1 group-hover:text-accent-bright transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-semibold text-white tracking-tight">{item.price > 0 ? `₹${item.price.toLocaleString("en-IN")}` : "Price at store"}</span>
                          {item.originalPrice && (
                            <span className="text-xs text-subtle line-through font-mono">
                              ₹{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-subtle font-mono">
                          <span>{item.drapesCount.toLocaleString()} drapes</span>
                          <span>•</span>
                          <span>{item.stock > 0 ? "In Stock" : "Bespoke Order"}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
                        <Link
                          href={`/drape?image=${encodeURIComponent(item.images[0])}&garmentUrl=${encodeURIComponent(
                            item.images[0]
                          )}&title=${encodeURIComponent(item.title)}&brand=${encodeURIComponent(
                            brand.name
                          )}&category=${encodeURIComponent(item.category || "")}`}
                          onClick={onClose}
                          style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.12)" }}
                          className="btn-primary inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-white text-xs font-semibold transition hover:brightness-110 active:scale-95"
                        >
                          <Shirt className="w-3 h-3" />
                          <span>Drape</span>
                        </Link>
                        <a
                          href={item.buyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white text-xs font-medium transition-colors"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Atelier</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
