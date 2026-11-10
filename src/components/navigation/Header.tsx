"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Layers,
  Video,
  Rocket,
  Award,
  Globe,
  MapPin,
  X,
  Check,
  Save,
  Building2,
  ChevronRight,
} from "lucide-react";
import type { NavTabId, BrandProfile } from "@/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  brand: BrandProfile;
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onUpdateBrand: (updated: Partial<BrandProfile>) => void;
}

// Exactly 5 clean navigation tabs — zero dropdowns
const NAV_TABS: { id: NavTabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "catalog", label: "Catalog", icon: Layers },
  { id: "ai-studio", label: "AI Studio", icon: Video },
  { id: "drops", label: "Drops", icon: Rocket },
  { id: "bidding", label: "Bidding", icon: Award },
];

export function Header({ brand, activeTab, onTabChange, onUpdateBrand }: HeaderProps) {
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  // Profile / Store form local state
  const [name, setName] = useState(brand.name);
  const [story, setStory] = useState(brand.story);
  const [banner, setBanner] = useState(brand.banner);
  const [websiteUrl, setWebsiteUrl] = useState(brand.websiteUrl || "https://rawmango.com");
  const [isOnlineOnly, setIsOnlineOnly] = useState(brand.isOnlineOnly ?? true);
  const [physicalStoreAddress, setPhysicalStoreAddress] = useState(brand.physicalStoreAddress || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBrand({
      name,
      story,
      banner,
      websiteUrl,
      isOnlineOnly,
      physicalStoreAddress,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/8 bg-canvas/90 backdrop-blur-2xl transition-colors">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          
          {/* Left: Brand Identity (Seamless Emblem without white square) */}
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative size-9 overflow-hidden rounded-[28%] ring-1 ring-white/15 transition-transform group-hover:scale-105">
                <Image
                  src="/logo-emblem.webp"
                  alt="ThreadFlank"
                  fill
                  className="object-cover select-none"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold tracking-tight text-white leading-none">
                  Thread<span className="text-[#7c5cff]">Flank</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-accent-bright font-medium mt-0.5">
                  Brand Atelier
                </span>
              </div>
            </Link>
          </div>

          {/* Center: EXACTLY 5 TABS (Pure Pills · No Dropdowns) */}
          <nav
            aria-label="Primary Brand Navigation"
            className="hidden md:flex h-11 items-center gap-1 rounded-full border border-white/12 bg-[#08091a]/90 px-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition-all duration-150 cursor-pointer",
                    active
                      ? "chip-on font-semibold shadow-sm"
                      : "text-subtle hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={active ? 2.25 : 1.75} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Credits Badge & Single Profile Avatar Button */}
          <div className="flex items-center gap-3">
            {/* AI Credits (Clean typography, zero emoji) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/8 bg-white/[0.03] text-xs font-mono">
              <span className="font-semibold text-white">{brand.aiCredits}</span>
              <span className="text-muted text-[11px]">Credits</span>
            </div>

            {/* Profile Avatar Button ONLY (Click to open Drawer) */}
            <button
              onClick={() => setProfileSheetOpen(true)}
              title={`${brand.name} · Profile & Store Settings`}
              aria-label="Brand Profile & Store Settings"
              className="relative size-9 rounded-full ring-1 ring-white/15 hover:ring-accent-bright transition-all overflow-hidden flex items-center justify-center bg-white/[0.05] cursor-pointer group shrink-0"
            >
              <Image
                src={brand.logo}
                alt={brand.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </button>
          </div>

        </div>
      </header>

      {/* ─── Right-Side Slide-Over: Brand Profile & Store Setup Sheet ─── */}
      {profileSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fade-in"
          onClick={() => setProfileSheetOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-[#08091a] border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden animate-rise-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative size-10 rounded-full overflow-hidden ring-1 ring-white/15 bg-white/[0.05] shrink-0">
                  <Image src={brand.logo} alt={brand.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">{brand.name}</h3>
                  <p className="text-[11px] text-muted font-mono">Store Profile & Operating Details</p>
                </div>
              </div>

              <button
                onClick={() => setProfileSheetOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
                aria-label="Close Profile Drawer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
              
              {/* Brand Profile Section */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-accent-bright font-semibold">
                  Brand Identity
                </div>

                <div>
                  <label className="text-xs text-white/80 font-medium">Brand Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/80 font-medium">Brand Story / Bio</label>
                  <textarea
                    rows={3}
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/80 font-medium">Hero Banner Image URL</label>
                  <input
                    type="text"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright"
                  />
                </div>
              </div>

              {/* Store & Direct Buy Setup Section */}
              <div className="space-y-3 pt-3 border-t border-white/8">
                <div className="text-[10px] font-mono uppercase tracking-wider text-accent-bright font-semibold">
                  Store & Website Setup
                </div>

                <div>
                  <label className="text-xs text-white/80 font-medium flex items-center gap-1.5">
                    <Globe className="size-3 text-accent-bright" />
                    <span>D2C Website / Checkout URL</span>
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourbrand.com"
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright font-mono"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    When shoppers click Buy Now, they redirect to this website.
                  </p>
                </div>

                {/* Online-only vs Flagship Store Toggle */}
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80 font-medium">Store Type</span>
                    <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/8">
                      <button
                        type="button"
                        onClick={() => setIsOnlineOnly(true)}
                        className={cn(
                          "px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer",
                          isOnlineOnly ? "bg-white text-black font-semibold" : "text-muted hover:text-white"
                        )}
                      >
                        Online Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsOnlineOnly(false)}
                        className={cn(
                          "px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer",
                          !isOnlineOnly ? "bg-white text-black font-semibold" : "text-muted hover:text-white"
                        )}
                      >
                        Flagship Store
                      </button>
                    </div>
                  </div>

                  {!isOnlineOnly && (
                    <div>
                      <label className="text-[11px] text-white/70 font-medium flex items-center gap-1">
                        <MapPin className="size-3 text-accent-bright" />
                        <span>Physical Flagship Boutique Address</span>
                      </label>
                      <input
                        type="text"
                        value={physicalStoreAddress}
                        onChange={(e) => setPhysicalStoreAddress(e.target.value)}
                        placeholder="e.g. 31 Lodhi Colony Market, New Delhi"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-accent-bright"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Atelier Standing Summary */}
              <div className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase text-muted">Platform Rank</div>
                  <div className="text-xs font-semibold text-white">#6 · Top 3% of 240 Brands</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase text-muted">Virtual Try-Ons</div>
                  <div className="text-xs font-semibold text-emerald-400 font-mono">14,930 drapes</div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-transform"
              >
                {savedSuccess ? (
                  <>
                    <Check className="size-4 text-emerald-300" />
                    <span>Saved Successfully</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save Brand & Store Changes</span>
                  </>
                )}
              </button>
            </form>

            {/* Drawer Footer Links */}
            <div className="p-4 border-t border-white/8 bg-[#060714] flex items-center justify-between text-[11px]">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-accent-bright hover:underline flex items-center gap-1"
              >
                <span>Visit Store Website</span>
                <ChevronRight className="size-3" />
              </a>
              <span className="text-muted font-mono">Tier 1 Atelier</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
