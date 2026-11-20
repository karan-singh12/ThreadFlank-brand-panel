import { Award, BarChart3, BookmarkCheck, Layers, LayoutDashboard, Rocket, Video, type LucideIcon } from "lucide-react";

export type BrandNavItem = { id: string; label: string; title: string; href: string; icon: LucideIcon };

/**
 * The tabs in the top bar and the phone tab bar. Keep this at five: any other section goes in
 * BRAND_MENU below, which the profile dropdown lists.
 */
export const BRAND_NAV: readonly BrandNavItem[] = [
  { id: "dashboard", label: "Dashboard", title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { id: "catalog", label: "Catalog", title: "Catalog", href: "/catalog", icon: Layers },
  { id: "ai-studio", label: "AI Studio", title: "AI Studio", href: "/ai-studio", icon: Video },
  { id: "drops", label: "Drops", title: "Launch drops", href: "/drops", icon: Rocket },
  { id: "bidding", label: "Bidding", title: "Runway bidding", href: "/bidding", icon: Award },
];

/** Sections that don't get a tab. The profile dropdown lists these. */
export const BRAND_MENU: readonly BrandNavItem[] = [
  { id: "insights", label: "Insights", title: "Insights", href: "/insights", icon: BarChart3 },
  { id: "saved-copy", label: "Saved copy", title: "Saved copy", href: "/saved-copy", icon: BookmarkCheck },
];

export const isNavActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
