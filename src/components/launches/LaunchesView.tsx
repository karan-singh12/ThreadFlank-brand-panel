"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Rocket,
  Clock,
  Users,
  Plus,
  X,
  Calendar,
  Loader2,
} from "lucide-react";
import type { LaunchDrop } from "@/types";
import { formatCompactNumber, cn } from "@/lib/utils";
import { createDrop } from "@/lib/api";

interface LaunchesViewProps {
  launches: LaunchDrop[];
  onAddLaunch?: (drop: LaunchDrop) => void;
}

export function LaunchesView({ launches: initialLaunches, onAddLaunch }: LaunchesViewProps) {
  const [launches, setLaunches] = useState<LaunchDrop[]>(initialLaunches);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [productsCount, setProductsCount] = useState("6");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !collectionName) return;

    setLoading(true);
    try {
      const drop = await createDrop({
        title,
        collectionName,
        description,
        launchDate: launchDate ? new Date(launchDate).toISOString() : new Date(Date.now() + 86400000 * 3).toISOString(),
        bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80",
        productsCount: Number(productsCount) || 1,
      });

      setLaunches((prev) => [drop, ...prev]);
      if (onAddLaunch) onAddLaunch(drop);

      setShowModal(false);
      setTitle("");
      setCollectionName("");
      setDescription("");
      setLaunchDate("");
      setBannerUrl("");
    } catch (err: any) {
      alert(err.message || "Failed to schedule drop.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Action Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-white tracking-tight">Drops & Releases</span>
          <span className="text-xs text-muted px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            {launches.length} Collections
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>Schedule New Drop</span>
        </button>
      </div>

      {/* ─── Drops Grid ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {launches.map((drop) => {
          const isLive = drop.status === "live";

          return (
            <div
              key={drop.id}
              className="rounded-2xl overflow-hidden bg-[#090b1e]/80 border border-white/[0.06] hover:border-white/15 transition-all flex flex-col justify-between"
            >
              <div className="relative h-56 w-full bg-black/40">
                <Image
                  src={drop.bannerUrl}
                  alt={drop.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090b1e] via-transparent to-black/30" />
                
                <div className="absolute top-3 left-3">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-[10px] font-semibold text-white">
                      <span className="size-1.5 rounded-full bg-white animate-pulse" />
                      Live in Showroom
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-semibold text-accent-bright border border-white/10">
                      <Clock className="size-3" />
                      Starts in {drop.countdownDays || 2} Days
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-accent-bright block">
                    {drop.collectionName}
                  </span>
                  <h3 className="text-lg font-semibold text-white mt-0.5 drop-shadow">
                    {drop.title}
                  </h3>
                </div>
              </div>

              <div className="p-5 flex items-center justify-between text-xs border-t border-white/[0.04]">
                <div className="flex items-center gap-4 text-muted">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-white/60" />
                    <span className="font-mono text-white/90">{formatCompactNumber(drop.waitlistCount)}</span> on Waitlist
                  </span>
                  <span>·</span>
                  <span>{drop.productsCount} Garments</span>
                </div>

                <span className="text-[11px] font-mono text-muted">
                  {new Date(drop.launchDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Schedule Drop Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0c0e22] border border-white/10 p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div>
              <h3 className="text-base font-semibold text-white">Schedule New Capsule Drop</h3>
              <p className="text-xs text-muted mt-0.5">Activate waitlists and consumer discovery</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-muted block">
                  Drop Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Royal Banaras Capsule '26"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-muted block">
                  Collection Name
                </label>
                <input
                  type="text"
                  required
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g. The Heritage Weave"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted block">
                    Launch Date
                  </label>
                  <input
                    type="date"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted block">
                    Garment Count
                  </label>
                  <input
                    type="number"
                    value={productsCount}
                    onChange={(e) => setProductsCount(e.target.value)}
                    min={1}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-muted block">
                  Cover Banner URL
                </label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold cursor-pointer active:scale-98 transition-transform flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Scheduling Drop...</span>
                  </>
                ) : (
                  <span>Publish to Atelier Calendar</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
