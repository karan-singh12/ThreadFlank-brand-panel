"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Shirt,
  ExternalLink,
  ShieldCheck,
  Heart,
  Share2,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { type ShelfOutfit } from "@/data/discover-shelves";
import { cn } from "@/lib/utils";

interface OutfitQuickModalProps {
  outfit: ShelfOutfit | null;
  onClose: () => void;
}

export function OutfitQuickModal({ outfit, onClose }: OutfitQuickModalProps) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLiked(false);
    setCopied(false);
  }, [outfit?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!outfit) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${outfit.title} — Threadflank`,
          text: `Check out ${outfit.title} by ${outfit.brandName} on Threadflank!`,
          url: window.location.href,
        });
        return;
      } catch {
        // Ignored
      }
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col md:flex-row w-full max-w-3xl max-h-[90vh] bg-[#0c0d1e] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Visual Preview */}
        <div className="relative w-full md:w-1/2 h-72 sm:h-96 md:h-auto min-h-[320px] bg-black/60 overflow-hidden">
          <Image
            src={outfit.imageUrl}
            alt={outfit.title}
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d1e] via-transparent to-transparent md:hidden" />

          {outfit.rank && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-black/80 text-white border border-white/20 backdrop-blur-md">
                Rank #{outfit.rank}
              </span>
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Drape Ready</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[11px] text-white/80 font-mono">
              {outfit.drapesCount.toLocaleString()} drapes
            </span>
          </div>
        </div>

        {/* Details & Actions */}
        <div className="flex-1 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Brand Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/15 bg-white p-1 shrink-0">
                  <Image src={outfit.brandLogo} alt={outfit.brandName} fill className="object-contain p-0.5" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {outfit.brandName}
                </span>
                {outfit.isVerified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-bright" />
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLiked(!liked)}
                  className={cn(
                    "p-2 rounded-full border border-white/10 transition-colors",
                    liked ? "bg-rose-500/20 text-rose-400 border-rose-500/40" : "bg-white/5 text-subtle hover:text-white"
                  )}
                  title="Like"
                >
                  <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full border border-white/10 bg-white/5 text-subtle hover:text-white transition-colors"
                  title="Share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Title & Price */}
            <div className="mt-4">
              <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug">
                {outfit.title}
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">
                  {outfit.price > 0 ? `₹${outfit.price.toLocaleString("en-IN")}` : "Price at store"}
                </span>
                {outfit.originalPrice && (
                  <span className="text-xs text-subtle line-through font-mono">
                    ₹{outfit.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Fabric & Occasion */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] uppercase text-subtle block font-semibold">Fabric</span>
                <span className="text-white font-medium">{outfit.fabric || "Brocade Silk"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] uppercase text-subtle block font-semibold">Occasion</span>
                <span className="text-white font-medium">{outfit.occasion || "Celebration"}</span>
              </div>
            </div>

            {/* Detailed Look Description */}
            <div className="mt-3 p-3 rounded-xl border border-white/8 bg-white/[0.02]">
              <span className="text-[10px] uppercase tracking-wider text-muted block font-semibold mb-1">
                Outfit Overview
              </span>
              <p className="text-xs text-subtle leading-relaxed">
                Curated {outfit.category || "runway"} design from {outfit.brandName}. Structured tailoring with premium {outfit.fabric || "finish"} suited for {outfit.occasion || "any special event"}. Tap Drape to virtually try it on your twin instantly.
              </p>
            </div>

            {copied && (
              <p className="mt-2 text-center text-xs text-emerald-400">
                Link copied to clipboard
              </p>
            )}
          </div>

          {/* Action CTAs */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2.5">
            <Link
              href={`/drape?image=${encodeURIComponent(outfit.imageUrl)}&garmentUrl=${encodeURIComponent(
                outfit.imageUrl
              )}&title=${encodeURIComponent(outfit.title)}&brand=${encodeURIComponent(
                outfit.brandName
              )}&category=${encodeURIComponent(outfit.category || "")}`}
              onClick={onClose}
              style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.12)" }}
              className="btn-primary flex-1 h-11 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-95"
            >
              <Shirt className="w-4 h-4" />
              <span>Drape on My Twin</span>
            </Link>

            <a
              href={outfit.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Buy</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
