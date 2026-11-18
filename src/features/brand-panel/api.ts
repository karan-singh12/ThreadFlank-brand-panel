import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import type {
  BidSlot,
  BulkAction,
  CatalogFacets,
  CatalogQuery,
  ImportResult,
  BrandProfile,
  BrandProfileUpdate,
  ContentRequest,
  ContentResult,
  CreateDropInput,
  CreateGarmentInput,
  LaunchDrop,
  MetricSummary,
  MotionPreset,
  ProductItem,
  VideoStatus,
  VideoInput,
  BrandVideo,
  BrandReel,
  ReelInput,
  ReelStatus,
  ReelStyle,
  Taxonomy,
  TeamMember,
  TopPiece,
  BillingOverview,
  BillingQuote,
  BillingOrder,
  BillingPayment,
  CurrentPlan,
  SeriesDay,
  CategoryStat,
  SavedContent,
  ContentType,
  WidgetInfo,
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
  /** One page of the catalog. The server filters and sorts; `cursor` continues where the last page ended. */
  async catalogPage(token: string, query: Partial<CatalogQuery>, opts: { cursor?: string | null; limit?: number; signal?: AbortSignal } = {}) {
    const params = new URLSearchParams({ limit: String(opts.limit ?? 24) });
    if (opts.cursor) params.set("cursor", opts.cursor);
    if (query.q?.trim()) params.set("q", query.q.trim());
    if (query.category) params.set("category", query.category);
    if (query.collection) params.set("collection", query.collection);
    if (query.status) params.set("status", query.status);
    if (query.stock === "out") params.set("outOfStock", "true");
    if (query.stock === "low") params.set("lowStock", "true");
    if (query.notReady) params.set("notReady", "true");
    if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
    const res = await apiRequest<ProductItem[]>(`${b.catalog}?${params}`, { token, signal: opts.signal });
    const meta = res.meta as { total?: number | null; nextCursor?: string | null } | undefined;
    return { items: res.data, total: meta?.total ?? null, nextCursor: meta?.nextCursor ?? null };
  },
  async facets(token: string, signal?: AbortSignal) {
    return (await apiRequest<CatalogFacets>(b.catalogFacets, { token, signal })).data;
  },
  async bulk(token: string, ids: string[], action: BulkAction, extra: { collection?: string; category?: string } = {}) {
    const body = { ids, action, ...(action === "collection" ? { collection: extra.collection ?? "" } : {}), ...(action === "category" ? { category: extra.category ?? "" } : {}) };
    return (await apiRequest<{ affected: number }>(b.catalogBulk, { method: "POST", token, body, timeoutMs: 60_000 })).data;
  },
  /** Up to 500 rows per call; the server reports each bad row instead of rejecting the file. */
  async importRows(token: string, items: Record<string, string>[], updateExisting: boolean) {
    return (await apiRequest<ImportResult>(b.catalogImport, { method: "POST", token, body: { items, updateExisting }, timeoutMs: 120_000 })).data;
  },
  async createGarment(token: string, garment: CreateGarmentInput) {
    return (await apiRequest<ProductItem>(b.catalog, { method: "POST", token, body: garment })).data;
  },
  async updateGarment(token: string, id: string, patch: Partial<CreateGarmentInput>) {
    return (await apiRequest<ProductItem>(b.garment(id), { method: "PATCH", token, body: patch })).data;
  },
  async deleteGarment(token: string, id: string) {
    await apiRequest(b.garment(id), { method: "DELETE", token });
  },
  async updateBuyUrl(token: string, id: string, buyUrl: string) {
    return (await apiRequest<ProductItem>(b.garment(id), { method: "PATCH", token, body: { buyUrl } })).data;
  },

  async metrics(token: string, days: number, signal?: AbortSignal) {
    return (await apiRequest<MetricSummary>(`${b.analytics.overview}?days=${days}`, { token, signal })).data;
  },
  async topPieces(token: string, days: number, signal?: AbortSignal, limit = 5) {
    return (await apiRequest<TopPiece[]>(`${b.analytics.topPieces}?days=${days}&limit=${limit}`, { token, signal })).data;
  },
  async series(token: string, days: number, signal?: AbortSignal) {
    return (await apiRequest<SeriesDay[]>(`${b.analytics.series}?days=${days}`, { token, signal })).data;
  },
  async categoryStats(token: string, days: number, signal?: AbortSignal) {
    return (await apiRequest<CategoryStat[]>(`${b.analytics.categories}?days=${days}`, { token, signal })).data;
  },
  async library(token: string, signal?: AbortSignal) {
    return (await apiRequest<SavedContent[]>(b.aiStudio.library, { token, signal })).data;
  },
  async saveContent(token: string, input: { contentType: ContentType; text: string; garmentId?: string | null }) {
    return (await apiRequest<SavedContent>(b.aiStudio.library, { method: "POST", token, body: { contentType: input.contentType, text: input.text, ...(input.garmentId ? { garmentId: input.garmentId } : {}) } })).data;
  },
  async deleteSavedContent(token: string, id: string) {
    await apiRequest(`${b.aiStudio.library}/${id}`, { method: "DELETE", token });
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

  async updateDrop(token: string, id: string, patch: Partial<CreateDropInput>) {
    return (await apiRequest<LaunchDrop>(`${b.drops}/${id}`, { method: "PATCH", token, body: patch })).data;
  },
  async deleteDrop(token: string, id: string) {
    await apiRequest(`${b.drops}/${id}`, { method: "DELETE", token });
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
  async videoStatus(token: string, signal?: AbortSignal) {
    return (await apiRequest<VideoStatus>(b.aiStudio.videoStatus, { token, signal })).data;
  },
  /** Starts a render; it finishes in the background (poll `video`). Returns the job and the new credit balance. */
  async createVideo(token: string, input: VideoInput) {
    return (await apiRequest<{ video: BrandVideo; remainingCredits: number }>(b.aiStudio.videos, { method: "POST", token, body: input, timeoutMs: 120_000 })).data;
  },
  async videos(token: string, signal?: AbortSignal) {
    return (await apiRequest<BrandVideo[]>(b.aiStudio.videos, { token, signal, timeoutMs: 90_000 })).data;
  },
  async video(token: string, id: string, signal?: AbortSignal) {
    return (await apiRequest<BrandVideo>(b.aiStudio.video(id), { token, signal, timeoutMs: 90_000 })).data;
  },
  async deleteVideo(token: string, id: string) {
    return (await apiRequest<{ success: boolean }>(b.aiStudio.video(id), { method: "DELETE", token })).data;
  },

  async reelStyles(token: string, signal?: AbortSignal) {
    return (await apiRequest<ReelStyle[]>(b.aiStudio.reelStyles, { token, signal })).data;
  },
  async reelStatus(token: string, signal?: AbortSignal) {
    return (await apiRequest<ReelStatus>(b.aiStudio.reelStatus, { token, signal })).data;
  },
  /** Starts every shot at once; the reel stitches itself once they are all in (poll `reels`). */
  async createReel(token: string, input: ReelInput) {
    return (await apiRequest<{ reel: BrandReel; remainingCredits: number }>(b.aiStudio.reels, { method: "POST", token, body: input, timeoutMs: 180_000 })).data;
  },
  async reels(token: string, signal?: AbortSignal) {
    return (await apiRequest<BrandReel[]>(b.aiStudio.reels, { token, signal, timeoutMs: 120_000 })).data;
  },
  async deleteReel(token: string, id: string) {
    return (await apiRequest<{ success: boolean }>(b.aiStudio.reel(id), { method: "DELETE", token })).data;
  },

  async generateContent(token: string, input: ContentRequest) {
    return (await apiRequest<ContentResult>(b.aiStudio.content, { method: "POST", token, body: input, timeoutMs: 90_000 })).data;
  },

  async taxonomy(token: string, signal?: AbortSignal) {
    return (await apiRequest<Taxonomy>(b.taxonomy, { token, signal })).data;
  },
  async widget(token: string, signal?: AbortSignal) {
    return (await apiRequest<WidgetInfo>(b.widget, { token, signal })).data;
  },
  async setWidgetDomains(token: string, domains: string[]) {
    return (await apiRequest<WidgetInfo>(`${b.widget}/domains`, { method: "PUT", token, body: { domains } })).data;
  },
  async rotateWidgetKey(token: string) {
    return (await apiRequest<WidgetInfo>(`${b.widget}/rotate-key`, { method: "POST", token })).data;
  },

  async team(token: string, signal?: AbortSignal) {
    return (await apiRequest<TeamMember[]>(b.team, { token, signal })).data;
  },
  async billing(token: string, signal?: AbortSignal) {
    return (await apiRequest<BillingOverview>(b.billing, { token, signal })).data;
  },
  async billingQuote(token: string, packId: string, code?: string) {
    return (await apiRequest<BillingQuote>(`${b.billing}/quote`, { method: "POST", token, body: { packId, ...(code ? { code } : {}) } })).data;
  },
  async billingOrder(token: string, packId: string, code?: string) {
    return (await apiRequest<BillingOrder>(`${b.billing}/order`, { method: "POST", token, body: { packId, ...(code ? { code } : {}) } })).data;
  },
  async billingVerify(token: string, body: { orderId: string; paymentId: string; signature: string }) {
    return (await apiRequest<{ credits: number; balance: number; plan?: CurrentPlan }>(`${b.billing}/verify`, { method: "POST", token, body })).data;
  },
  async billingPayments(token: string, signal?: AbortSignal) {
    return (await apiRequest<BillingPayment[]>(`${b.billing}/payments`, { token, signal })).data;
  },
  async setMemberRole(token: string, id: string, role: "MANAGER" | "VIEWER") {
    return (await apiRequest<{ id: string; role: "MANAGER" | "VIEWER" }>(`${b.team}/${id}/role`, { method: "PATCH", token, body: { role } })).data;
  },
  async inviteMember(token: string, input: { name: string; email: string; role?: "MANAGER" | "VIEWER" }) {
    return (await apiRequest<TeamMember>(`${b.team}/invite`, { method: "POST", token, body: input })).data;
  },
  async resendInvite(token: string, id: string) {
    await apiRequest(`${b.team}/${id}/resend`, { method: "POST", token });
  },
  async setMemberActive(token: string, id: string, isActive: boolean) {
    return (await apiRequest<{ id: string; isActive: boolean }>(`${b.team}/${id}`, { method: "PATCH", token, body: { isActive } })).data;
  },
  async changePassword(token: string, currentPassword: string, newPassword: string) {
    await apiRequest(ENDPOINTS.brand.auth.changePassword, { method: "POST", token, body: { currentPassword, newPassword } });
  },

  async uploadBase64(token: string, base64: string, filename?: string) {
    return (await apiRequest<{ url: string }>(b.upload, { method: "POST", token, body: { base64, filename }, timeoutMs: 60_000 })).data;
  },
};
