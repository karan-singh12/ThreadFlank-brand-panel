import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_BASE_URL, ENDPOINTS } from "@/lib/api/config";
import { SharedLookView, type SharedLook } from "@/features/share/SharedLookView";

type Props = { params: Promise<{ token: string }> };

async function load(token: string): Promise<SharedLook | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.share.resolve(token)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { data: SharedLook }).data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const shared = await load(token);
  if (!shared) return { title: "Look not found — Threadflank" };
  const title = `${shared.look.name} — styled by ${shared.sharedBy.name}`;
  const image = `/api/share-card/${token}?format=og`;
  return {
    title,
    description: "See this look and try it on your own twin.",
    openGraph: { title, description: "See this look and try it on your own twin.", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [image] },
  };
}

export default async function SharedLookPage({ params }: Props) {
  const { token } = await params;
  const shared = await load(token);
  if (!shared) notFound();
  return <SharedLookView shared={shared} />;
}
