import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import type {
  BidSlot,
  BrandProfile,
  BrandProfileUpdate,
  CreateDropInput,
  CreateGarmentInput,
  LaunchDrop,
  MetricSummary,
  MotionPreset,
  ProductItem,
  SimulationInput,
  SimulationResult,
} from "./types";

const b = ENDPOINTS.brand;

/** Every call takes the session token so the panel works the moment the backend starts enforcing it. */
export const brandApi = {
  async profile(token: string, signal?: AbortSignal) {
    return (await apiRequest<BrandProfile>(b.profile, { token, signal })).data;
  },
  async updateProfile(token: string, updates: BrandProfileUpdate) {
    return (await apiRequest<BrandProfile>(b.profile, { method: "PATCH", token, body: updates })).data;
  },

  async catalog(token: string, signal?: AbortSignal) {
    return (await apiRequest<ProductItem[]>(b.catalog, { token, signal })).data;
  },
  async createGarment(token: string, garment: CreateGarmentInput) {
    return (await apiRequest<ProductItem>(b.catalog, { method: "POST", token, body: garment })).data;
  },
  async updateBuyUrl(token: string, id: string, buyUrl: string) {
    return (await apiRequest<ProductItem>(b.garment(id), { method: "PATCH", token, body: { buyUrl } })).data;
  },

  async metrics(token: string, signal?: AbortSignal) {
    return (await apiRequest<MetricSummary>(b.analytics.overview, { token, signal })).data;
  },
  /** Fire-and-forget conversion ping; never blocks the shopper's click. */
  async trackBuyClick(token: string, productId: string) {
    await apiRequest(b.analytics.trackClick, { method: "POST", token, body: { productId, source: "catalog_buy_now" } });
  },

  async drops(token: string, signal?: AbortSignal) {
    return (await apiRequest<LaunchDrop[]>(b.drops, { token, signal })).data;
  },
  async createDrop(token: string, drop: CreateDropInput) {
    return (await apiRequest<LaunchDrop>(b.drops, { method: "POST", token, body: drop })).data;
  },

  async slots(token: string, signal?: AbortSignal) {
    return (await apiRequest<BidSlot[]>(b.bidding.slots, { token, signal })).data;
  },
  async placeBid(token: string, rank: number, bidAmount: number) {
    const res = await apiRequest<BidSlot>(b.bidding.bid(rank), { method: "POST", token, body: { bidAmount } });
    return { slot: res.data, message: res.message };
  },

  async presets(token: string, signal?: AbortSignal) {
    return (await apiRequest<MotionPreset[]>(b.aiStudio.presets, { token, signal })).data;
  },
  async simulate(token: string, input: SimulationInput) {
    return (await apiRequest<SimulationResult>(b.aiStudio.simulate, { method: "POST", token, body: input, timeoutMs: 120_000 })).data;
  },

  async uploadBase64(token: string, base64: string, filename?: string) {
    return (await apiRequest<{ url: string }>(b.upload, { method: "POST", token, body: { base64, filename }, timeoutMs: 60_000 })).data;
  },
};
