import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Dashboard and consumer-app pages are kept out of the index with a `noindex` meta tag on each page,
// so they stay crawlable here (a blocked page's noindex would never be seen). Only non-page endpoints are blocked.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/embed/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
