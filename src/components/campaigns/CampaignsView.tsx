"use client";

import React from "react";
import Image from "next/image";
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Users,
  Shirt,
  ArrowRight,
  Flame,
  Check,
} from "lucide-react";
import type { OccasionCampaign } from "@/types";
import { formatCompactNumber, cn } from "@/lib/utils";

interface CampaignsViewProps {
  campaigns: OccasionCampaign[];
  onToggleEnroll: (campaignId: string) => void;
}

export function CampaignsView({ campaigns, onToggleEnroll }: CampaignsViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-[10px] font-mono uppercase text-accent-bright mb-1">
            <Flame className="size-3 text-amber-400" />
            <span>Festival & Wedding Edits</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Occasion Campaigns & Festive Spotlight</span>
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Opt your pieces into ThreadFlank sitewide festival edits. Enrolled garments appear directly inside consumer AI Occasion Planners.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className={cn(
              "card-violet rounded-2xl overflow-hidden border transition-all flex flex-col justify-between",
              camp.isEnrolled
                ? "border-accent-bright/50 shadow-[0_12px_32px_rgba(102,69,235,0.25)]"
                : "border-white/10 hover:border-white/20"
            )}
          >
            <div className="relative h-44 w-full bg-black/40">
              <Image
                src={camp.banner}
                alt={camp.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090b1e] via-transparent to-black/30" />
              <div className="absolute top-3 left-3">
                <span className="rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono font-semibold text-accent-bright border border-white/15">
                  {camp.occasionType}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-white/90 border border-white/15">
                  {camp.dates}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{camp.name}</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">{camp.description}</p>
              </div>

              <div className="space-y-1.5 py-2 border-y border-white/8 text-xs font-mono">
                <div className="flex items-center justify-between text-muted">
                  <span>Projected Shopper Reach:</span>
                  <span className="text-white font-semibold">
                    {camp.projectedReach}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Enrolled Maisons:</span>
                  <span className="text-white font-semibold">
                    {camp.participatingBrands || 18} Labels
                  </span>
                </div>
              </div>

              <button
                onClick={() => onToggleEnroll(camp.id)}
                className={cn(
                  "w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all",
                  camp.isEnrolled
                    ? "chip-on font-bold shadow-md"
                    : "btn-primary"
                )}
              >
                {camp.isEnrolled ? (
                  <>
                    <Check className="size-4 text-emerald-600" />
                    <span>Enrolled in Campaign</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Opt-In to Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
