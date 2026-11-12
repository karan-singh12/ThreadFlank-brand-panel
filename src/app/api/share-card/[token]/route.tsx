import { API_BASE_URL, ENDPOINTS, assetUrl } from "@/lib/api/config";
import { cardFormat, loadPhoto, renderShareCard } from "@/lib/share-card";
import { brand } from "@/data/landing-page";

type Shared = {
  token: string;
  look: { name: string; image: string; occasion: string; pieces?: unknown };
  sharedBy: { name: string };
};

/** Branded card for a shared look (feature #22); see `lib/share-card` for the formats. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = new URL(req.url);
  const format = cardFormat(url.searchParams.get("format"));

  let shared: Shared;
  try {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.share.resolve(token)}`, { cache: "no-store" });
    if (!res.ok) return new Response("Share link not found", { status: 404 });
    shared = ((await res.json()) as { data: Shared }).data;
  } catch {
    return new Response("Share service unavailable", { status: 503 });
  }

  const [photo, logo] = await Promise.all([
    loadPhoto(assetUrl(shared.look.image), format === "og" ? 600 : 1200),
    loadPhoto(new URL("/icon.png", url.origin).toString(), 96),
  ]);
  const pieces = Array.isArray(shared.look.pieces) ? shared.look.pieces.filter((p): p is string => typeof p === "string" && p.trim() !== "") : [];

  return renderShareCard(
    {
      photo,
      logo,
      brandName: brand.name,
      eyebrow: `Styled by ${shared.sharedBy.name} · ${shared.look.occasion}`,
      title: shared.look.name,
      chips: pieces,
      cta: "Try it on your own twin",
      link: `${url.host}/s/${token}`,
    },
    format
  );
}
