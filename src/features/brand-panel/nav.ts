import { Award, BarChart3, Layers, LayoutDashboard, Rocket, Video, type LucideIcon } from "lucide-react";

export type BrandNavItem = { id: string; label: string; title: string; href: string; icon: LucideIcon };

/** The panel sections. The sidebar, mobile bar and page titles all read from here. */
export const BRAND_NAV: readonly BrandNavItem[] = [
  { id: "dashboard", label: "Dashboard", title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { id: "insights", label: "Insights", title: "Insights", href: "/insights", icon: BarChart3 },
  { id: "catalog", label: "Catalog", title: "Catalog", href: "/catalog", icon: Layers },
  { id: "ai-studio", label: "AI Studio", title: "AI Studio", href: "/ai-studio", icon: Video },
  { id: "drops", label: "Drops", title: "Launch drops", href: "/drops", icon: Rocket },
  { id: "bidding", label: "Bidding", title: "Runway bidding", href: "/bidding", icon: Award },
];

export const isNavActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
