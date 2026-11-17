import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Only public, indexable marketing pages. Dashboard, consumer-app, share and auth-token pages are noindex and left out.
const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/pricing", priority: 0.8 },
  { path: "/signup", priority: 0.7 },
  { path: "/contact", priority: 0.5 },
  { path: "/privacy", priority: 0.2 },
  { path: "/terms", priority: 0.2 },
  { path: "/disclaimer", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority }) => ({ url: `${SITE_URL}${path === "/" ? "" : path}`, priority }));
}
