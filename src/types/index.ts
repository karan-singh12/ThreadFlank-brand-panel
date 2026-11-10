export type NavTabId =
  | "dashboard"
  | "catalog"
  | "ai-studio"
  | "drops"
  | "bidding";

export interface BrandProfile {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  story: string;
  verified: boolean;
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
  monthlyRank?: number;
}

export interface MetricSummary {
  storeViews: { total: number; changePct: number };
  totalDrapes: { total: number; changePct: number };
  saves: { total: number; changePct: number };
  shares: { total: number; changePct: number };
  clickOuts: { total: number; changePct: number };
  conversionRate: { total: number; changePct: number };
}

export interface ProductItem {
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
  drapeScore: number; // 0 - 100
  fitScore?: number;
  drapesCount: number;
  clicksCount: number;
  buyUrl: string;
  featured: boolean;
  newDrop: boolean;
}

export interface LaunchDrop {
  id: string;
  title: string;
  collectionName: string;
  description?: string;
  launchDate: string; // ISO
  waitlistCount: number;
  status: "scheduled" | "live" | "completed";
  bannerUrl: string;
  productsCount: number;
  skuCount?: number;
  countdownDays?: number;
}

export interface OccasionCampaign {
  id: string;
  name: string;
  description?: string;
  occasionType: string;
  dateRange: string;
  dates?: string;
  daysRemaining: number;
  isEnrolled: boolean;
  projectedReach: string;
  matchingProductsCount: number;
  participatingBrands?: number;
  banner: string;
}

export interface Top10BidSlot {
  rankPosition: number;
  category: string;
  period: string; // e.g., "Nov 2026"
  title?: string;
  currentHighestBid: number;
  yourCurrentBid?: number;
  status: "winning" | "outbid" | "open";
  impressionsEstimate: string;
  endsInHours: number;
  projectedAudience?: { views: number; drapes: number };
  projectedImpressions?: number;
  projectedDrapes?: number;
}

