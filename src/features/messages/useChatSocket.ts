"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { WS_BASE_URL } from "@/lib/api/config";
import type { ChatMessage, ChatRoom } from "./types";

interface UseChatSocketOptions {
  token: string | null;
  activeRoom: ChatRoom | null;
  onReceiveMessage?: (message: ChatMessage & { conversationId?: string; groupId?: string }) => void;
  onMessageEdited?: (updated: ChatMessage) => void;
  onMessageDeleted?: (data: { messageId: string }) => void;
  onFriendNotification?: (event: "friendRequest" | "acceptFriendRequest", data: any) => void;
}

export function useChatSocket({
  token,
  activeRoom,
  onReceiveMessage,
  onMessageEdited,
  onMessageDeleted,
  onFriendNotification,
}: UseChatSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store callbacks in refs to avoid socket reconnect loops
  const onReceiveMessageRef = useRef(onReceiveMessage);
  onReceiveMessageRef.current = onReceiveMessage;

  const onMessageEditedRef = useRef(onMessageEdited);
  onMessageEditedRef.current = onMessageEdited;

  const onMessageDeletedRef = useRef(onMessageDeleted);
  onMessageDeletedRef.current = onMessageDeleted;

  const onFriendNotificationRef = useRef(onFriendNotification);
  onFriendNotificationRef.current = onFriendNotification;

  // Initialize Socket connection
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(WS_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on("connect", () => {
      setIsConnected(true);
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message);
      setIsConnected(false);
    });

    // Online Presence
    s.on("initialOnlineUsers", (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    });

    s.on("userOnline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    s.on("userOffline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Real-time Messages
    s.on("receiveMessage", (message: ChatMessage & { conversationId?: string; groupId?: string }) => {
      onReceiveMessageRef.current?.(message);
    });

    s.on("messageEdited", (updated: ChatMessage) => {
      onMessageEditedRef.current?.(updated);
    });

    s.on("messageDeleted", (data: { messageId: string }) => {
      onMessageDeletedRef.current?.(data);
    });

    // Typing Indicators
    s.on("typingStart", (data: { userId: string; conversationId?: string; groupId?: string }) => {
      setTypingUsers((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
    });

    s.on("typingStop", (data: { userId: string; conversationId?: string; groupId?: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    // Real-time Friend Events
    s.on("friendRequest", (req: any) => {
      onFriendNotificationRef.current?.("friendRequest", req);
    });

    s.on("acceptFriendRequest", (req: any) => {
      onFriendNotificationRef.current?.("acceptFriendRequest", req);
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  // Join/leave active chat room
  useEffect(() => {
    if (!socket || !activeRoom) return;

    const isDM = activeRoom.type === "dm";
    const roomId = isDM ? activeRoom.conversationId : activeRoom.groupId;
    if (!roomId) return;

    const joinEvent = isDM ? "joinConversation" : "joinGroup";
    const leaveEvent = isDM ? "leaveConversation" : "leaveGroup";
    const payload = isDM
      ? { conversationId: activeRoom.conversationId }
      : { groupId: activeRoom.groupId };

    socket.emit(joinEvent, payload);
    setTypingUsers([]);

    return () => {
      socket.emit(leaveEvent, payload);
      setTypingUsers([]);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      isTypingRef.current = false;
    };
  }, [socket, activeRoom?.conversationId, activeRoom?.groupId]);

  // Emit Send Message
  const sendMessageSocket = useCallback(
    (content: string, attachmentUrl?: string, attachmentType?: string) => {
      if (!socket || !activeRoom) return false;

      const isDM = activeRoom.type === "dm";
      const payload: any = {
        content: content.trim(),
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null,
      };

      if (isDM) {
        payload.conversationId = activeRoom.conversationId;
      } else {
        payload.groupId = activeRoom.groupId;
      }

      socket.emit("sendMessage", payload);

      // Stop typing immediately upon sending
      if (isTypingRef.current) {
        const stopPayload = isDM
          ? { conversationId: activeRoom.conversationId }
          : { groupId: activeRoom.groupId };
        socket.emit("typingStop", stopPayload);
        isTypingRef.current = false;
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      }

      return true;
    },
    [socket, activeRoom]
  );

  // Emit Typing Start/Stop
  const emitTyping = useCallback(() => {
    if (!socket || !activeRoom) return;

    const isDM = activeRoom.type === "dm";
    const payload = isDM
      ? { conversationId: activeRoom.conversationId }
      : { groupId: activeRoom.groupId };

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typingStart", payload);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (socket) {
        socket.emit("typingStop", payload);
      }
      isTypingRef.current = false;
    }, 3500);
  }, [socket, activeRoom]);

  // Emit Read Receipt
  const markMessageRead = useCallback(
    (messageId: string) => {
      if (!socket) return;
      socket.emit("messageRead", { messageId });
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessageSocket,
    emitTyping,
    markMessageRead,
  };
}
