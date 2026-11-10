"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Smartphone,
  Monitor,
  Sparkles,
  Save,
  Check,
  Eye,
  Store,
  Layers,
  Palette,
  Megaphone,
  Shirt,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Heart,
  ArrowRight,
} from "lucide-react";
import type { BrandProfile, ProductItem } from "@/types";
import { formatRupee, cn } from "@/lib/utils";

interface StoreBuilderProps {
  brand: BrandProfile;
  products: ProductItem[];
  onUpdateBrand: (updated: Partial<BrandProfile>) => void;
}

const ACCENT_PRESETS = [
  { name: "Royal Violet", hex: "#6342f0" },
  { name: "Imperial Gold", hex: "#eab308" },
  { name: "Emerald Luxe", hex: "#10b981" },
  { name: "Crimson Silk", hex: "#ef4444" },
  { name: "Midnight Sapphire", hex: "#3b82f6" },
];

export function StoreBuilder({ brand, products, onUpdateBrand }: StoreBuilderProps) {
  const [devicePreview, setDevicePreview] = useState<"mobile" | "desktop">("mobile");
  const [savedNotice, setSavedNotice] = useState(false);

  // Local form state
  const [name, setName] = useState(brand.name);
  const [story, setStory] = useState(brand.story);
  const [banner, setBanner] = useState(brand.banner);
  const [announcement, setAnnouncement] = useState(brand.announcementText || "Diwali & Shaadi Edit '26 is now live for 3D Virtual Try-On! Enjoy complimentary styling.");
  const [accent, setAccent] = useState(brand.themeAccent || "#6342f0");

  const handleSave = () => {
    onUpdateBrand({
      name,
      story,
      banner,
      announcementText: announcement,
      themeAccent: accent,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-[10px] font-mono uppercase text-accent-bright mb-1">
            <Sparkles className="size-3" />
            <span>Showroom Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Virtual Flagship Storefront Builder</span>
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure your brand&apos;s 3D showroom as seen on ThreadFlank Discover and mobile app.
          </p>
        </div>

        {/* Controls: Device Preview Toggle & Save Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => setDevicePreview("mobile")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                devicePreview === "mobile"
                  ? "chip-on font-semibold"
                  : "text-muted hover:text-white"
              )}
            >
              <Smartphone className="size-3.5" />
              <span>Mobile View</span>
            </button>
            <button
              onClick={() => setDevicePreview("desktop")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                devicePreview === "desktop"
                  ? "chip-on font-semibold"
                  : "text-muted hover:text-white"
              )}
            >
              <Monitor className="size-3.5" />
              <span>Desktop View</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
          >
            {savedNotice ? <Check className="size-4 text-emerald-400" /> : <Save className="size-4" />}
            <span>{savedNotice ? "Published Live!" : "Save & Publish"}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Customization Rail (Left) vs Interactive Live Preview (Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">

        {/* Left Column: Brand Configuration Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section 1: Hero & Identity */}
          <div className="card-violet rounded-2xl p-5 border border-white/10 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-accent-bright font-semibold flex items-center gap-1.5">
              <Store className="size-3.5" />
              <span>Identity & Hero Banner</span>
            </h2>

            <div>
              <label className="text-[11px] font-medium text-white/80">Brand Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Raw Mango Atelier"
                className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-muted/60 focus:border-accent-bright focus:bg-white/[0.07] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/80">Hero Cover Banner Image URL</label>
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-muted/60 focus:border-accent-bright focus:bg-white/[0.07] outline-none transition-all"
              />
              <span className="text-[10px] text-muted mt-1 block">Recommended: 1920x800px high-fashion editorial photo</span>
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/80">Brand Heritage Story & Bio</label>
              <textarea
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Describe your design ethos, craft origins, and silhouettes..."
                className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.04] p-3 text-xs text-white placeholder:text-muted/60 focus:border-accent-bright focus:bg-white/[0.07] outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Section 2: Announcement Ribbon & Theme Accent */}
          <div className="card-violet rounded-2xl p-5 border border-white/10 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-accent-bright font-semibold flex items-center gap-1.5">
              <Megaphone className="size-3.5" />
              <span>Announcement Ticker & Accent</span>
            </h2>

            <div>
              <label className="text-[11px] font-medium text-white/80">Top Marquee Ticker</label>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="e.g. Diwali & Shaadi Edit '26 is now live..."
                className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-muted/60 focus:border-accent-bright focus:bg-white/[0.07] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/80">Atelier Signature Accent Color</label>
              <div className="mt-2 flex items-center gap-2.5">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setAccent(preset.hex)}
                    style={{ backgroundColor: preset.hex }}
                    className={cn(
                      "size-7 rounded-full border-2 transition-transform cursor-pointer",
                      accent.toLowerCase() === preset.hex.toLowerCase()
                        ? "border-white scale-110 shadow-lg"
                        : "border-transparent opacity-80 hover:opacity-100"
                    )}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Curated Collections Info */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-xs text-muted flex items-start gap-3">
            <Layers className="size-4 text-accent-bright shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Live Catalog Sync:</span>
              <p className="mt-0.5 leading-relaxed">
                Featured garments in your showroom automatically sync with items tagged &quot;Featured&quot; in your Catalog tab.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 px-1">
            <span className="text-[11px] font-mono text-muted flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-time Interactive Canvas Preview
            </span>
            <span className="text-[11px] text-muted font-mono">
              Simulating {devicePreview === "mobile" ? "Mobile Viewport" : "Desktop Viewport"}
            </span>
          </div>

          {/* Device Mock Frame */}
          <div
            className={cn(
              "w-full transition-all duration-300 overflow-hidden",
              devicePreview === "mobile"
                ? "max-w-[420px] rounded-[36px] border-[6px] border-[#1b1c30] shadow-[0_25px_70px_rgba(0,0,0,0.85)] bg-[#070919]"
                : "rounded-3xl border border-white/12 shadow-2xl bg-[#070919]"
            )}
          >
            {/* Phone Speaker Notch (Mobile only) */}
            {devicePreview === "mobile" && (
              <div className="h-5 bg-[#1b1c30] flex items-center justify-center">
                <div className="h-1.5 w-16 rounded-full bg-black/60" />
              </div>
            )}

            {/* Simulated Live Showroom */}
            <div className="relative overflow-y-auto max-h-[640px] custom-scrollbar bg-[#070919]">
              {/* Hero Banner Header */}
              <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                <Image
                  src={banner || brand.banner}
                  alt={name}
                  fill
                  className="object-cover object-center brightness-[0.7]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070919] via-[#070919]/50 to-transparent" />

                {/* Announcement Ticker Ribbon */}
                {announcement && (
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-medium border border-white/15">
                    <span className="size-1.5 rounded-full bg-accent-bright animate-pulse" />
                    <span className="truncate">{announcement}</span>
                  </div>
                )}

                {/* Identity Overlay */}
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-14 rounded-2xl overflow-hidden border border-white/15 bg-white p-1.5 shadow-lg shrink-0">
                      <Image src={brand.logo} alt={name} fill className="object-contain p-0.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-white tracking-tight">{name}</h3>
                        <ShieldCheck className="size-3.5 text-accent-bright" />
                      </div>
                      <p className="text-[10px] text-white/70 line-clamp-1">{brand.tier || "Tier 1"} Atelier</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Showroom Content Body */}
              <div className="p-4 space-y-4">
                {/* Brand Story Bio */}
                <p className="text-xs text-muted leading-relaxed">
                  {story}
                </p>

                {/* Virtual Drape Action Banner */}
                <div
                  style={{ borderColor: `${accent}40` }}
                  className="p-3.5 rounded-2xl border bg-gradient-to-r from-accent/15 to-transparent flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="size-3 text-accent-bright" />
                      <span>Experience Virtual Drape Studio</span>
                    </div>
                    <p className="text-[10px] text-muted mt-0.5">
                      Try on pieces directly on your 3D digital model before purchasing.
                    </p>
                  </div>
                  <button className="btn-primary text-[11px] font-semibold px-3 py-1.5 rounded-lg shrink-0">
                    Drape Now
                  </button>
                </div>

                {/* Featured Garments Shelf */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white">Featured Atelier Pieces</h4>
                    <span className="text-[10px] text-accent-bright font-mono">View All</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {products.slice(0, 4).map((prod) => (
                      <div
                        key={prod.id}
                        className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden group"
                      >
                        <div className="relative aspect-[3/4] w-full bg-black/40 overflow-hidden">
                          <Image
                            src={prod.images[0]}
                            alt={prod.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/80">
                            <Heart className="size-3" />
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="text-[11px] font-medium text-white truncate">
                            {prod.title}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-semibold text-white">
                              {formatRupee(prod.price)}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-400">
                              {prod.fitScore || prod.drapeScore}% Fit
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
