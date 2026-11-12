"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Copy, Loader2, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { formatDateLabel, formatTime } from "../time";
import type { ChatMessage } from "../types";
import { ChatAvatar } from "./ChatAvatar";

/** A new centred time label after this much silence, as Instagram does. */
const GAP_MS = 60 * 60 * 1000;
/** How far a swipe slides the thread to reveal the times. */
const REVEAL_PX = 64;
/** Within this distance of the end, new messages keep the thread pinned to the bottom. */
const STICKY_PX = 120;
const LONG_PRESS_MS = 450;

const senderName = (m: ChatMessage) => m.sender?.username || m.sender?.email?.split("@")[0] || "Stylist";
const at = (m: ChatMessage) => new Date(m.sentAt).getTime() || 0;
const sameDay = (a: ChatMessage, b: ChatMessage) => new Date(a.sentAt).toDateString() === new Date(b.sentAt).toDateString();
const breaksBetween = (a: ChatMessage, b: ChatMessage) => !sameDay(a, b) || at(b) - at(a) > GAP_MS;
/** One to three emoji on their own are shown large, without a bubble. */
const isEmojiOnly = (text: string) => /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(text) && Array.from(text.trim()).length <= 6 && !/^[\d#*\s]+$/.test(text);

/**
 * Swipe the thread left (touch) or scroll it sideways (trackpad) to slide every message
 * over and reveal its time, then it springs back. Moves the track directly, without re-rendering.
 */
function useRevealTimes() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;
    let offset = 0;
    let start: { x: number; y: number } | null = null;
    let wheelTimer = 0;

    const slide = (px: number, animate: boolean) => {
      offset = px;
      track.style.transition = animate ? "transform 320ms cubic-bezier(0.16, 1, 0.3, 1)" : "none";
      track.style.transform = px ? `translateX(${-px}px)` : "";
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") start = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!start) return;
      const dx = start.x - e.clientX;
      // Eases towards the limit so the slide feels elastic.
      if (dx > 4 && dx > Math.abs(e.clientY - start.y)) slide(REVEAL_PX * (1 - Math.exp(-dx / REVEAL_PX)), false);
    };
    const up = () => {
      start = null;
      if (offset) slide(0, true);
    };
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      slide(Math.min(REVEAL_PX, Math.max(0, offset + e.deltaX)), false);
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => slide(0, true), 450);
    };

    scroller.addEventListener("pointerdown", down);
    scroller.addEventListener("pointermove", move);
    scroller.addEventListener("pointerup", up);
    scroller.addEventListener("pointercancel", up);
    scroller.addEventListener("wheel", wheel, { passive: false });
    return () => {
      scroller.removeEventListener("pointerdown", down);
      scroller.removeEventListener("pointermove", move);
      scroller.removeEventListener("pointerup", up);
      scroller.removeEventListener("pointercancel", up);
      scroller.removeEventListener("wheel", wheel);
      window.clearTimeout(wheelTimer);
    };
  }, []);

  return { scrollerRef, trackRef };
}

/** Long-press on touch (or right-click) opens the message's actions. */
function useLongPress(onFire: () => void) {
  const timer = useRef(0);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const cancel = () => {
    window.clearTimeout(timer.current);
    origin.current = null;
  };
  return {
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.pointerType === "mouse") return;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        navigator.vibrate?.(10);
        onFire();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (origin.current && Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 8) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: ReactMouseEvent) => {
      e.preventDefault();
      cancel();
      onFire();
    },
  };
}

/**
 * The thread, Instagram style: consecutive messages grouped into one stack of bubbles,
 * the other person's photo beside their latest bubble, centred time labels between
 * sittings, and each message's time revealed by swiping the thread left.
 */
export function MessageList({
  messages,
  meId,
  isGroup,
  loading,
  hasMoreOlder,
  loadingOlder,
  onLoadOlder,
  typing,
  typingPerson,
  onDelete,
}: {
  messages: ChatMessage[];
  meId?: string;
  isGroup: boolean;
  loading: boolean;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  typing: boolean;
  typingPerson: { name: string; avatar: string | null };
  onDelete: (id: string) => void;
}) {
  const { scrollerRef, trackRef } = useRevealTimes();
  const atBottom = useRef(true);
  const seen = useRef({ first: "", last: "", height: 0, count: 0 });
  const [menuFor, setMenuFor] = useState<ChatMessage | null>(null);
  // A refresh of the open thread keeps its messages on screen; only an empty thread shows the spinner.
  const waiting = loading && messages.length === 0;

  // Keep the reader's place: jump to the end on open, follow new messages while at the end
  // (or when they're yours), and hold position when older messages are added above.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (waiting) {
      seen.current = { first: "", last: "", height: 0, count: 0 };
      return;
    }
    const first = messages[0]?.id ?? "";
    const lastMsg = messages[messages.length - 1];
    const last = lastMsg?.id ?? "";
    const prev = seen.current;
    if (prev.count && prev.last === last && prev.first !== first) {
      el.scrollTop += el.scrollHeight - prev.height;
    } else if (!prev.count) {
      el.scrollTop = el.scrollHeight;
    } else if (prev.last !== last && (atBottom.current || lastMsg?.senderId === meId)) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    seen.current = { first, last, height: el.scrollHeight, count: messages.length };
  }, [messages, waiting, meId, scrollerRef]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (typing && el && atBottom.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [typing, scrollerRef]);

  // When the keyboard opens the thread gets shorter; stay on the latest message.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollerRef]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_PX;
    if (el.scrollTop < STICKY_PX && hasMoreOlder && !loadingOlder && !waiting) onLoadOlder();
  };

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      className="no-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-3 sm:px-5"
    >
      <div ref={trackRef} className="flex min-h-full flex-col justify-end will-change-transform">
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <Loader2 className="size-4 animate-spin text-muted" />
          </div>
        )}

        {waiting ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-accent-bright" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <ChatAvatar name={typingPerson.name} avatar={typingPerson.avatar} group={isGroup} className="size-20 text-2xl" />
            <p className="mt-4 text-title font-medium text-white">{typingPerson.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Sparkles className="size-3.5 text-cyan" />
              Say hello, or share a look for quick feedback
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const mine = m.senderId === meId;
            const separator = !prev || breaksBetween(prev, m);
            const first = separator || prev.senderId !== m.senderId;
            const last = !next || breaksBetween(m, next) || next.senderId !== m.senderId;
            const emoji = Boolean(m.content) && !m.attachmentUrl && isEmojiOnly(m.content);
            const showSent = mine && !next;

            return (
              <div key={m.id} className={first ? "mt-3" : "mt-0.5"}>
                {separator && (
                  <p className="mb-3 mt-4 text-center text-[11px] font-medium text-muted">
                    {formatDateLabel(m.sentAt)} {formatTime(m.sentAt)}
                  </p>
                )}
                {isGroup && !mine && first && <p className="mb-1 ml-10 text-[11px] text-muted">{senderName(m)}</p>}

                <div className={cn("group relative flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                  {!mine && (
                    <span className="w-8 shrink-0">{last && <ChatAvatar name={senderName(m)} avatar={m.sender?.avatar} className="size-8 text-xs" />}</span>
                  )}

                  <Bubble message={m} mine={mine} first={first} last={last} emoji={emoji} onMenu={() => setMenuFor(m)} />

                  {/* Mouse users: the time and actions appear beside the hovered message. */}
                  <span className={cn("hidden shrink-0 items-center gap-1 self-center opacity-0 transition-opacity group-hover:opacity-100 pointer-fine:flex", mine && "-order-1")}>
                    <time className="text-[11px] tabular-nums text-muted">{formatTime(m.sentAt)}</time>
                    <button
                      type="button"
                      onClick={() => setMenuFor(m)}
                      aria-label="Message actions"
                      className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </span>

                  {/* Touch users: revealed in the right gutter when the thread is swiped left. */}
                  <time className="pointer-events-none absolute right-0 top-1/2 translate-x-[calc(100%+0.75rem)] -translate-y-1/2 whitespace-nowrap text-[11px] tabular-nums text-muted sm:translate-x-[calc(100%+1.25rem)]">
                    {formatTime(m.sentAt)}
                  </time>
                </div>

                {showSent && <p className="mt-1 pr-1 text-right text-[11px] text-muted">Sent</p>}
              </div>
            );
          })
        )}

        {typing && !waiting && (
          <div className="mt-3 flex items-end gap-2" role="status" aria-label="Typing">
            <ChatAvatar name={typingPerson.name} avatar={typingPerson.avatar} group={isGroup} className="size-8 text-xs" />
            <span className="flex h-9 items-center gap-1 rounded-[20px] bg-white/[0.08] px-4">
              <span className="size-1.5 animate-bounce rounded-full bg-subtle [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-subtle [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-subtle" />
            </span>
          </div>
        )}
      </div>

      <Modal open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title="Message" className="pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {menuFor && (
          <div className="flex flex-col gap-2">
            <p className="mb-2 line-clamp-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-sm text-subtle">
              {menuFor.content || "Photo"} <span className="text-muted">· {formatTime(menuFor.sentAt)}</span>
            </p>
            {menuFor.content && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(menuFor.content).catch(() => undefined);
                  setMenuFor(null);
                }}
                className="flex h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm text-white transition-colors hover:bg-white/[0.06]"
              >
                <Copy className="size-4 text-subtle" />
                Copy text
              </button>
            )}
            {menuFor.senderId === meId && (
              <button
                type="button"
                onClick={() => {
                  onDelete(menuFor.id);
                  setMenuFor(null);
                }}
                className="flex h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm text-red-300 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="size-4" />
                Unsend
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

/** Corners tighten where bubbles from the same person stack, like Instagram's message groups. */
function Bubble({
  message: m,
  mine,
  first,
  last,
  emoji,
  onMenu,
}: {
  message: ChatMessage;
  mine: boolean;
  first: boolean;
  last: boolean;
  emoji: boolean;
  onMenu: () => void;
}) {
  const press = useLongPress(onMenu);
  const corners = mine
    ? cn(!first && "rounded-tr-md", !last && "rounded-br-md")
    : cn(!first && "rounded-tl-md", !last && "rounded-bl-md");

  return (
    <div {...press} className={cn("flex min-w-0 max-w-[78%] select-none flex-col gap-0.5 [-webkit-touch-callout:none] sm:max-w-[65%] md:select-text", mine ? "items-end" : "items-start")}>
      {m.attachmentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetUrl(m.attachmentUrl)}
          alt="Shared photo"
          className={cn("max-h-80 w-auto max-w-[min(100%,260px)] rounded-[20px] object-cover ring-1 ring-white/10", corners)}
        />
      )}
      {m.content &&
        (emoji ? (
          <p className="px-1 text-[40px] leading-tight">{m.content}</p>
        ) : (
          <p
            className={cn(
              "whitespace-pre-wrap break-words rounded-[20px] px-3.5 py-2 text-[15px] leading-snug",
              mine ? "bubble-mine text-white" : "bg-white/[0.08] text-ink-soft",
              corners
            )}
          >
            {m.content}
          </p>
        ))}
    </div>
  );
}
