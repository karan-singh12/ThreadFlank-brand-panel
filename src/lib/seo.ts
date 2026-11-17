/**
 * Single source of truth for SEO values. Brand-panel is the brand-facing site on a subdomain of
 * the consumer site's root domain. Set NEXT_PUBLIC_SITE_URL (this site) and
 * NEXT_PUBLIC_CONSUMER_SITE_URL (the main site) in production.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://brands.threadflank.com").replace(/\/+$/, "");

/** The consumer site (User-Panel) on the root domain. */
export const CONSUMER_SITE_URL = (process.env.NEXT_PUBLIC_CONSUMER_SITE_URL || `https://${new URL(SITE_URL).host.replace(/^brands\./, "")}`).replace(/\/+$/, "");

export const SITE_NAME = "Threadflank for Brands";

export const SITE_TITLE = "AI Virtual Try-On for Fashion Stores — Threadflank";

export const SITE_DESCRIPTION =
  "Let shoppers try on every piece in your catalog before they buy. List your brand, schedule drops and see which garments get tried on most with Threadflank's AI virtual try-on.";

/** Same organization id as the consumer site, so search engines link the two properties. */
export const ORGANIZATION_ID = `${CONSUMER_SITE_URL}/#organization`;
