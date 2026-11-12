"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Shirt, Sparkles } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS, assetUrl } from "@/lib/api/config";

export type SharedLook = {
  token: string;
  channel: string;
  look: { id: string; name: string; occasion: string; image: string; pieces?: unknown; videoUrl: string | null; poseVariants: { pose: string; imageUrl: string }[] | null; createdAt: string };
  sharedBy: { name: string; avatar: string | null };
};

/** Landing page for a shared look: the deep-link target of every WhatsApp/Instagram card. */
export function SharedLookView({ shared }: { shared: SharedLook }) {
  const { status } = useAuth();

  // Count one open per browser session, so refreshes don't inflate the numbers.
  useEffect(() => {
    const key = `tf_share_open:${shared.token}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: still count it.
    }
    apiRequest(ENDPOINTS.share.open(shared.token), { method: "POST" }).catch(() => undefined);
  }, [shared.token]);

  const poses = shared.look.poseVariants ?? [];
  const pieces = Array.isArray(shared.look.pieces) ? shared.look.pieces.filter((p): p is string => typeof p === "string" && p.trim() !== "") : [];
  const signedIn = status === "authenticated";

  return (
    <main className="mx-auto grid max-w-[1080px] gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_380px] lg:py-16">
      <section className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-(--radius-frame) border border-white/10 bg-white/[0.03]">
          {shared.look.videoUrl ? (
            <video src={assetUrl(shared.look.videoUrl)} poster={assetUrl(shared.look.image)} className="aspect-[4/5] w-full object-cover" autoPlay muted loop playsInline controls />
          ) : (
            <div className="aspect-[4/5]">
              <Photo src={shared.look.image} alt={shared.look.name} fit="contain" />
            </div>
          )}
        </div>
        {poses.length > 0 && (
          <div className="no-scrollbar flex gap-3 overflow-x-auto">
            {poses.map((p) => (
              <div key={p.pose} className="aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-xl border border-white/10">
                <Photo src={p.imageUrl} alt={p.pose} />
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:h-fit">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-accent text-white">
            {shared.sharedBy.avatar ? <Photo src={shared.sharedBy.avatar} alt="" /> : shared.sharedBy.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-sm text-muted">Styled by</p>
            <p className="text-body font-medium text-white">{shared.sharedBy.name}</p>
          </div>
        </div>
        <div>
          <h1 className="chrome text-[2rem] font-medium leading-tight tracking-[-0.03em]">{shared.look.name}</h1>
          <p className="mt-1 text-sm capitalize text-muted">{shared.look.occasion}</p>
          {pieces.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {pieces.map((piece) => (
                <span key={piece} className="rounded-full border border-violet-300/40 bg-violet-300/10 px-3 py-1 text-xs text-white">
                  {piece}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="card-violet flex flex-col gap-3 rounded-(--radius-panel) p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <Sparkles className="size-4 text-accent-bright" />
            See it on yourself
          </p>
          <p className="text-sm text-muted">Build your persistent twin once and try any outfit on it — including this one.</p>
          <Link
            href={signedIn ? `/drape?image=${encodeURIComponent(assetUrl(shared.look.image))}&title=${encodeURIComponent(shared.look.name)}` : "/signup"}
            className="btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold"
          >
            <Shirt className="size-4" />
            {signedIn ? "Try a look like this" : "Create your twin — it's free"}
          </Link>
        </div>
      </aside>
    </main>
  );
}
