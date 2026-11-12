"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, LoaderCircle, MessageSquareText, Scissors, Share2, Shirt } from "lucide-react";
import { ActionButton, Notice } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi, type StylistComment } from "@/features/social/api";
import { workspaceApi, type Look } from "@/features/workspace/api";
import { errorMessage } from "@/features/workspace/hooks";
import { ShareSheet } from "@/features/share/ShareSheet";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { POSES } from "@/data/look-edits";

/** A saved look with its poses and video, stylist feedback (#21) and sharing (#22). */
export function LookDetail({ look, onChange }: { look: Look; onChange: (next: Look) => void }) {
  const { token } = useAuth();
  const [view, setView] = useState<string>("main");
  const [comments, setComments] = useState<StylistComment[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!token) return;
    socialApi
      .stylistComments(token, look.id)
      .then(setComments)
      .catch(() => setComments([]));
  }, [token, look.id]);

  const toggleReview = async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      onChange(await workspaceApi.requestStylistReview(token, look.id, !look.stylistReviewRequested));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pose = look.poseVariants.find((p) => p.pose === view);

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_240px]">
      <div className="flex flex-col gap-3">
        <div className="aspect-[3/4] overflow-hidden rounded-(--radius-card) bg-white/[0.04]">
          {view === "video" && look.videoUrl ? (
            <video src={assetUrl(look.videoUrl)} className="size-full object-contain" autoPlay muted loop playsInline controls />
          ) : (
            <Photo src={pose?.imageUrl ?? look.image} alt={look.name} fit="contain" />
          )}
        </div>
        {(look.poseVariants.length > 0 || look.videoUrl) && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {[{ id: "main", label: "Look", img: look.image }, ...look.poseVariants.map((p) => ({ id: p.pose, label: POSES.find((x) => x.id === p.pose)?.label ?? p.pose, img: p.imageUrl }))].map((t) => (
              <button key={t.id} type="button" onClick={() => setView(t.id)} className="flex w-14 shrink-0 flex-col items-center gap-1">
                <span className={cn("aspect-[3/4] w-full overflow-hidden rounded-lg border", view === t.id ? "border-accent-bright" : "border-white/10 opacity-80")}>
                  <Photo src={t.img} alt="" />
                </span>
                <span className="w-full truncate text-center text-[10px] text-muted">{t.label}</span>
              </button>
            ))}
            {look.videoUrl && (
              <button type="button" onClick={() => setView("video")} className={cn("flex h-[74px] w-14 shrink-0 items-center justify-center rounded-lg border text-[10px]", view === "video" ? "border-accent-bright text-white" : "border-white/10 text-muted")}>
                Video
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <ActionButton onClick={() => setSharing(true)}>
            <Share2 className="size-4" />
            Share
          </ActionButton>
          <Link href={`/drape?lookImage=${encodeURIComponent(look.image)}&title=${encodeURIComponent(look.name)}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/12 text-sm text-subtle hover:text-white">
            <Shirt className="size-4" />
            Open in Drape
          </Link>
        </div>

        <section className="rounded-(--radius-card) border border-white/10 bg-white/[0.02] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <Scissors className="size-4 text-accent-bright" />
            Stylist review
          </p>
          <p className="mt-1 text-xs text-muted">
            {look.stylistReviewRequested ? "Verified stylists can see this look and leave suggestions." : "Ask a verified stylist or tailor to suggest how to restyle this look."}
          </p>
          <ActionButton variant={look.stylistReviewRequested ? "ghost" : "primary"} className="mt-3 h-9 w-full" loading={busy} onClick={toggleReview}>
            {look.stylistReviewRequested ? "Stop asking" : "Ask a stylist"}
          </ActionButton>
          {error && (
            <div className="mt-2">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">
            <MessageSquareText className="size-3.5" />
            Feedback
          </p>
          {comments === null ? (
            <LoaderCircle className="size-4 animate-spin text-accent-bright" />
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted">No stylist feedback yet.</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {comments.map((c) => (
                <li key={c.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <p className="flex items-center gap-1.5 text-xs text-white">
                    <BadgeCheck className="size-3.5 text-accent-bright" />
                    {c.stylist.displayName ?? "Stylist"}
                    {c.stylist.city && <span className="text-muted">· {c.stylist.city}</span>}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-subtle">{c.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ShareSheet open={sharing} onClose={() => setSharing(false)} lookId={look.id} image={look.image} video={look.videoUrl} name={look.name} />
    </div>
  );
}
