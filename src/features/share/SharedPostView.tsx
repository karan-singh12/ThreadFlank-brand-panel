"use client";

import Link from "next/link";
import { BadgeCheck, Compass, Heart, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { toPostComment, type ApiBrandPost } from "@/features/discover/api";
import { timeAgo } from "@/features/discover/time";
import { assetUrl } from "@/lib/api/config";

const price = (p: string) => (/^[^\d]/.test(p) ? p : `$${p}`);

/** Landing page for a shared Discover post: the look, the brand, what's tagged, and a way in. */
export function SharedPostView({ post }: { post: ApiBrandPost }) {
  const { status } = useAuth();
  const signedIn = status === "authenticated";
  const image = post.images?.[0] ?? "";
  const comments = (post.latestComments ?? []).map(toPostComment);
  const tryOn = `/drape?image=${encodeURIComponent(assetUrl(image))}&brand=${encodeURIComponent(post.brand.name)}&title=${encodeURIComponent((post.title || post.caption).slice(0, 50))}`;

  return (
    <main className="mx-auto grid max-w-[1080px] gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_380px] lg:py-16">
      <section className="overflow-hidden rounded-(--radius-frame) border border-white/10 bg-white/[0.03]">
        <div className="aspect-[4/5]">{image && <Photo src={image} alt={post.title || post.caption} />}</div>
      </section>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:h-fit">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#c4b1fa,#7b61f0)] p-[2px]">
            <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-canvas text-sm text-white">
              {post.brand.logoUrl ? <Photo src={post.brand.logoUrl} alt="" /> : post.brand.name.charAt(0)}
            </span>
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-body font-medium text-white">
              <span className="truncate">{post.brand.name}</span>
              {post.brand.isVerified && <BadgeCheck className="size-4 shrink-0 fill-accent text-white" aria-label="Verified" />}
            </p>
            <p className="text-xs text-muted">
              @{post.brand.slug} · {timeAgo(post.publishedAt)}
              {post.category && ` · ${post.category}`}
            </p>
          </div>
        </div>

        <div>
          {post.title && <h1 className="chrome text-[1.75rem] font-medium leading-tight tracking-[-0.03em]">{post.title}</h1>}
          <p className="mt-2 text-sm leading-relaxed text-subtle">{post.caption}</p>
          <p className="mt-3 flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Heart className="size-4" /> {(post.likesCount ?? 0).toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="size-4" /> {(post.commentsCount ?? 0).toLocaleString()}
            </span>
          </p>
        </div>

        {(post.taggedProducts ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.taggedProducts!.map((t) => (
              <span key={t.name} className="flex items-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-300/10 px-3 py-1 text-xs text-white">
                <ShoppingBag className="size-3" />
                {t.name}
                {t.price && <span className="text-green">· {price(t.price)}</span>}
              </span>
            ))}
          </div>
        )}

        <div className="card-violet flex flex-col gap-3 rounded-(--radius-panel) p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <Sparkles className="size-4 text-violet-200" />
            See it on yourself
          </p>
          <p className="text-sm text-muted">Build your persistent twin once and try any outfit on it, including this one.</p>
          <Link href={signedIn ? tryOn : "/signup"} className="btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold">
            <Sparkles className="size-4" />
            {signedIn ? "Try it on your twin" : "Create your twin, it's free"}
          </Link>
          {signedIn && (
            <Link href="/discover" className="inline-flex items-center justify-center gap-2 text-sm text-violet-200 hover:text-white">
              <Compass className="size-4" />
              More on Discover
            </Link>
          )}
        </div>

        {comments.length > 0 && (
          <ul className="flex flex-col gap-2">
            {comments.map((c) => (
              <li key={c.id} className="text-sm text-subtle">
                <span className="mr-1.5 font-medium text-white">{c.author}</span>
                {c.text}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </main>
  );
}
