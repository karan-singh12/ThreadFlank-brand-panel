"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Bookmark, ExternalLink, Heart, Link2, LoaderCircle, MessageCircle, MoreHorizontal, Send, Shirt, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { Art } from "@/components/ui/Art";
import { Avatar } from "@/components/ui/Avatar";
import { Photo } from "@/components/ui/Photo";
import { EASE } from "@/components/motion/Reveal";
import { useAuth } from "@/features/auth/AuthProvider";
import { PostShareSheet } from "@/features/share/PostShareSheet";
import { errorMessage } from "@/features/workspace/hooks";
import { cn } from "@/lib/utils";
import { discoverContent as copy, type Brand, type BrandPost, type PostComment } from "@/data/app-content";
import { discoverApi, toPostComment } from "./api";
import { StockPanel } from "./StockPanel";
import { timeAgo } from "./time";

const PREVIEW_COMMENTS = 2;

export function PostCard({ post, brand }: { post: BrandPost; brand: Brand; username?: string; token?: string | null }) {
  const { user, token } = useAuth();
  const me = user?.username || user?.email.split("@")[0] || "you";

  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(post.saved);
  const [burst, setBurst] = useState(0);
  const [comments, setComments] = useState<PostComment[]>(post.comments);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showAll, setShowAll] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [draft, setDraft] = useState("");
  const [tagsOpen, setTagsOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [note, setNote] = useState<{ text: string; saved?: boolean } | null>(null);
  const [error, setError] = useState("");
  const likeBusy = useRef(false);
  const saveBusy = useRef(false);
  const noteTimer = useRef<number | undefined>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);

  const visible = showAll ? comments : comments.slice(-PREVIEW_COMMENTS);
  const hiddenCount = Math.max(0, commentsCount - visible.length);
  const drapeUrl = `/drape?image=${encodeURIComponent(post.image)}&garmentUrl=${encodeURIComponent(post.image)}&brand=${encodeURIComponent(brand.name)}&title=${encodeURIComponent(post.caption.slice(0, 50))}`;
  const postPath = `/p/${post.id}`;

  const flash = (text: string, extra: { saved?: boolean } = {}) => {
    window.clearTimeout(noteTimer.current);
    setNote({ text, ...extra });
    noteTimer.current = window.setTimeout(() => setNote(null), 3200);
  };
  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);

  /** Optimistic like; the server's answer (and count) wins, and a failure puts it back. */
  const toggleLike = async () => {
    if (likeBusy.current || !token) return;
    likeBusy.current = true;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    if (next) setBurst((n) => n + 1);
    try {
      const res = await discoverApi.toggleLike(token, post.id);
      setLiked(res.liked);
      setLikes(res.likesCount);
    } catch (e) {
      setLiked(!next);
      setLikes((n) => n - (next ? 1 : -1));
      setError(errorMessage(e));
    } finally {
      likeBusy.current = false;
    }
  };

  const likeFromImage = () => (liked ? setBurst((n) => n + 1) : toggleLike());

  const toggleSave = async () => {
    if (saveBusy.current || !token) return;
    saveBusy.current = true;
    const next = !saved;
    setSaved(next);
    try {
      const res = await discoverApi.toggleSave(token, post.id);
      setSaved(res.saved);
      flash(res.saved ? copy.savedNote : copy.unsavedNote, { saved: res.saved });
    } catch (e) {
      setSaved(!next);
      setError(errorMessage(e));
    } finally {
      saveBusy.current = false;
    }
  };

  const loadAllComments = async () => {
    setLoadingAll(true);
    setError("");
    try {
      const all = (await discoverApi.listComments(token, post.id)).map(toPostComment);
      setComments(all);
      setCommentsCount(all.length);
      setShowAll(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingAll(false);
    }
  };

  const addComment = async (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !token) return;
    const tempId = `local-${Date.now()}`;
    setComments((c) => [...c, { id: tempId, userId: user?.id, author: me, avatar: user?.avatar, text, pending: true }]);
    setCommentsCount((n) => n + 1);
    setDraft("");
    setError("");
    try {
      const created = toPostComment(await discoverApi.addComment(token, post.id, text));
      setComments((c) => c.map((item) => (item.id === tempId ? created : item)));
    } catch (err) {
      setComments((c) => c.filter((item) => item.id !== tempId));
      setCommentsCount((n) => n - 1);
      setDraft(text);
      setError(errorMessage(err));
    }
  };

  const deleteComment = async (comment: PostComment) => {
    if (!token) return;
    const index = comments.findIndex((c) => c.id === comment.id);
    setComments((c) => c.filter((item) => item.id !== comment.id));
    setCommentsCount((n) => n - 1);
    try {
      const res = await discoverApi.deleteComment(token, post.id, comment.id);
      setCommentsCount(res.commentsCount);
    } catch (e) {
      setComments((c) => [...c.slice(0, index), comment, ...c.slice(index)]);
      setCommentsCount((n) => n + 1);
      setError(errorMessage(e));
    }
  };

  const copyLink = async () => {
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${postPath}`);
      flash(copy.linkCopied);
    } catch {
      setError("Couldn't copy the link.");
    }
  };

  return (
    <article className="relative w-full border-b border-white/10 bg-[#0d0c1d]/30 pb-4 pt-1 transition-colors last:border-b-0">
      <header className="flex items-center gap-3 px-4 py-3">
        <span className="flex size-10 min-w-10 min-h-10 shrink-0 aspect-square items-center justify-center rounded-full bg-[linear-gradient(135deg,#c4b1fa,#7b61f0)] p-[2px]">
          <span className="flex size-full aspect-square items-center justify-center rounded-full bg-canvas p-[2px] overflow-hidden">
            <Avatar tone={brand.tone} image={brand.image} name={brand.name} className="size-full overflow-hidden rounded-full aspect-square" />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-medium text-white">
            <span className="truncate">{brand.name}</span>
            {brand.verified && <BadgeCheck className="size-4 shrink-0 fill-accent text-white" aria-label="Verified" />}
          </p>
          <p className="text-xs text-muted">
            {brand.handle} · {post.postedAgo}
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-subtle">{post.category}</span>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-white"
          >
            <MoreHorizontal className="size-5" />
          </button>
          {menuOpen && (
            <div role="menu" className="animate-rise-in absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-white/12 bg-[#14132b] p-1 shadow-2xl">
              <button type="button" role="menuitem" onClick={copyLink} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-subtle hover:bg-white/[0.06] hover:text-white">
                <Link2 className="size-4" />
                {copy.copyLink}
              </button>
              <Link href={postPath} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-subtle hover:bg-white/[0.06] hover:text-white">
                <ExternalLink className="size-4" />
                {copy.openPost}
              </Link>
              <Link href={drapeUrl} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-subtle hover:bg-white/[0.06] hover:text-white">
                <Shirt className="size-4" />
                {copy.tryOn}
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="relative aspect-[4/5] w-full select-none" onDoubleClick={likeFromImage}>
        <Art image={post.image} tone={post.tone} alt={post.caption} className="absolute inset-0" sizes="(min-width: 1024px) 600px, 100vw" />

        <AnimatePresence>
          {burst > 0 && (
            <motion.span
              key={burst}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.15, 1, 1.1] }}
              transition={{ duration: 0.9, ease: EASE }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <Heart className="size-24 fill-white text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.5)]" />
            </motion.span>
          )}
        </AnimatePresence>

        {post.tags.length > 0 && (
          <button
            type="button"
            onClick={() => setTagsOpen((v) => !v)}
            aria-expanded={tagsOpen}
            aria-label={copy.shopLabel}
            className="glass-pill absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-full text-white"
          >
            <Tag className="size-4" />
          </button>
        )}
        <AnimatePresence>
          {tagsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute bottom-14 left-3 flex flex-col gap-2"
            >
              {post.tags.map((t) => (
                <span key={t.name} className="flex items-center gap-2 rounded-xl bg-canvas/85 px-3 py-2 text-xs text-white backdrop-blur-md">
                  <ShoppingBag className="size-3.5 text-cyan" />
                  {t.name}
                  <span className="text-green">{t.price}</span>
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved / copied confirmation */}
        <AnimatePresence>
          {note && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-canvas/85 px-3.5 py-2.5 text-sm text-white backdrop-blur-md"
            >
              {note.text}
              {note.saved && (
                <Link href="/saved" className="text-xs font-medium text-violet-200 hover:text-white">
                  {copy.openSaved} →
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 pb-3 pt-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            className="flex size-10 items-center justify-center rounded-full transition-transform active:scale-90"
          >
            <Heart className={cn("size-6 transition-colors", liked ? "fill-[#ff4d7d] text-[#ff4d7d]" : "text-white")} strokeWidth={1.75} />
          </button>
          <label htmlFor={`comment-${post.id}`} className="flex size-10 cursor-pointer items-center justify-center rounded-full" aria-label="Comment">
            <MessageCircle className="size-6 text-white" strokeWidth={1.75} />
          </label>
          <button type="button" onClick={() => setSharing(true)} aria-label="Share" className="flex size-10 items-center justify-center rounded-full transition-transform active:scale-90">
            <Send className="size-[22px] text-white" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={toggleSave}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save"}
            className="flex size-10 items-center justify-center rounded-full transition-transform active:scale-90"
          >
            <Bookmark className={cn("size-6 transition-colors", saved ? "fill-violet-200 text-violet-200" : "text-white")} strokeWidth={1.75} />
          </button>

          <Link
            href={drapeUrl}
            style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.12)" }}
            className="btn-primary ml-auto flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 active:scale-95"
          >
            <Shirt className="size-3.5" />
            <span>Try On Look</span>
          </Link>
        </div>

        <p className="mt-1 px-1 text-sm font-medium text-white">{copy.likes(likes)}</p>
        <p className="mt-1.5 px-1 text-sm leading-relaxed text-ink-soft">
          <span className="mr-1.5 font-medium text-white">{brand.handle.startsWith("@") ? brand.handle.slice(1) : brand.handle}</span>
          {post.caption}
        </p>

        {post.variants && post.variants.length > 0 && <StockPanel variants={post.variants} postImage={post.image} brandName={brand.name} />}

        {post.tags.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-1">
            {post.tags.map((t) => (
              <span key={t.name} className="flex shrink-0 items-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-300/10 px-3 py-1 text-xs text-white">
                <ShoppingBag className="size-3" />
                {t.name} · <span className="text-green">{t.price}</span>
              </span>
            ))}
          </div>
        )}

        {hiddenCount > 0 && !showAll && (
          <button type="button" onClick={loadAllComments} disabled={loadingAll} className="mt-2.5 flex items-center gap-2 px-1 text-sm text-muted hover:text-subtle disabled:opacity-70">
            {loadingAll && <LoaderCircle className="size-3.5 animate-spin" />}
            {loadingAll ? copy.loadingComments : copy.viewComments(commentsCount)}
          </button>
        )}
        {visible.length > 0 && (
          <ul className={cn("mt-2 flex flex-col gap-2 px-1", showAll && "max-h-80 overflow-y-auto pr-1")}>
            {visible.map((c) => {
              const mine = Boolean(user && c.userId === user.id);
              return (
                <li key={c.id} className={cn("group flex items-start gap-2.5 text-sm text-ink-soft", c.pending && "opacity-60")}>
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-300/15 text-[10px] font-medium text-violet-100">
                    {c.avatar ? <Photo src={c.avatar} alt="" /> : c.author.charAt(0).toUpperCase()}
                  </span>
                  <p className="min-w-0 flex-1 break-words">
                    <span className="mr-1.5 font-medium text-white">{c.author}</span>
                    {c.text}
                    {c.createdAt && <span className="ml-2 text-[11px] text-muted">{timeAgo(c.createdAt)}</span>}
                  </p>
                  {mine && !c.pending && (
                    <button
                      type="button"
                      onClick={() => deleteComment(c)}
                      aria-label={copy.deleteComment}
                      title={copy.deleteComment}
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {error && (
          <p role="alert" className="mt-2 px-1 text-xs text-rose-300">
            {error}
          </p>
        )}

        <form onSubmit={addComment} className="mt-3 flex items-center gap-2 border-t border-white/8 px-1 pt-3">
          <input
            id={`comment-${post.id}`}
            value={draft}
            maxLength={500}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={copy.commentPlaceholder}
            className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
          />
          <button type="submit" disabled={!draft.trim()} className="text-sm font-medium text-violet-200 transition-opacity hover:text-white disabled:opacity-40">
            {copy.postButton}
          </button>
        </form>
      </div>

      <PostShareSheet open={sharing} onClose={() => setSharing(false)} post={post} brand={brand} />
    </article>
  );
}
