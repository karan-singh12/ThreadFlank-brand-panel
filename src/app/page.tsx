"use client";

import React, { useState, useEffect } from "react";
import type {
  NavTabId,
  BrandProfile,
  ProductItem,
  MetricSummary,
  LaunchDrop,
  Top10BidSlot,
} from "@/types";
import {
  defaultBrandProfile,
  defaultMetrics,
  defaultProducts,
  defaultLaunches,
  defaultBiddingSlots,
} from "@/lib/defaults";
import {
  getBrandProfile,
  updateBrandProfile as apiUpdateBrandProfile,
  getCatalog,
  createGarment as apiCreateGarment,
  updateGarment as apiUpdateGarment,
  getAnalyticsOverview,
  getDrops,
  getBiddingSlots,
  checkBackendConnection,
} from "@/lib/api";
import { Header } from "@/components/navigation/Header";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { CatalogView } from "@/components/catalog/CatalogView";
import { AiVideoStudio } from "@/components/aivideo/AiVideoStudio";
import { LaunchesView } from "@/components/launches/LaunchesView";
import { BiddingView } from "@/components/bidding/BiddingView";

export default function BrandDashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTabId>("dashboard");
  const [brand, setBrand] = useState<BrandProfile>(defaultBrandProfile);
  const [products, setProducts] = useState<ProductItem[]>(defaultProducts);
  const [metrics, setMetrics] = useState<MetricSummary>(defaultMetrics);
  const [launches, setLaunches] = useState<LaunchDrop[]>(defaultLaunches);
  const [biddingSlots, setBiddingSlots] = useState<Top10BidSlot[]>(defaultBiddingSlots);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Sync state from Backend API on mount
  useEffect(() => {
    let isMounted = true;

    async function syncBackend() {
      const isOnline = await checkBackendConnection();
      if (!isMounted) return;
      setIsBackendConnected(isOnline);

      if (isOnline) {
        const [liveBrand, liveCatalog, liveMetrics, liveDrops, liveSlots] =
          await Promise.allSettled([
            getBrandProfile(),
            getCatalog(),
            getAnalyticsOverview(),
            getDrops(),
            getBiddingSlots(),
          ]);

        if (!isMounted) return;

        if (liveBrand.status === "fulfilled" && liveBrand.value) {
          setBrand((prev) => ({ ...prev, ...liveBrand.value }));
        }
        if (liveCatalog.status === "fulfilled" && liveCatalog.value?.length) {
          setProducts(liveCatalog.value);
        }
        if (liveMetrics.status === "fulfilled" && liveMetrics.value) {
          setMetrics(liveMetrics.value);
        }
        if (liveDrops.status === "fulfilled" && liveDrops.value?.length) {
          setLaunches(liveDrops.value);
        }
        if (liveSlots.status === "fulfilled" && liveSlots.value?.length) {
          setBiddingSlots(liveSlots.value);
        }
      }
    }

    syncBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateBrand = async (updated: Partial<BrandProfile>) => {
    setBrand((prev) => ({ ...prev, ...updated }));
    try {
      const persisted = await apiUpdateBrandProfile(updated);
      setBrand((prev) => ({ ...prev, ...persisted }));
    } catch (err) {
      console.warn("[BrandPanel] Updated locally:", err);
    }
  };

  const handleAddProduct = async (newProduct: ProductItem) => {
    setProducts((prev) => [newProduct, ...prev]);
    try {
      const created = await apiCreateGarment(newProduct);
      setProducts((prev) => prev.map((p) => (p.id === newProduct.id ? created : p)));
    } catch (err) {
      console.warn("[BrandPanel] Added locally:", err);
    }
  };

  const handleUpdateProduct = async (updatedProduct: ProductItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    try {
      await apiUpdateGarment(updatedProduct.id, updatedProduct);
    } catch (err) {
      console.warn("[BrandPanel] Updated locally:", err);
    }
  };

  const handleCreditsUpdated = (newCredits: number) => {
    setBrand((prev) => ({ ...prev, aiCredits: newCredits }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-white relative">
      {/* Subtle ambient lighting matching ThreadFlank platform */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[420px] w-[850px] -translate-x-1/2 rounded-full bg-accent/15 blur-[160px]" />
        <div className="absolute -left-[10%] top-[20%] h-[45%] w-[35%] rounded-full bg-[#6645eb]/8 blur-[150px]" />
        <div className="absolute -right-[8%] bottom-[-15%] h-[50%] w-[35%] rounded-full bg-[#1f8fff]/6 blur-[160px]" />
      </div>

      {/* Top Header with STRICTLY 5 Tabs & Right-Side Brand Profile Sheet */}
      <Header
        brand={brand}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onUpdateBrand={handleUpdateBrand}
      />

      {/* Main Workspace Body */}
      <main className="relative flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {/* Subtle Connection Status Banner */}
        <div className="flex items-center justify-between mb-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                isBackendConnected
                  ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-muted">
              {isBackendConnected
                ? "Backend API: Online (http://localhost:3003)"
                : "Backend API: Standalone Mode (Run `npm run start:dev` in backend to sync live)"}
            </span>
          </div>
        </div>

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
      </main>

      {/* Mobile Bottom Dock (5 Touch Tabs) */}
      <MobileBottomBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
