"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, LoaderCircle, Scissors, Send } from "lucide-react";
import { ActionButton, Notice } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { nameOf, socialApi, type QueueLook, type StylistComment, type StylistProfile } from "@/features/social/api";
import { errorMessage } from "@/features/workspace/hooks";

/** Verified stylists' review queue (feature #21): looks shoppers asked a professional about. */
export function StylistQueueView() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<StylistProfile | null | undefined>(undefined);
  const [queue, setQueue] = useState<QueueLook[] | null>(null);
  const [open, setOpen] = useState<QueueLook | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!token) return;
    socialApi
      .stylistQueue(token)
      .then(setQueue)
      .catch((e) => setError(errorMessage(e)));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    socialApi
      .myStylist(token)
      .then((p) => {
        setProfile(p);
        if (p?.status === "VERIFIED") load();
      })
      .catch(() => setProfile(null));
  }, [token, load]);

  if (profile === undefined) {
    return (
      <main className="flex justify-center py-20">
        <LoaderCircle className="size-6 animate-spin text-accent-bright" />
      </main>
    );
  }

  if (profile?.status !== "VERIFIED") {
    return (
      <main className="mx-auto max-w-[640px] px-4 py-16 text-center sm:px-8">
        <Scissors className="mx-auto size-10 text-muted" strokeWidth={1.5} />
        <h1 className="mt-4 text-title text-white">For verified stylists</h1>
        <p className="mt-2 text-sm text-muted">
          {profile ? "Your stylist application is still being reviewed." : "Stylists and tailors can review shoppers' looks once verified."}
        </p>
        <Link href="/profile?tab=stylist" className="btn-primary mt-6 inline-flex h-11 items-center rounded-full px-6 text-sm font-medium">
          {profile ? "View application" : "Apply to be a stylist"}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 lg:py-12">
      <header>
        <h1 className="chrome flex items-center gap-2 text-[2rem] font-medium leading-tight tracking-[-0.03em]">
          <BadgeCheck className="size-7 text-accent-bright" />
          Review queue
        </h1>
        <p className="mt-1 text-sm text-muted">Looks shoppers want a professional opinion on. Suggest fit, drape, accessories or alterations.</p>
      </header>
      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {queue === null ? (
        <LoaderCircle className="mx-auto mt-16 size-6 animate-spin text-accent-bright" />
      ) : queue.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted">No looks are waiting for review right now.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {queue.map((l) => (
            <button key={l.id} type="button" onClick={() => setOpen(l)} className="overflow-hidden rounded-(--radius-card) border border-white/8 bg-white/[0.02] text-left transition hover:border-accent-bright/50">
              <div className="relative aspect-[3/4] bg-white/[0.04]">
                <Photo src={l.image} alt={l.name} />
                {l.reviewedByMe && (
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green/90 px-2 py-0.5 text-[10px] text-canvas">
                    <CheckCircle2 className="size-3" />
                    Reviewed
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm text-white">{l.name}</p>
                <p className="truncate text-xs text-muted">
                  {nameOf(l.owner)} · {l.occasion} · {l.commentCount} comments
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.name ?? ""} className="sm:max-w-[760px]">
        {open && (
          <ReviewPanel
            look={open}
            onPosted={() => {
              setQueue((q) => q?.map((l) => (l.id === open.id ? { ...l, reviewedByMe: true, commentCount: l.commentCount + 1 } : l)) ?? null);
            }}
          />
        )}
      </Modal>
    </main>
  );
}

function ReviewPanel({ look, onPosted }: { look: QueueLook; onPosted: () => void }) {
  const { token } = useAuth();
  const [comments, setComments] = useState<StylistComment[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    socialApi
      .stylistComments(token, look.id)
      .then(setComments)
      .catch(() => setComments([]));
  }, [token, look.id]);

  const post = async () => {
    if (!token || !text.trim()) return;
    setSending(true);
    setError("");
    try {
      const c = await socialApi.postStylistComment(token, look.id, text.trim());
      setComments((list) => [...(list ?? []), { ...c, stylist: { avatar: null, displayName: "You" } }]);
      setText("");
      onPosted();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const pieces = Array.isArray(look.pieces) ? (look.pieces as string[]) : [];

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_300px]">
      <div className="aspect-[3/4] overflow-hidden rounded-(--radius-card) bg-white/[0.04]">
        <Photo src={look.image} alt={look.name} fit="contain" />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-subtle">
          From <span className="text-white">{nameOf(look.owner)}</span> · <span className="capitalize">{look.occasion}</span>
        </p>
        {pieces.length > 0 && <p className="text-xs text-muted">Pieces: {pieces.join(", ")}</p>}
        <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
          {comments === null ? (
            <LoaderCircle className="size-4 animate-spin text-accent-bright" />
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted">Be the first to give feedback.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <p className="text-xs text-white">{c.stylist.displayName ?? "Stylist"}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-subtle">{c.comment}</p>
              </div>
            ))
          )}
        </div>
        <textarea
          rows={4}
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Pin the pallu higher and switch to a contrast gold blouse; add jhumkas."
          aria-label="Your feedback"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none placeholder:text-muted/70 focus:border-accent-bright/70"
        />
        {error && <Notice tone="error">{error}</Notice>}
        <ActionButton onClick={post} loading={sending} disabled={!text.trim()}>
          <Send className="size-4" />
          Post feedback
        </ActionButton>
      </div>
    </div>
  );
}
