/** Shapes returned by the backend's /brand/* endpoints (backend/src/modules/Brand-panel). */

export type BrandProfile = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  story: string;
  verified: boolean;
  /** PENDING = awaiting admin approval (hidden from shoppers); ACTIVE = live. */
  status?: "PENDING" | "ACTIVE" | "INACTIVE";
  themeAccent: string;
  announcementText?: string;
  websiteUrl?: string;
  physicalStoreAddress?: string;
  isOnlineOnly?: boolean;
  followersCount: number;
  aiCredits: number;
  currentRank: number;
  totalBrands: number;
  rankScore: number;
  tier?: string;
};

/** Editable subset: the backend rejects any other field. */
export type BrandProfileUpdate = Partial<
  Pick<BrandProfile, "name" | "story" | "logo" | "banner" | "themeAccent" | "announcementText" | "websiteUrl" | "physicalStoreAddress" | "isOnlineOnly">
>;

/** `changePct` is null until the backend has a previous period to compare with. */
export type Metric = { total: number; changePct: number | null };

export type MetricSummary = {
  storeViews: Metric;
  totalDrapes: Metric;
  saves: Metric;
  shares: Metric;
  clickOuts: Metric;
  conversionRate: Metric;
};

export type ProductItem = {
  id: string;
  title: string;
  sku: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  occasions: string[];
  colors: string[];
  sizes: string[];
  stock: number;
  isDrapeReady: boolean;
  drapeScore: number;
  fitScore?: number;
  drapesCount: number;
  clicksCount: number;
  buyUrl: string;
  featured: boolean;
  newDrop: boolean;
};

/** Body of POST /brand/catalog (CreateGarmentDto). */
export type CreateGarmentInput = {
  title: string;
  sku: string;
  price: number;
  images: string[];
  category: string;
  occasions: string[];
  colors: string[];
  sizes: string[];
  stock: number;
  isDrapeReady: boolean;
  drapeScore: number;
  buyUrl: string;
  featured: boolean;
  newDrop: boolean;
};

export type LaunchDrop = {
  id: string;
  title: string;
  collectionName: string;
  description?: string;
  launchDate: string;
  waitlistCount: number;
  status: "scheduled" | "live" | "completed";
  bannerUrl: string;
  productsCount: number;
  skuCount?: number;
  countdownDays?: number;
};

export type CreateDropInput = {
  title: string;
  collectionName: string;
  launchDate: string;
  bannerUrl: string;
  productsCount: number;
};

export type BidSlot = {
  rankPosition: number;
  category: string;
  period: string;
  title?: string;
  currentHighestBid: number;
  yourCurrentBid?: number;
  status: "winning" | "outbid" | "open";
  impressionsEstimate?: string;
  endsInHours?: number;
  projectedAudience?: { views: number; drapes: number };
};

export type MotionPreset = {
  id: string;
  name: string;
  badge: string;
  description: string;
  cameraMovement: string;
  lighting: string;
  promptSuggestion: string;
  estimatedSeconds: number;
};

export type SimulationInput = {
  garmentId?: string;
  customImageUrl?: string;
  motionPreset: string;
  motionIntensity: number;
  prompt?: string;
  promptEnhance?: boolean;
};

export type SimulationResult = {
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
};
