"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Video,
  Play,
  Film,
  Music,
  Download,
  Share2,
  Sliders,
  CheckCircle2,
  Clock,
  Upload,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { BrandProfile, ProductItem } from "@/types";
import { runAiSimulation, type SimulationResult } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AiVideoStudioProps {
  brand: BrandProfile;
  products: ProductItem[];
  onCreditsUpdated?: (newCredits: number) => void;
}

const MOTION_TEMPLATES = [
  { id: "red_carpet", label: "Red Carpet Glow", desc: "Slow cinematic dolly-in with warm spotlights and subtle fabric wave" },
  { id: "high_street", label: "High-Street Stride", desc: "Dynamic tracking pan with clean daylight and realistic drape motion" },
  { id: "silk_motion", label: "Silk Motion 120fps", desc: "Ultra slow-motion close-up emphasizing zari sheen and embroidery" },
  { id: "velvet_glow", label: "Velvet Glow 360", desc: "Low-key 360-degree rotation showing jewel tones and rich textures" },
];

export function AiVideoStudio({ brand, products, onCreditsUpdated }: AiVideoStudioProps) {
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || "");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [selectedMotion, setSelectedMotion] = useState("red_carpet");
  const [generating, setGenerating] = useState(false);
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const activeProduct = products.find((p) => p.id === selectedProduct) || products[0];
  const activeImage = customImage || activeProduct?.images[0] || "/brand-cover.webp";

  const handleStartGeneration = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const result = await runAiSimulation({
        garmentId: customImage ? undefined : selectedProduct,
        customImageUrl: customImage || undefined,
        motionPreset: selectedMotion,
        motionIntensity: 75,
        prompt: customPrompt || undefined,
        promptEnhance: true,
      });

      setSimulationResult(result);
      setVideoGenerated(true);
      if (onCreditsUpdated && result.remainingCredits !== undefined) {
        onCreditsUpdated(result.remainingCredits);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate AI video. Please check your credits.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImage(reader.result as string);
        setVideoGenerated(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── 1. Action Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-white tracking-tight">AI Content Studio</span>
          <span className="text-xs text-muted px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            Veo 2 Neural Motion
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted">
          <span>Cost: 15 credits / video</span>
          <span className="text-white/20">·</span>
          <span className="text-white font-medium">{brand.aiCredits} available</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── 2. Interactive Image Selector & Changer Strip ─── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/80 font-medium">Select or Change Garment Image</span>
          {activeProduct && !customImage && (
            <span className="text-muted truncate max-w-[280px]">Active: {activeProduct.title}</span>
          )}
          {customImage && (
            <button
              onClick={() => setCustomImage(null)}
              className="text-accent-bright hover:underline cursor-pointer"
            >
              Reset to Catalog Photo
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {/* Custom Upload Button */}
          <label className="shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-white/20 hover:border-accent-bright hover:bg-accent/5 transition-all text-xs text-white/80 cursor-pointer active:scale-95">
            <Upload className="size-4 text-accent-bright" />
            <span className="font-medium whitespace-nowrap">Upload Custom Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomUpload}
              className="hidden"
            />
          </label>

          {/* Catalog Garment Thumbnail Selectors */}
          {products.map((p) => {
            const isSelected = selectedProduct === p.id && !customImage;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProduct(p.id);
                  setCustomImage(null);
                  setVideoGenerated(false);
                }}
                className={cn(
                  "shrink-0 flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer text-left",
                  isSelected
                    ? "bg-accent/20 border-accent text-white shadow-sm ring-1 ring-accent"
                    : "bg-white/[0.02] border-white/[0.06] text-muted hover:border-white/15 hover:text-white"
                )}
              >
                <div className="relative size-9 rounded-lg overflow-hidden bg-black/40 shrink-0">
                  <Image
                    src={p.images[0] || "/brand-cover.webp"}
                    alt={p.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 max-w-[130px]">
                  <p className="text-[11px] font-medium text-white truncate">{p.title}</p>
                  <p className="text-[10px] text-muted font-mono truncate">{p.sku}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 3. Single Unified Studio Canvas ─── */}
      <div className="rounded-2xl p-5 sm:p-6 bg-white/[0.02] border border-white/[0.06] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: Interactive Media Canvas */}
        <div className="lg:col-span-5 flex justify-center">
          <div
            className={cn(
              "relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl transition-all duration-300 w-full max-w-[340px]",
              aspectRatio === "9:16" ? "aspect-[9/16]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-[16/9]"
            )}
          >
            {videoGenerated && simulationResult?.previewVideoUrl ? (
              <div className="relative w-full h-full">
                <video
                  src={simulationResult.previewVideoUrl}
                  poster={activeImage}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] text-emerald-400 font-mono border border-white/10">
                    Veo 2 Render Complete
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-accent/30 text-[10px] text-accent-bright font-mono">
                    1080p · 60fps
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Image
                  src={activeImage}
                  alt="Active Garment Preview"
                  fill
                  className={cn(
                    "object-cover transition-all duration-700",
                    generating ? "scale-105 filter blur-xs brightness-75" : "scale-100"
                  )}
                />

                {/* Generating Loader State */}
                {generating && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <div className="size-10 rounded-full border-2 border-accent-bright border-t-transparent animate-spin" />
                    <div className="text-xs font-medium text-white">Synthesizing Runway Motion...</div>
                    <div className="text-[11px] text-muted font-mono">Veo 2 Neural Drape Simulation</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Studio Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Motion Style Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted block">
              1. Camera & Fabric Motion Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MOTION_TEMPLATES.map((m) => {
                const active = selectedMotion === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMotion(m.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1",
                      active
                        ? "bg-accent/20 border-accent shadow-sm ring-1 ring-accent text-white"
                        : "bg-white/[0.02] border-white/[0.06] text-muted hover:border-white/15 hover:text-white"
                    )}
                  >
                    <div className="text-xs font-medium text-white flex items-center justify-between">
                      <span>{m.label}</span>
                      {active && <CheckCircle2 className="size-3.5 text-accent-bright" />}
                    </div>
                    <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted block">
              2. Canvas Aspect Ratio
            </label>
            <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              {(["9:16", "1:1", "16:9"] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer",
                    aspectRatio === ratio
                      ? "bg-accent/25 text-white font-medium border border-accent/30"
                      : "text-muted hover:text-white"
                  )}
                >
                  {ratio === "9:16" ? "9:16 (Reels/Stories)" : ratio === "1:1" ? "1:1 (Post/Feed)" : "16:9 (Hero Banner)"}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Creative Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-muted block">
              3. Creative Direction (Optional)
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Royal evening lights, slow breeze moving the pallu, cinematic golden hour"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Generate CTA Button */}
          <div className="pt-2">
            <button
              onClick={handleStartGeneration}
              disabled={generating || brand.aiCredits < 15}
              className={cn(
                "w-full py-3.5 px-6 rounded-xl font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98",
                generating || brand.aiCredits < 15
                  ? "bg-white/10 text-muted cursor-not-allowed"
                  : "btn-primary"
              )}
            >
              {generating ? (
                <>
                  <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Synthesizing Runway Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Render Veo-2 Motion Video (15 Credits)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
