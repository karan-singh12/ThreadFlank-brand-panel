import type {
  BrandProfile,
  MetricSummary,
  ProductItem,
  LaunchDrop,
  Top10BidSlot,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_BRAND_API_URL || "http://localhost:3003/api/brand";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || `API error: ${res.statusText} (${res.status})`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

// ─── Brand Profile API ────────────────────────────────────────────────────────

export async function getBrandProfile(): Promise<BrandProfile> {
  return await request<BrandProfile>("/profile");
}

export async function updateBrandProfile(
  updates: Partial<BrandProfile>
): Promise<BrandProfile> {
  return await request<BrandProfile>("/profile", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// ─── Catalog Inventory API ────────────────────────────────────────────────────

export async function getCatalog(): Promise<ProductItem[]> {
  return await request<ProductItem[]>("/catalog");
}

export async function createGarment(garment: Partial<ProductItem>): Promise<ProductItem> {
  return await request<ProductItem>("/catalog", {
    method: "POST",
    body: JSON.stringify(garment),
  });
}

export async function updateGarment(
  id: string,
  updates: Partial<ProductItem>
): Promise<ProductItem> {
  return await request<ProductItem>(`/catalog/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteGarment(id: string): Promise<boolean> {
  await request(`/catalog/${id}`, { method: "DELETE" });
  return true;
}

// ─── Analytics API ────────────────────────────────────────────────────────────

export async function getAnalyticsOverview(): Promise<MetricSummary> {
  return await request<MetricSummary>("/analytics/overview");
}

export async function trackBuyClick(productId: string): Promise<{ success: boolean }> {
  return await request<{ success: boolean }>("/analytics/track-click", {
    method: "POST",
    body: JSON.stringify({ productId, source: "catalog_buy_now" }),
  });
}

// ─── AI Video Studio API ──────────────────────────────────────────────────────

export interface MotionPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  cameraMovement: string;
  lighting: string;
  promptSuggestion: string;
  estimatedSeconds: number;
}

export interface SimulationResult {
  simulationId: string;
  status: string;
  modelUsed: string;
  presetUsed: string;
  intensity: number;
  prompt?: string;
  previewVideoUrl: string;
  thumbnailUrl: string;
  creditsDeducted: number;
  remainingCredits: number;
  createdAt: string;
}

export async function getAiMotionPresets(): Promise<MotionPreset[]> {
  return await request<MotionPreset[]>("/ai-studio/presets");
}

export async function runAiSimulation(params: {
  garmentId?: string;
  customImageUrl?: string;
  motionPreset: string;
  motionIntensity: number;
  prompt?: string;
  promptEnhance?: boolean;
}): Promise<SimulationResult> {
  return await request<SimulationResult>("/ai-studio/simulate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ─── Runway Bidding API ───────────────────────────────────────────────────────

export async function getBiddingSlots(): Promise<Top10BidSlot[]> {
  return await request<Top10BidSlot[]>("/bidding/slots");
}

export async function placeRunwayBid(
  rank: number,
  bidAmount: number
): Promise<{ slot: Top10BidSlot; message: string }> {
  return await request<{ slot: Top10BidSlot; message: string }>(
    `/bidding/slots/${rank}/bid`,
    {
      method: "POST",
      body: JSON.stringify({ bidAmount }),
    }
  );
}

// ─── Drops & Launches API ─────────────────────────────────────────────────────

export async function getDrops(): Promise<LaunchDrop[]> {
  return await request<LaunchDrop[]>("/drops");
}

export async function createDrop(drop: Partial<LaunchDrop>): Promise<LaunchDrop> {
  return await request<LaunchDrop>("/drops", {
    method: "POST",
    body: JSON.stringify({
      title: drop.title,
      collectionName: drop.collectionName,
      description: drop.description,
      launchDate: drop.launchDate,
      bannerUrl: drop.bannerUrl,
      productsCount: drop.productsCount,
    }),
  });
}

// ─── Cloudflare R2 Upload API ─────────────────────────────────────────────────

export async function uploadAssetBase64(base64: string, filename?: string) {
  return await request<{ url: string; path: string; size: number }>(
    "/upload/base64",
    {
      method: "POST",
      body: JSON.stringify({ base64, filename }),
    }
  );
}
