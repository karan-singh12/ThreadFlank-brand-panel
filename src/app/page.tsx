"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  NavTabId,
  BrandProfile,
  ProductItem,
  MetricSummary,
  LaunchDrop,
  Top10BidSlot,
} from "@/types";
import {
  getBrandProfile,
  updateBrandProfile as apiUpdateBrandProfile,
  getCatalog,
  createGarment as apiCreateGarment,
  updateGarment as apiUpdateGarment,
  getAnalyticsOverview,
  getDrops,
  getBiddingSlots,
} from "@/lib/api";
import { Header } from "@/components/navigation/Header";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { CatalogView } from "@/components/catalog/CatalogView";
import { AiVideoStudio } from "@/components/aivideo/AiVideoStudio";
import { LaunchesView } from "@/components/launches/LaunchesView";
import { BiddingView } from "@/components/bidding/BiddingView";
import { RefreshCw, AlertCircle } from "lucide-react";

export default function BrandDashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTabId>("dashboard");
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [launches, setLaunches] = useState<LaunchDrop[]>([]);
  const [biddingSlots, setBiddingSlots] = useState<Top10BidSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      const [liveBrand, liveCatalog, liveMetrics, liveDrops, liveSlots] =
        await Promise.all([
          getBrandProfile(),
          getCatalog(),
          getAnalyticsOverview(),
          getDrops(),
          getBiddingSlots(),
        ]);

      setBrand(liveBrand);
      setProducts(liveCatalog);
      setMetrics(liveMetrics);
      setLaunches(liveDrops);
      setBiddingSlots(liveSlots);
    } catch (err: any) {
      console.error("[BrandPanel] API connection error:", err);
      setConnectionError(
        err.message || "Unable to connect to Brand Backend API at http://localhost:3003/api/brand."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateBrand = async (updated: Partial<BrandProfile>) => {
    if (!brand) return;
    setBrand((prev) => (prev ? { ...prev, ...updated } : null));
    try {
      const persisted = await apiUpdateBrandProfile(updated);
      setBrand(persisted);
    } catch (err) {
      console.warn("[BrandPanel] Failed to persist brand update to backend:", err);
    }
  };

  const handleAddProduct = async (newProduct: ProductItem) => {
    setProducts((prev) => [newProduct, ...prev]);
    try {
      const created = await apiCreateGarment(newProduct);
      setProducts((prev) => prev.map((p) => (p.id === newProduct.id ? created : p)));
    } catch (err) {
      console.warn("[BrandPanel] Failed to persist new garment:", err);
    }
  };

  const handleUpdateProduct = async (updatedProduct: ProductItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    try {
      await apiUpdateGarment(updatedProduct.id, updatedProduct);
    } catch (err) {
      console.warn("[BrandPanel] Failed to persist garment update:", err);
    }
  };

  const handleCreditsUpdated = (newCredits: number) => {
    setBrand((prev) => (prev ? { ...prev, aiCredits: newCredits } : null));
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-white relative">
      {/* Subtle ambient lighting */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[420px] w-[850px] -translate-x-1/2 rounded-full bg-accent/15 blur-[160px]" />
        <div className="absolute -left-[10%] top-[20%] h-[45%] w-[35%] rounded-full bg-[#6645eb]/8 blur-[150px]" />
        <div className="absolute -right-[8%] bottom-[-15%] h-[50%] w-[35%] rounded-full bg-[#1f8fff]/6 blur-[160px]" />
      </div>

      {/* Header */}
      {brand && (
        <Header
          brand={brand}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onUpdateBrand={handleUpdateBrand}
        />
      )}

      {/* Main Workspace Body */}
      <main className="relative flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
            <div className="size-10 rounded-full border-2 border-accent-bright border-t-transparent animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Loading Atelier Workspace...</p>
              <p className="text-xs text-muted font-mono">Connecting to Brand Backend API (/api/brand)</p>
            </div>
          </div>
        ) : connectionError && !brand ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center p-6">
            <div className="size-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="size-7" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-semibold text-white">Backend Connection Offline</h3>
              <p className="text-xs text-muted leading-relaxed">
                Could not connect to the ThreadFlank Backend API at{" "}
                <code className="text-accent-bright font-mono">http://localhost:3003/api/brand</code>.
              </p>
              <p className="text-[11px] text-muted/70 pt-1">
                Please make sure the backend server is running (<code className="text-white/80">npm run start:dev</code> in backend).
              </p>
            </div>
            <button
              onClick={loadData}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all mt-2"
            >
              <RefreshCw className="size-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : brand && metrics ? (
          <>
            {activeTab === "dashboard" && (
              <DashboardOverview
                brand={brand}
                metrics={metrics}
                products={products}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === "catalog" && (
              <CatalogView
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
              />
            )}

            {activeTab === "ai-studio" && (
              <AiVideoStudio
                brand={brand}
                products={products}
                onCreditsUpdated={handleCreditsUpdated}
              />
            )}

            {activeTab === "drops" && (
              <LaunchesView launches={launches} />
            )}

            {activeTab === "bidding" && (
              <BiddingView
                slots={biddingSlots}
                brand={brand}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Mobile Bottom Dock (5 Touch Tabs) */}
      <MobileBottomBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
