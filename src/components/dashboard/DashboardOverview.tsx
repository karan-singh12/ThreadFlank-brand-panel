"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  TrendingUp,
  Shirt,
  Eye,
  Bookmark,
  ExternalLink,
  Layers,
  Award,
  Video,
  Rocket,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import type { BrandProfile, MetricSummary, ProductItem, NavTabId } from "@/types";
import { cn, formatRupee, formatCompactNumber } from "@/lib/utils";

interface DashboardOverviewProps {
  brand: BrandProfile;
  metrics: MetricSummary;
  products: ProductItem[];
  onNavigate: (tab: NavTabId) => void;
}

const CITY_HUBS = [
  { city: "Delhi NCR", count: 4820, share: 32 },
  { city: "Mumbai & Pune", count: 4210, share: 28 },
  { city: "Jaipur & Udaipur", count: 2560, share: 17 },
  { city: "Bengaluru & Hyderabad", count: 1980, share: 13 },
  { city: "International (NRI)", count: 1360, share: 10 },
];

export function DashboardOverview({
  brand,
  metrics,
  products,
  onNavigate,
}: DashboardOverviewProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  // Dynamically calculate Occasions from real catalog products
  const occasionMap: Record<string, number> = {};
  products.forEach((p) => {
    (p.occasions || ["Celebration"]).forEach((occ) => {
      occasionMap[occ] = (occasionMap[occ] || 0) + (p.drapesCount || 100);
    });
  });

  const totalOccasionDrapes = Object.values(occasionMap).reduce((a, b) => a + b, 0) || 1;
  const dynamicOccasions = Object.entries(occasionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([occasion, drapes]) => ({
      occasion,
      drapes,
      pct: Math.round((drapes / totalOccasionDrapes) * 100),
    }));

  const tryOnRate = (
    (metrics.totalDrapes.total / (metrics.storeViews.total || 1)) *
    100
  ).toFixed(1);

  const saveRate = (
    (metrics.saves.total / (metrics.totalDrapes.total || 1)) *
    100
  ).toFixed(1);

  const kpis = [
    {
      label: "Virtual Try-Ons",
      value: metrics.totalDrapes.total.toLocaleString(),
      change: `+${metrics.totalDrapes.changePct}%`,
      sub: "Drapes on digital twins",
    },
    {
      label: "Storefront Impressions",
      value: metrics.storeViews.total.toLocaleString(),
      change: `+${metrics.storeViews.changePct}%`,
      sub: "Showroom visitor traffic",
    },
    {
      label: "Wardrobe Saves",
      value: metrics.saves.total.toLocaleString(),
      change: `+${metrics.saves.changePct}%`,
      sub: "Saved to consumer closets",
    },
    {
      label: "Direct Buy Clicks",
      value: metrics.clickOuts.total.toLocaleString(),
      change: `+${metrics.clickOuts.changePct}%`,
      sub: "Redirects to your checkout",
    },
    {
      label: "Try-On Conversion",
      value: `${metrics.conversionRate.total}%`,
      change: `+${metrics.conversionRate.changePct}%`,
      sub: "Draped users who clicked buy",
    },
    {
      label: "Active Catalog Garments",
      value: products.length.toString(),
      change: `${products.filter((p) => p.isDrapeReady).length} Drape Ready`,
      sub: "Inventory in showroom",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── 1. Minimal Inline Status & Filter Bar (No Heavy Box) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-muted">
            Atelier Live Telemetry
          </span>
          <span className="text-white/20">|</span>
          <span className="text-xs text-white/80 font-medium">
            {brand.name}
          </span>
          {brand.verified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-accent-bright bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
              Verified Atelier
            </span>
          )}
        </div>

        {/* Minimal Pill Time Selector */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs self-start sm:self-auto">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer",
                timeRange === r
                  ? "bg-accent/25 text-white font-medium border border-accent/30 shadow-sm"
                  : "text-muted hover:text-white"
              )}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "Quarter"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 2. Metric KPI Cards (Clean Open Grid) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
                {kpi.label}
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-white group-hover:text-accent-bright transition-colors">
                {kpi.value}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.04] mt-3 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-mono font-medium">
                {kpi.change}
              </span>
              <span className="text-muted truncate max-w-[85px] text-right">
                {kpi.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 3. Open Horizontal Conversion Funnel Flow ─── */}
      <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider text-accent-bright font-semibold">
            Try-On to Store Checkout Funnel
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {metrics.conversionRate.total}% End-to-End Conversion
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted">
              1. Discovery Views
            </span>
            <div className="text-lg font-bold text-white font-mono">
              {metrics.storeViews.total.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted">100% Top of Funnel</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted">
              2. Virtual Drapes
            </span>
            <div className="text-lg font-bold text-white font-mono">
              {metrics.totalDrapes.total.toLocaleString()}
            </div>
            <div className="text-[11px] text-accent-bright font-mono">
              {tryOnRate}% Try-On Rate
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted">
              3. Wardrobe Saves
            </span>
            <div className="text-lg font-bold text-white font-mono">
              {metrics.saves.total.toLocaleString()}
            </div>
            <div className="text-[11px] text-violet-300 font-mono">
              {saveRate}% Purchase Intent
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted">
              4. Website Buy Redirects
            </span>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {metrics.clickOuts.total.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono">
              {metrics.conversionRate.total}% Clicked to Buy
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Occasion Intelligence & Top Hubs (Open Split Rows) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occasions */}
        <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-wider text-accent-bright font-semibold flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>Drapes by Occasion Context</span>
            </div>
            <span className="text-[10px] font-mono text-muted">Live Catalog</span>
          </div>

          <div className="space-y-3 pt-1">
            {dynamicOccasions.length > 0 ? (
              dynamicOccasions.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/90 font-medium">{item.occasion}</span>
                    <span className="font-mono text-muted">
                      {item.drapes.toLocaleString()} drapes ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-accent-bright rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted py-4 text-center">
                Add garments with occasion tags to see analytics.
              </div>
            )}
          </div>
        </div>

        {/* City Demand Hubs */}
        <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-wider text-accent-bright font-semibold flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              <span>Consumer Demand by City</span>
            </div>
            <span className="text-[10px] font-mono text-muted">High Buying Intent</span>
          </div>

          <div className="space-y-3 pt-1">
            {CITY_HUBS.map((city, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/90 font-medium">{city.city}</span>
                  <span className="font-mono text-emerald-400">
                    {city.count.toLocaleString()} shoppers ({city.share}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500/60 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${city.share * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 5. Top Draped Pieces (Direct Preview) ─── */}
      <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider text-accent-bright font-semibold flex items-center gap-1.5">
            <Shirt className="size-3.5" />
            <span>Top Performing Garments</span>
          </div>
          <button
            onClick={() => onNavigate("catalog")}
            className="text-xs text-muted hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All ({products.length})</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.05] hover:border-white/15 transition-all group"
            >
              <div className="relative aspect-[3/4] bg-black/40 overflow-hidden">
                <Image
                  src={p.images[0] || "/brand-cover.webp"}
                  alt={p.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400 font-semibold">
                    {formatRupee(p.price)}
                  </span>
                  <span className="text-[10px] font-mono text-white/70 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md">
                    {p.drapesCount} drapes
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-white line-clamp-1">
                  {p.title}
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted mt-1">
                  <span>{p.category}</span>
                  <span className="text-accent-bright font-mono">{p.clicksCount} buy clicks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
