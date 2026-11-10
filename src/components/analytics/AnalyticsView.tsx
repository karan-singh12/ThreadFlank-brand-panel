"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Shirt,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { MetricSummary } from "@/types";

const OCCASION_DATA = [
  { occasion: "Shaadi & Reception", drapes: 6420, pct: 43 },
  { occasion: "Cocktail & Red Carpet", drapes: 3280, pct: 22 },
  { occasion: "Mehendi & Haldi", drapes: 2540, pct: 17 },
  { occasion: "Festive Pooja & Diwali", drapes: 1790, pct: 12 },
  { occasion: "Casual Resort", drapes: 900, pct: 6 },
];

const CITY_DEMAND = [
  { city: "Delhi NCR", count: 4820, share: 32 },
  { city: "Mumbai & Pune", count: 4210, share: 28 },
  { city: "Jaipur & Udaipur", count: 2560, share: 17 },
  { city: "Bengaluru & Hyderabad", count: 1980, share: 13 },
  { city: "International (NRI/Global)", count: 1360, share: 10 },
];

export function AnalyticsView({ metrics }: { metrics?: MetricSummary } = {}) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── 1. Header & Time Filter ─── */}
      <section className="card-violet rounded-(--radius-panel) p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono uppercase text-accent-bright">
            <BarChart3 className="size-3.5" />
            <span>Proprietary Avatar Try-On Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Deep Drape & Wardrobe Insights
          </h1>
          <p className="text-sm text-subtle max-w-xl">
            Understand how digital shoppers experience your silhouettes on their personalized twins, which Indian occasions drive demand, and top geographic hubs.
          </p>
        </div>

        {/* Time Selector Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-full border border-white/10 bg-white/[0.03]">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-mono transition-colors",
                timeRange === range
                  ? "chip-on font-semibold"
                  : "text-subtle hover:text-white"
              )}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </section>

      {/* ─── 2. Occasion & Event Demand Breakdown ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-violet rounded-(--radius-panel) p-6 border border-white/8 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="size-4 text-accent-bright" />
              <span>Drapes by Occasion Context</span>
            </h2>
            <p className="text-xs text-subtle mt-0.5">
              Occasions users specifically selected when trying on your catalog pieces.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {OCCASION_DATA.map((item) => (
              <div key={item.occasion} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white">{item.occasion}</span>
                  <span className="font-mono text-muted">
                    {item.drapes.toLocaleString()} drapes ({item.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-bright"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 3. Geographical Reach Hubs ─── */}
        <div className="card-violet rounded-(--radius-panel) p-6 border border-white/8 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="size-4 text-accent-bright" />
              <span>Top Geographic Demand Hubs</span>
            </h2>
            <p className="text-xs text-subtle mt-0.5">
              Cities generating the highest engagement and click-out traffic for your label.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {CITY_DEMAND.map((item) => (
              <div key={item.city} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white">{item.city}</span>
                  <span className="font-mono text-muted">
                    {item.count.toLocaleString()} visits ({item.share}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-accent-bright"
                    style={{ width: `${item.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Try-On to Purchase Conversion Funnel ─── */}
      <section className="card-violet rounded-(--radius-panel) p-6 sm:p-8 border border-white/8 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-white">
            Digital Twin Try-On Funnel
          </h2>
          <p className="text-xs text-subtle mt-0.5">
            Step-by-step conversion from discovery impressions to completed try-ons and brand store click-outs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
            <span className="text-[10px] uppercase font-mono text-muted block">Step 1</span>
            <div className="text-xl font-bold text-white mt-1">38,420</div>
            <div className="text-xs font-medium text-white/90">Storefront Views</div>
            <div className="text-[11px] text-muted mt-2">100% Top of Funnel</div>
          </div>

          <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
            <span className="text-[10px] uppercase font-mono text-muted block">Step 2</span>
            <div className="text-xl font-bold text-white mt-1">14,930</div>
            <div className="text-xs font-medium text-white/90">Avatar Drapes Completed</div>
            <div className="text-[11px] text-emerald-400 mt-2">38.8% Engagement Rate</div>
          </div>

          <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
            <span className="text-[10px] uppercase font-mono text-muted block">Step 3</span>
            <div className="text-xl font-bold text-white mt-1">4,920</div>
            <div className="text-xs font-medium text-white/90">Wishlist & Wardrobe Saves</div>
            <div className="text-[11px] text-accent-bright mt-2">32.9% Intent to Purchase</div>
          </div>

          <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
            <span className="text-[10px] uppercase font-mono text-muted block">Step 4</span>
            <div className="text-xl font-bold text-white mt-1">2,410</div>
            <div className="text-xs font-medium text-white/90">Brand Website Click-Outs</div>
            <div className="text-[11px] text-emerald-400 mt-2">16.1% Net Conversion</div>
          </div>
        </div>
      </section>
    </div>
  );
}
