import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_BASE_URL, ENDPOINTS } from "@/lib/api/config";
import type { ApiBrandPost } from "@/features/discover/api";
import { SharedPostView } from "@/features/share/SharedPostView";

type Props = { params: Promise<{ id: string }> };

async function load(id: string): Promise<ApiBrandPost | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.discover.post(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { data: ApiBrandPost }).data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await load(id);
  if (!post) return { title: "Post not found — Threadflank" };
  const title = `${post.brand.name} — ${(post.title || post.caption).slice(0, 70)}`;
  const description = "See this look on Threadflank and try it on your own twin.";
  const image = `/api/post-card/${id}?format=og`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [image] },
  };
}

/** Public page for a shared Discover post: the deep-link target of every post share card. */
export default async function SharedPostPage({ params }: Props) {
  const { id } = await params;
  const post = await load(id);
  if (!post) notFound();
  return <SharedPostView post={post} />;
}
