import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { parsePublicUrl } from "@/lib/server/public-url";

export const maxDuration = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a potentially relative URL against a base URL */
function resolveUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

/** Score an image URL by how likely it is to be a product image */
function scoreImageUrl(url: string): number {
  const lower = url.toLowerCase();
  let score = 0;
  // Product image signals
  if (lower.includes("product")) score += 3;
  if (lower.includes("item")) score += 2;
  if (lower.includes("garment")) score += 3;
  if (lower.includes("outfit")) score += 3;
  if (lower.includes("dress")) score += 2;
  if (lower.includes("shirt")) score += 2;
  if (lower.includes("cloth")) score += 2;
  // Large image signals
  if (lower.match(/\d{3,4}x\d{3,4}/)) score += 2;
  if (lower.includes("large") || lower.includes("high") || lower.includes("zoom")) score += 1;
  // Penalise icons/logos/avatars
  if (lower.includes("icon") || lower.includes("logo") || lower.includes("avatar")) score -= 5;
  if (lower.includes("banner") || lower.includes("bg") || lower.includes("background")) score -= 3;
  if (lower.includes("thumbnail") || lower.includes("thumb")) score -= 1;
  // Common CDN patterns for e-commerce product images
  if (lower.includes("images-na.ssl-images-amazon")) score += 2;
  if (lower.includes("assets.myntassets")) score += 3;
  if (lower.includes("static.zara")) score += 2;
  if (lower.includes("images.asos-media")) score += 2;
  return score;
}

/** Extract the best product image from parsed HTML */
function extractBestImage(html: string, pageUrl: string): string | null {
  const $ = cheerio.load(html);

  const candidates: Array<{ url: string; score: number }> = [];

  // 1. og:image — most reliable across e-commerce sites
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    const resolved = resolveUrl(ogImage, pageUrl);
    candidates.push({ url: resolved, score: scoreImageUrl(resolved) + 10 });
  }

  // 2. twitter:image
  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  if (twitterImage) {
    const resolved = resolveUrl(twitterImage, pageUrl);
    candidates.push({ url: resolved, score: scoreImageUrl(resolved) + 8 });
  }

  // 3. JSON-LD structured data (most e-commerce sites use this)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() ?? "");
      const extractImages = (obj: unknown): void => {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj)) { obj.forEach(extractImages); return; }
        const o = obj as Record<string, unknown>;
        if (o["image"]) {
          const imgs = Array.isArray(o["image"]) ? o["image"] : [o["image"]];
          imgs.forEach((img) => {
            if (typeof img === "string") {
              const resolved = resolveUrl(img, pageUrl);
              candidates.push({ url: resolved, score: scoreImageUrl(resolved) + 6 });
            } else if (img && typeof img === "object" && (img as Record<string, unknown>)["url"]) {
              const resolved = resolveUrl((img as Record<string, unknown>)["url"] as string, pageUrl);
              candidates.push({ url: resolved, score: scoreImageUrl(resolved) + 6 });
            }
          });
        }
        Object.values(o).forEach(extractImages);
      };
      extractImages(json);
    } catch {
      // ignore malformed JSON-LD
    }
  });

  // 4. Site-specific selectors for common platforms
  const siteSpecific: string[] = [];

  // Myntra
  $(".image-grid-image, .pdp-image img, img[class*='product-img']").each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src");
    if (src) siteSpecific.push(resolveUrl(src, pageUrl));
  });

  // Amazon
  $("#imgTagWrapperId img, #landingImage, #main-image").each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-old-hires") ?? $(el).attr("data-a-dynamic-image");
    if (src) siteSpecific.push(resolveUrl(src, pageUrl));
  });

  // ASOS, Zara, generic
  $('img[itemprop="image"], img[data-testid*="product"], img.product-image, img[class*="ProductImage"]').each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src");
    if (src) siteSpecific.push(resolveUrl(src, pageUrl));
  });

  siteSpecific.forEach((url) => {
    candidates.push({ url, score: scoreImageUrl(url) + 4 });
  });

  // 5. All <img> tags as last resort — pick largest by heuristic
  if (candidates.length === 0) {
    $("img").each((_, el) => {
      const src = $(el).attr("src") ?? $(el).attr("data-src") ?? $(el).attr("data-lazy");
      if (!src || src.startsWith("data:")) return;
      const resolved = resolveUrl(src, pageUrl);
      const w = parseInt($(el).attr("width") ?? "0", 10);
      const h = parseInt($(el).attr("height") ?? "0", 10);
      const sizeBonus = (w > 400 || h > 400) ? 2 : 0;
      candidates.push({ url: resolved, score: scoreImageUrl(resolved) + sizeBonus });
    });
  }

  if (candidates.length === 0) return null;

  // Return the highest-scored unique URL
  const seen = new Set<string>();
  const unique = candidates.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  unique.sort((a, b) => b.score - a.score);
  return unique[0]?.url ?? null;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url field is required." }, { status: 400 });
  }

  const parsedUrl = parsePublicUrl(url);
  if (!parsedUrl) {
    return NextResponse.json({ error: "Please enter a valid product URL (starting with http or https)." }, { status: 400 });
  }

  // Fetch the product page
  let html: string;
  try {
    const res = await fetch(parsedUrl.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      // 20-second timeout
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch the page (HTTP ${res.status}). Try a different product link.` },
        { status: 422 }
      );
    }

    html = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timed out") || msg.includes("TimeoutError")) {
      return NextResponse.json({ error: "The product page took too long to load. Please try again." }, { status: 504 });
    }
    console.error("[fetch-garment]", err);
    return NextResponse.json({ error: "We couldn't open that product page. Try a different link." }, { status: 502 });
  }

  // Extract best garment image
  const garmentImageUrl = extractBestImage(html, parsedUrl.href);
  if (!garmentImageUrl) {
    return NextResponse.json(
      { error: "Could not find a product image on this page. Try downloading the garment image manually and using the Upload option." },
      { status: 422 }
    );
  }

  return NextResponse.json({ garmentImageUrl });
}
