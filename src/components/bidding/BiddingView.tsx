"use client";

import React, { useState } from "react";
import {
  Award,
  TrendingUp,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  X,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Top10BidSlot, BrandProfile } from "@/types";
import { placeRunwayBid } from "@/lib/api";
import { cn, formatRupee, formatCompactNumber } from "@/lib/utils";

interface BiddingViewProps {
  slots: Top10BidSlot[];
  brand: BrandProfile;
}

export function BiddingView({ slots: initialSlots, brand }: BiddingViewProps) {
  const [slots, setSlots] = useState<Top10BidSlot[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<Top10BidSlot | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [successNotice, setSuccessNotice] = useState<string>("");
  const [errorNotice, setErrorNotice] = useState<string>("");
  const [biddingLoading, setBiddingLoading] = useState(false);

  const winningCount = slots.filter((s) => s.status === "winning").length;

  const handleOpenBidModal = (slot: Top10BidSlot) => {
    setSelectedSlot(slot);
    setBidAmount(String((slot.yourCurrentBid || slot.currentHighestBid) + 2000));
    setSuccessNotice("");
    setErrorNotice("");
  };

  const handleQuickAdd = (inc: number) => {
    setBidAmount((prev) => String((Number(prev) || 0) + inc));
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    const amount = Number(bidAmount);
    if (!amount || amount <= selectedSlot.currentHighestBid) {
      setErrorNotice(
        `Bid amount must exceed current highest bid of ₹${selectedSlot.currentHighestBid.toLocaleString("en-IN")}`
      );
      return;
    }

    setBiddingLoading(true);
    setErrorNotice("");

    try {
      const response = await placeRunwayBid(selectedSlot.rankPosition, amount);
      const updatedSlot = response.slot;

      setSlots((prev) =>
        prev.map((s) =>
          s.rankPosition === selectedSlot.rankPosition ? { ...s, ...updatedSlot } : s
        )
      );

      setSuccessNotice(response.message || `Bid of ₹${amount.toLocaleString("en-IN")} submitted! You are now leading.`);
      setTimeout(() => {
        setSelectedSlot(null);
        setSuccessNotice("");
      }, 1600);
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to submit bid. Please try again.");
    } finally {
      setBiddingLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── 1. Action Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-white tracking-tight">Runway Spotlight Placements</span>
          <span className="text-xs text-muted px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            Active Cycle · 18h remaining
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="text-white font-medium">{winningCount} Active Leading {winningCount === 1 ? "Slot" : "Slots"}</span>
        </div>
      </div>

      {/* ─── 2. Luxury Runway Placement Board ─── */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        
        {/* Table Column Headers */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-white/[0.06] text-[11px] font-mono uppercase tracking-wider text-muted">
          <div className="col-span-4">Runway Spotlight Slot</div>
          <div className="col-span-3">Projected Reach</div>
          <div className="col-span-2">Top Bid</div>
          <div className="col-span-3 text-right">Your Standing & Action</div>
        </div>

        {/* Slot Rows */}
        <div className="divide-y divide-white/[0.05]">
          {slots.map((slot) => {
            const isLeading = slot.status === "winning";
            const isOutbid = slot.status === "outbid";

            return (
              <div
                key={`${slot.rankPosition}-${slot.category}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-5 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                {/* Slot Identity */}
                <div className="col-span-4 flex items-center gap-3.5">
                  <div className="size-9 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center font-mono font-semibold text-xs text-white shrink-0">
                    #{slot.rankPosition}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {slot.title || `${slot.category} Runway Spotlight`}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {slot.category} Runway
                    </div>
                  </div>
                </div>

                {/* Projected Reach */}
                <div className="col-span-3 flex md:flex-col justify-between md:justify-center text-xs">
                  <span className="md:hidden text-muted">Audience:</span>
                  <span className="font-semibold text-white/90">
                    {slot.impressionsEstimate || "3.5M Views / 480K Drapes"}
                  </span>
                  <span className="text-muted text-[11px]">
                    Estimated Showroom Footprint
                  </span>
                </div>

                {/* Top Bid */}
                <div className="col-span-2 flex md:flex-col justify-between md:justify-center text-xs">
                  <span className="md:hidden text-muted">Highest Bid:</span>
                  <span className="font-semibold text-white">
                    {formatRupee(slot.currentHighestBid)}
                  </span>
                  <span className="text-[10px] text-muted font-mono">Current Leader</span>
                </div>

                {/* Standing & Bid CTA */}
                <div className="col-span-3 flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0">
                  {isLeading ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                      <CheckCircle2 className="size-3.5" />
                      <span>Winning ({formatRupee(slot.yourCurrentBid || slot.currentHighestBid)})</span>
                    </span>
                  ) : isOutbid ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                      <AlertTriangle className="size-3.5" />
                      <span>Outbid</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted font-mono">Open</span>
                  )}

                  <button
                    onClick={() => handleOpenBidModal(slot)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                      isLeading
                        ? "bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/[0.08]"
                        : "btn-primary"
                    )}
                  >
                    {isLeading ? "Raise Bid" : "Place Bid"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Bid Modal Sheet ─── */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0c0e22] border border-white/10 p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedSlot(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div>
              <span className="text-[11px] font-mono text-accent-bright uppercase tracking-wider">
                Runway Position #{selectedSlot.rankPosition}
              </span>
              <h3 className="text-base font-semibold text-white mt-0.5">
                {selectedSlot.category}
              </h3>
              <p className="text-xs text-muted mt-1">
                Highest bid currently standing at{" "}
                <span className="text-white font-mono font-medium">
                  {formatRupee(selectedSlot.currentHighestBid)}
                </span>
              </p>
            </div>

            {errorNotice && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {errorNotice}
              </div>
            )}

            {successNotice ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{successNotice}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitBid} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted block">
                    Your Bid (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={selectedSlot.currentHighestBid + 500}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>

                {/* Quick Add Pills */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted font-mono">Quick Add:</span>
                  {[2000, 5000, 10000].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => handleQuickAdd(inc)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-white/80 border border-white/[0.06] transition-colors cursor-pointer"
                    >
                      +{formatRupee(inc)}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={biddingLoading}
                  className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold cursor-pointer active:scale-98 transition-transform flex items-center justify-center gap-2"
                >
                  {biddingLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Submitting Bid to Ledger...</span>
                    </>
                  ) : (
                    <span>Confirm Runway Bid</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
