"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { brandApi } from "./api";
import type { BrandProfile, BrandProfileUpdate, CreateGarmentInput, ProductItem } from "./types";
import { useResource } from "./useResource";

type PanelValue = {
  status: "loading" | "ready" | "error";
  error: string;
  reload: () => void;
  brand: BrandProfile | null;
  products: ProductItem[];
  updateBrand: (updates: BrandProfileUpdate) => Promise<void>;
  addProduct: (garment: CreateGarmentInput) => Promise<ProductItem>;
  updateBuyUrl: (id: string, buyUrl: string) => Promise<void>;
  updateProduct: (id: string, patch: Partial<CreateGarmentInput>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setCredits: (credits: number) => void;
};

const Ctx = createContext<PanelValue | null>(null);

const loadProfile = brandApi.profile;
const loadCatalog = brandApi.catalog;

/** Owns the brand profile and catalog (shared by several tabs) and every write to them. Nothing is applied until the server confirms it. */
export function BrandPanelProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const profile = useResource(loadProfile);
  const catalog = useResource(loadCatalog);
  const { setData: setBrand, reload: reloadProfile } = profile;
  const { setData: setCatalog, reload: reloadCatalog } = catalog;

  const need = useCallback(() => {
    if (!token) throw new Error("Not signed in");
    return token;
  }, [token]);

  const updateBrand = useCallback(
    async (updates: BrandProfileUpdate) => {
      const next = await brandApi.updateProfile(need(), updates);
      setBrand(() => next);
    },
    [need, setBrand]
  );

  const addProduct = useCallback(
    async (garment: CreateGarmentInput) => {
      const created = await brandApi.createGarment(need(), garment);
      setCatalog((list) => [created, ...(list ?? [])]);
      return created;
    },
    [need, setCatalog]
  );

  const updateBuyUrl = useCallback(
    async (id: string, buyUrl: string) => {
      const updated = await brandApi.updateBuyUrl(need(), id, buyUrl);
      setCatalog((list) => (list ?? []).map((p) => (p.id === id ? updated : p)));
    },
    [need, setCatalog]
  );

  const updateProduct = useCallback(
    async (id: string, patch: Partial<CreateGarmentInput>) => {
      const updated = await brandApi.updateGarment(need(), id, patch);
      setCatalog((list) => (list ?? []).map((p) => (p.id === id ? updated : p)));
    },
    [need, setCatalog]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      await brandApi.deleteGarment(need(), id);
      setCatalog((list) => (list ?? []).filter((p) => p.id !== id));
    },
    [need, setCatalog]
  );

  const setCredits = useCallback((aiCredits: number) => setBrand((b) => (b ? { ...b, aiCredits } : b)), [setBrand]);

  const reload = useCallback(() => {
    reloadProfile();
    reloadCatalog();
  }, [reloadProfile, reloadCatalog]);

  const status = profile.status === "error" || catalog.status === "error" ? "error" : profile.status === "loading" || catalog.status === "loading" ? "loading" : "ready";

  const value = useMemo<PanelValue>(
    () => ({
      status,
      error: profile.error || catalog.error,
      reload,
      brand: profile.data,
      products: catalog.data ?? [],
      updateBrand,
      addProduct,
      updateBuyUrl,
      updateProduct,
      deleteProduct,
      setCredits,
    }),
    [status, profile.error, catalog.error, profile.data, catalog.data, reload, updateBrand, addProduct, updateBuyUrl, updateProduct, deleteProduct, setCredits]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBrandPanel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBrandPanel must be used inside <BrandPanelProvider>");
  return ctx;
}

/** For tab views: the shell only renders them once the profile and catalog have loaded. */
export function useReadyPanel() {
  const panel = useBrandPanel();
  if (!panel.brand) throw new Error("useReadyPanel called before the panel finished loading");
  return panel as PanelValue & { brand: BrandProfile };
}
