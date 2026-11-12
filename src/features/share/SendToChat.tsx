"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, Send, Users } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { chatApi } from "@/features/messages/api";
import type { ChatRoom } from "@/features/messages/types";
import { errorMessage } from "@/features/workspace/hooks";

/** Recent DMs and groups, each with a Send button that posts the image and message into that chat (#18). */
export function SendToChat({ image, message, onError }: { image: string; message: string; onError: (message: string) => void }) {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[] | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([chatApi.getConversations(token).catch(() => []), chatApi.getGroups(token).catch(() => [])]).then(([dms, groups]) => {
      if (!cancelled) setRooms([...dms, ...groups].sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "")).slice(0, 12));
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const send = async (room: ChatRoom) => {
    if (!token) return;
    setSending(room.id);
    try {
      await chatApi.sendMessage(token, {
        conversationId: room.type === "dm" ? room.conversationId ?? room.id.replace(/^conv_/, "") : undefined,
        groupId: room.type === "group" ? room.groupId ?? room.id.replace(/^group_/, "") : undefined,
        content: message,
        attachmentUrl: image,
        attachmentType: "image",
      });
      setSentTo((s) => ({ ...s, [room.id]: true }));
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setSending(null);
    }
  };

  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">
        <Users className="size-3.5" />
        Send to a chat
      </p>
      {!token ? (
        <p className="text-sm text-muted">Sign in to send this to your chats.</p>
      ) : rooms === null ? (
        <LoaderCircle className="size-5 animate-spin text-accent-bright" />
      ) : rooms.length === 0 ? (
        <p className="text-sm text-muted">No chats yet. Add friends in Messages to share with them.</p>
      ) : (
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {rooms.map((room) => (
            <li key={room.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]">
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/30 text-sm text-white">
                {room.avatar ? <Photo src={room.avatar} alt="" /> : room.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-white">{room.name}</span>
              <button
                type="button"
                onClick={() => send(room)}
                disabled={sending !== null || sentTo[room.id]}
                className="flex h-8 items-center gap-1.5 rounded-full bg-white/8 px-3 text-xs text-white hover:bg-white/12 disabled:opacity-60"
              >
                {sending === room.id ? <LoaderCircle className="size-3.5 animate-spin" /> : sentTo[room.id] ? <Check className="size-3.5" /> : <Send className="size-3.5" />}
                {sentTo[room.id] ? "Sent" : "Send"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
