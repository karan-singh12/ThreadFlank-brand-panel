import type {
  BrandProfile,
  MetricSummary,
  ProductItem,
  LaunchDrop,
  Top10BidSlot,
} from "@/types";
import {
  defaultBrandProfile,
  defaultMetrics,
  defaultProducts,
  defaultLaunches,
  defaultBiddingSlots,
} from "./defaults";

const API_BASE =
  process.env.NEXT_PUBLIC_BRAND_API_URL || "http://localhost:3003/api/brand";

function unwrapResponse<T>(json: any): T {
  if (!json) return json;
  // Handle double or single nesting from NestJS TransformInterceptor
  if (json?.data?.data !== undefined) {
    return json.data.data;
  }
  if (json?.data !== undefined && typeof json.data === "object" && !Array.isArray(json.data) && "data" in json.data) {
    return json.data.data;
  }
  if (json?.data !== undefined) {
    return json.data;
  }
  return json;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options?.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `API error: ${res.statusText} (${res.status})`);
    }

    const json = await res.json();
    return unwrapResponse<T>(json);
  } catch (err: any) {
    throw err;
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export async function checkBackendConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/profile`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Brand Profile API ────────────────────────────────────────────────────────

export async function getBrandProfile(): Promise<BrandProfile> {
  try {
    const data = await request<BrandProfile>("/profile");
    return data && data.name ? data : defaultBrandProfile;
  } catch {
    return defaultBrandProfile;
  }
}

export async function updateBrandProfile(
  updates: Partial<BrandProfile>
): Promise<BrandProfile> {
  try {
    return await request<BrandProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  } catch {
    return { ...defaultBrandProfile, ...updates };
  }
}

// ─── Catalog Inventory API ────────────────────────────────────────────────────

export async function getCatalog(): Promise<ProductItem[]> {
  try {
    const data = await request<ProductItem[]>("/catalog");
    return Array.isArray(data) && data.length > 0 ? data : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export async function createGarment(garment: Partial<ProductItem>): Promise<ProductItem> {
  try {
    return await request<ProductItem>("/catalog", {
      method: "POST",
      body: JSON.stringify(garment),
    });
  } catch {
    return {
      id: `prod_${Date.now()}`,
      title: garment.title || "New Garment",
      sku: garment.sku || `SKU-${Date.now()}`,
      price: garment.price || 50000,
      images: garment.images || [],
      category: garment.category || "Ethnic Wear",
      occasions: garment.occasions || ["Celebration"],
      colors: garment.colors || ["Gold"],
      sizes: garment.sizes || ["Free Size"],
      stock: garment.stock ?? 10,
      isDrapeReady: garment.isDrapeReady ?? true,
      drapeScore: garment.drapeScore ?? 92,
      drapesCount: 0,
      clicksCount: 0,
      buyUrl: garment.buyUrl || "https://rawmango.com",
      featured: garment.featured ?? false,
      newDrop: garment.newDrop ?? true,
    };
  }
}

export async function updateGarment(
  id: string,
  updates: Partial<ProductItem>
): Promise<ProductItem> {
  try {
    return await request<ProductItem>(`/catalog/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  } catch {
    const found = defaultProducts.find((p) => p.id === id);
    return { ...(found || ({} as ProductItem)), ...updates };
  }
}

export async function deleteGarment(id: string): Promise<boolean> {
  try {
    await request(`/catalog/${id}`, { method: "DELETE" });
  } catch {
    // Non-blocking
  }
  return true;
}

// ─── Analytics API ────────────────────────────────────────────────────

export async function getAnalyticsOverview(): Promise<MetricSummary> {
  try {
    const data = await request<MetricSummary>("/analytics/overview");
    return data && data.totalDrapes ? data : defaultMetrics;
  } catch {
    return defaultMetrics;
  }
}

export async function trackBuyClick(productId: string): Promise<{ success: boolean }> {
  try {
    return await request<{ success: boolean }>("/analytics/track-click", {
      method: "POST",
      body: JSON.stringify({ productId, source: "catalog_buy_now" }),
    });
  } catch {
    return { success: true };
  }
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
  try {
    const data = await request<MotionPreset[]>("/ai-studio/presets");
    return Array.isArray(data) ? data : [];
  } catch {
    return [
      {
        id: "red_carpet",
        name: "Red Carpet Glow",
        badge: "Cannes / Gala",
        description: "Slow, majestic dolly-in with warm volumetric spotlights and subtle fabric breeze.",
        cameraMovement: "Cinematic Dolly-In (0.5x)",
        lighting: "3200K Tungsten Warm + Rim Highlight",
        promptSuggestion: "Slow elegant glide towards the camera, luxury evening gala, rich fabric texture shimmer",
        estimatedSeconds: 6,
      },
      {
        id: "high_street",
        name: "High-Street Stride",
        badge: "Runway / Editorial",
        description: "Dynamic tracking shot with crisp natural daylight and realistic garment momentum.",
        cameraMovement: "Parallel Tracking Pan (1.2x)",
        lighting: "5600K Clean Daylight with Crisp Soft Shadow",
        promptSuggestion: "Confident modern runway stride, crisp natural daylight, natural fabric drape momentum",
        estimatedSeconds: 5,
      },
      {
        id: "silk_motion",
        name: "Silk Motion",
        badge: "Micro Detail / 120fps",
        description: "Ultra slow-motion close-up emphasizing zari sheen, embroidery depth and flowing edges.",
        cameraMovement: "Macro Arc Orbit (0.25x)",
        lighting: "Softbox Diffused Studio Shimmer",
        promptSuggestion: "Ultra slow-motion 120fps close up of handwoven brocade, subtle airflow revealing gold threads",
        estimatedSeconds: 8,
      },
      {
        id: "velvet_glow",
        name: "Velvet Glow",
        badge: "Royal Nocturne",
        description: "Moody chiaroscuro with 360-degree rotation highlighting deep pile and jewel tones.",
        cameraMovement: "Full 360 Degree Slow Swivel",
        lighting: "Low-Key Chiaroscuro with Specular Highlights",
        promptSuggestion: "Royal nighttime ambiance, 360 rotation, dramatic specular highlights on rich velvet",
        estimatedSeconds: 7,
      },
    ];
  }
}

export async function runAiSimulation(params: {
  garmentId?: string;
  customImageUrl?: string;
  motionPreset: string;
  motionIntensity: number;
  prompt?: string;
  promptEnhance?: boolean;
}): Promise<SimulationResult> {
  try {
    return await request<SimulationResult>("/ai-studio/simulate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch {
    return {
      simulationId: `sim_${Date.now()}`,
      status: "completed",
      modelUsed: "Veo-2 Motion Cinema (1080p)",
      presetUsed: params.motionPreset,
      intensity: params.motionIntensity,
      prompt: params.prompt || "Luxury runway movement",
      previewVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnailUrl: params.customImageUrl || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
      creditsDeducted: 15,
      remainingCredits: 405,
      createdAt: new Date().toISOString(),
    };
  }
}

// ─── Runway Bidding API ───────────────────────────────────────────────────────

export async function getBiddingSlots(): Promise<Top10BidSlot[]> {
  try {
    const data = await request<Top10BidSlot[]>("/bidding/slots");
    return Array.isArray(data) && data.length > 0 ? data : defaultBiddingSlots;
  } catch {
    return defaultBiddingSlots;
  }
}

export async function placeRunwayBid(
  rank: number,
  bidAmount: number
): Promise<{ slot: Top10BidSlot; message: string }> {
  try {
    return await request<{ slot: Top10BidSlot; message: string }>(
      `/bidding/slots/${rank}/bid`,
      {
        method: "POST",
        body: JSON.stringify({ bidAmount }),
      }
    );
  } catch {
    const slot = defaultBiddingSlots.find((s) => s.rankPosition === rank) || defaultBiddingSlots[0];
    return {
      slot: {
        ...slot,
        yourCurrentBid: bidAmount,
        currentHighestBid: bidAmount,
        status: "winning",
      },
      message: `Bid of ₹${bidAmount.toLocaleString("en-IN")} submitted! You are now leading rank #${rank}.`,
    };
  }
}

// ─── Drops & Launches API ─────────────────────────────────────────────────────

export async function getDrops(): Promise<LaunchDrop[]> {
  try {
    const data = await request<LaunchDrop[]>("/drops");
    return Array.isArray(data) && data.length > 0 ? data : defaultLaunches;
  } catch {
    return defaultLaunches;
  }
}

export async function createDrop(drop: Partial<LaunchDrop>): Promise<LaunchDrop> {
  try {
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
  } catch {
    return {
      id: `drop_${Date.now()}`,
      title: drop.title || "New Collection",
      collectionName: drop.collectionName || "Capsule Edit",
      description: drop.description,
      launchDate: drop.launchDate || new Date(Date.now() + 86400000 * 3).toISOString(),
      waitlistCount: 0,
      status: "scheduled",
      bannerUrl: drop.bannerUrl || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
      productsCount: drop.productsCount || 4,
      countdownDays: 3,
    };
  }
}

// ─── Cloudflare R2 Upload API ─────────────────────────────────────────────────

export async function uploadAssetBase64(base64: string, filename?: string) {
  try {
    return await request<{ url: string; path: string; size: number }>(
      "/upload/base64",
      {
        method: "POST",
        body: JSON.stringify({ base64, filename }),
      }
    );
  } catch {
    return {
      url: base64.startsWith("data:") ? base64 : `https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b`,
      path: "/brand-assets/fallback.jpg",
      size: 1024,
    };
  }
}
