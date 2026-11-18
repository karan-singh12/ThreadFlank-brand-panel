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
  /** GST number as saved (format-checked only). */
  gstin?: string;
  currentRank: number;
  totalBrands: number;
  rankScore: number;
  tier?: string;
};

/** Editable subset: the backend rejects any other field. */
export type BrandProfileUpdate = Partial<
  Pick<BrandProfile, "name" | "story" | "logo" | "banner" | "themeAccent" | "announcementText" | "websiteUrl" | "physicalStoreAddress" | "isOnlineOnly" | "gstin">
>;

/** `changePct` is null until the backend has a previous period to compare with. */
export type Metric = { total: number; changePct: number | null };

export type MetricSummary = {
  /** How many days the numbers cover; the change compares with the same length before. */
  periodDays?: number;
  storeViews: Metric;
  totalDrapes: Metric;
  saves: Metric;
  shares: Metric;
  clickOuts: Metric;
  conversionRate: Metric;
  newFollowers?: Metric;
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
  /** The brand's own grouping, e.g. "Wedding Edit 2026". */
  collection?: string;
  /** The caption: what a post used to say. */
  description?: string;
  /** DRAFT is hidden from shoppers. */
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  sharesCount: number;
  likesCount: number;
  commentsCount: number;
};

/** Body of POST /brand/catalog (CreateGarmentDto). */
export type CreateGarmentInput = {
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
  buyUrl: string;
  featured: boolean;
  newDrop: boolean;
  /** Empty string takes the piece out of its collection. */
  collection?: string;
  description?: string;
  status?: "DRAFT" | "PUBLISHED";
};

/** A piece shoppers reached for in the period, with what they did with it. */
export type TopPiece = { id: string; title: string; sku: string; image: string; price: number; drapes: number; saves: number; shares: number; clicks: number; views: number; score: number };

/** One day of shopper activity. */
export type SeriesDay = { date: string; views: number; drapes: number; saves: number; shares: number; clicks: number };
/** Shopper activity for one piece category. */
export type CategoryStat = { category: string; views: number; drapes: number; saves: number; shares: number; clicks: number };
/** Copy kept from the AI writer. */
export type SavedContent = { id: string; contentType: ContentType; title: string; body: string; garmentId: string | null; createdAt: string };

export type BillingPack = { id: string; name: string; credits: number; price: number; perCredit: number; blurb: string; featured: boolean };
export type PlanLimits = { garments: number; drops: number; team: number };
export type BillingPlan = { id: "FREE" | "GROWTH" | "PRO"; /** What to send when buying it. */ orderId: string; name: string; price: number; credits: number; limits: PlanLimits; blurb: string; days: number; featured: boolean };
export type CurrentPlan = { id: BillingPlan["id"]; name: string; until: string | null; limits: PlanLimits; usage: PlanLimits };
export type BillingOverview = { paymentsEnabled: boolean; credits: number; gstin: string; gstNote: string; packs: BillingPack[]; plan: CurrentPlan; plans: BillingPlan[] };
export type BillingQuote = { packId: string; code: string | null; percentOff: number; bonusCredits: number; price: number; originalPrice: number; credits: number };
export type BillingOrder = { orderId: string; amount: number; currency: string; keyId: string; credits: number; pack: { id: string; name: string; credits: number } };
export type BillingPayment = { id: string; pack: string; credits: number; amount: number; coupon: string | null; status: "CREATED" | "PAID" | "FAILED"; paidAt: string | null; createdAt: string };

export type CatalogSort = "newest" | "oldest" | "price_low" | "price_high" | "popular" | "stock_low";

/** What the catalog list is filtered by; the server does the filtering. */
export type CatalogQuery = {
  q: string;
  category: string;
  /** A collection name, "none" for pieces in no collection, or "" for all. */
  collection: string;
  status: "" | "PUBLISHED" | "DRAFT";
  stock: "" | "out" | "low";
  notReady: boolean;
  sort: CatalogSort;
};

export type CatalogFacets = {
  total: number;
  categories: { name: string; count: number }[];
  collections: { name: string; count: number }[];
  uncollected: number;
  status: { published: number; draft: number };
  outOfStock: number;
  lowStock: number;
  notReady: number;
  featured: number;
};

export type BulkAction = "publish" | "draft" | "delete" | "collection" | "category";

export type ImportResult = {
  received: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { row: number; sku?: string; message: string }[];
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
  /** Highest bid so far; 0 when nobody has bid yet. */
  currentHighestBid: number;
  /** The least a new bid can be: the starting price, or one rupee above the top bid. */
  minimumBid?: number;
  endsAt?: string;
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

/** Whether motion video rendering is connected, and how (from GET /brand/ai-studio/video/status). */
export type VideoStatus = {
  available: boolean;
  engine: "veo" | "replicate" | null;
  model: string | null;
  /** Shapes the engine renders; empty means the clip follows the photo's own shape. */
  aspectRatios: string[];
  durationSec: number | null;
  cost: number;
};

export type VideoInput = {
  garmentId?: string;
  customImageUrl?: string;
  presetId: string;
  aspectRatio?: string;
  prompt?: string;
};

/** One motion video job: RENDERING while the engine works, then READY or FAILED (credits refunded). */
export type ReelStyle = {
  id: string;
  name: string;
  badge: string;
  description: string;
  presetIds: string[];
  cardColor: string;
  introSec: number;
  outroSec: number;
  outroLine: string;
};

export type ReelStatus = {
  available: boolean;
  engine: string | null;
  /** Why reels are off: no video engine, or this server cannot stitch. */
  reason: "engine" | "ffmpeg" | null;
  minShots: number;
  maxShots: number;
  shotSeconds: number;
  cost: number;
};

/** One outfit inside a reel, with its own clip. */
export type ReelShot = {
  id: string;
  position: number;
  status: "RENDERING" | "READY" | "FAILED";
  label: string;
  caption: string;
  garmentId: string | null;
  sourceImageUrl: string;
  clipUrl: string | null;
};

export type BrandReel = {
  id: string;
  /** COMPOSING = every clip is in and the reel is being stitched. */
  status: "RENDERING" | "COMPOSING" | "READY" | "FAILED";
  title: string;
  styleId: string;
  styleName: string;
  aspectRatio: string;
  videoUrl: string | null;
  durationSec: number;
  error: string | null;
  credits: number;
  refunded: boolean;
  shotsReady: number;
  shotsTotal: number;
  shots: ReelShot[];
  createdAt: string;
  finishedAt: string | null;
};

export type ReelShotInput = { garmentId?: string; customImageUrl?: string; label?: string; caption?: string };
export type ReelInput = { title?: string; styleId: string; shots: ReelShotInput[]; prompt?: string };

export type BrandVideo = {
  id: string;
  status: "RENDERING" | "READY" | "FAILED";
  garmentId: string | null;
  presetId: string;
  presetName: string;
  aspectRatio: string;
  durationSec: number;
  sourceImageUrl: string;
  videoUrl: string | null;
  error: string | null;
  credits: number;
  refunded: boolean;
  engine: string;
  createdAt: string;
  finishedAt: string | null;
};

export type ContentType = "product_description" | "instagram_caption" | "launch_announcement" | "email_blurb" | "seo_meta" | "whatsapp_broadcast" | "product_title";
export type ContentTone = "luxe" | "playful" | "minimal" | "festive" | "bold";
export type ContentLanguage = "english" | "hindi" | "hinglish";
export type ContentLength = "short" | "medium" | "long";

export type ContentRequest = {
  contentType: ContentType;
  garmentId?: string;
  tone: ContentTone;
  language: ContentLanguage;
  length: ContentLength;
  keywords: string[];
  notes?: string;
  variants?: number;
};

export type ContentResult = {
  contentType: ContentType;
  garmentId: string | null;
  variants: { id: string; text: string }[];
  creditsDeducted: number;
  remainingCredits: number;
  createdAt: string;
};

export type WidgetInfo = {
  key: string;
  live: boolean;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  domains: string[];
  last30Days: { sessions: number; succeeded: number };
  topOrigins: { origin: string; sessions: number }[];
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "VIEWER";
  isActive: boolean;
  pending: boolean;
  lastLoginAt: string | null;
};

/** The category and occasion choices admins manage; a brand picks from these. */
export type Taxonomy = { categories: string[]; occasions: string[] };
