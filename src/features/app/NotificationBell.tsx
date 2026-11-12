"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi, type AppNotification } from "@/features/social/api";
import { cn } from "@/lib/utils";
import { useSocketEvent } from "./socket";

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

/** In-app notifications: circle invites, borrow requests, events, GRWM, stylist feedback. */
export function NotificationBell({ inMenu }: { inMenu?: boolean } = {}) {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!token) return;
    socialApi
      .notifications(token)
      .then((res) => {
        setItems(res.items);
        setUnread(res.unread);
      })
      .catch(() => undefined);
  }, [token]);

  useEffect(load, [load]);

  useSocketEvent<{ notification: AppNotification }>("notification:new", ({ notification }) => {
    setItems((list) => [notification, ...list.filter((n) => n.id !== notification.id)].slice(0, 30));
    setUnread((n) => n + 1);
  });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const openItem = async (n: AppNotification) => {
    setOpen(false);
    if (token && !n.readAt) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      socialApi.readNotification(token, n.id).catch(() => undefined);
    }
    if (n.link) router.push(n.link);
  };

  const readAll = async () => {
    if (!token) return;
    setItems((list) => list.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    setUnread(0);
    socialApi.readAllNotifications(token).catch(() => undefined);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className={cn(
          "relative flex items-center justify-center rounded-full text-subtle transition-colors hover:text-white",
          inMenu
            ? "size-8 border border-white/15 bg-white/[0.06] hover:bg-white/[0.12]"
            : "size-10 border border-white/12 hover:border-white/25"
        )}
      >
        <Bell className={inMenu ? "size-3.5" : "size-4"} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-bright px-1 text-[10px] font-medium text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-[70] w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/12 bg-[#0e0d24] shadow-2xl",
            inMenu ? "right-0 top-10 sm:-left-20 sm:right-auto" : "right-0 top-12"
          )}
        >
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <p className="text-sm font-medium text-white">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="flex items-center gap-1 text-xs text-accent-bright hover:text-white">
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => openItem(n)} className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]", !n.readAt && "bg-accent/[0.08]")}>
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-accent-bright")} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white">{n.title}</span>
                      {n.body && <span className="mt-0.5 block truncate text-xs text-muted">{n.body}</span>}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">{ago(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
