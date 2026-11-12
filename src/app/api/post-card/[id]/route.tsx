import { API_BASE_URL, ENDPOINTS, assetUrl } from "@/lib/api/config";
import { cardFormat, loadPhoto, renderShareCard } from "@/lib/share-card";
import { brand } from "@/data/landing-page";
import type { ApiBrandPost } from "@/features/discover/api";

const price = (p: string) => (/^[^\d]/.test(p) ? p : `$${p}`);

/** Branded share card for a Discover post, same design and formats as the look card. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const format = cardFormat(url.searchParams.get("format"));

  let post: ApiBrandPost;
  try {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.discover.post(id)}`, { cache: "no-store" });
    if (!res.ok) return new Response("Post not found", { status: 404 });
    post = ((await res.json()) as { data: ApiBrandPost }).data;
  } catch {
    return new Response("Discover is unavailable", { status: 503 });
  }

  const [photo, logo] = await Promise.all([
    loadPhoto(post.images?.[0] ? assetUrl(post.images[0]) : null, format === "og" ? 600 : 1200),
    loadPhoto(new URL("/icon.png", url.origin).toString(), 96),
  ]);
  const products = (post.taggedProducts ?? []).map((t) => (t.price ? `${t.name} · ${price(t.price)}` : t.name));

  return renderShareCard(
    {
      photo,
      logo,
      brandName: brand.name,
      eyebrow: [post.brand.name, post.category].filter(Boolean).join(" · "),
      title: (post.title || post.caption || post.brand.name).replace(/\s+/g, " ").trim(),
      chips: products,
      cta: "Try it on your own twin",
      link: `${url.host}/p/${id}`,
    },
    format
  );
}
