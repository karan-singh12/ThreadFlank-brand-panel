"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  MessagesSquare,
  MoreVertical,
  Phone,
  Search,
  Sparkles,
  SquarePen,
  Trash2,
  UserMinus,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { chatApi } from "./api";
import { useChatSocket } from "./useChatSocket";
import { useCalls } from "@/features/calls/CallProvider";
import { AddFriendModal } from "./components/AddFriendModal";
import { ChatAvatar } from "./components/ChatAvatar";
import { Composer } from "./components/Composer";
import { MessageList } from "./components/MessageList";
import { shortAgo } from "./time";
import type { ChatMessage, ChatRoom, FriendRequestItem, FriendUser } from "./types";

type SidebarTab = "chats" | "friends";

const friendName = (f: FriendUser) => f.username || f.email.split("@")[0];

export function MessagesView() {
  const { user, token, status: authStatus } = useAuth();
  const { startCall, busy: callBusy } = useCalls();

  // Sidebar & Navigation state
  const [tab, setTab] = useState<SidebarTab>("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Chat Rooms & Messages
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const olderBusy = useRef(false);

  // Friends & Requests
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Input & attachments
  const [draft, setDraft] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Modals & Popups
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Show Toast
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch Rooms (DMs + Groups)
  const loadRooms = useCallback(async () => {
    if (!token) return;
    setLoadingRooms(true);
    try {
      const [dms, groups] = await Promise.all([
        chatApi.getConversations(token).catch(() => []),
        chatApi.getGroups(token).catch(() => []),
      ]);

      const combined = [...dms, ...groups];
      combined.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setRooms(combined);

      // Keep active room in sync
      if (activeRoom) {
        const found = combined.find((r) => r.id === activeRoom.id);
        if (found) setActiveRoom(found);
      }
    } catch (err) {
      console.error("Failed to load rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  }, [token, activeRoom?.id]);

  // Fetch Friends and Requests
  const loadFriendsData = useCallback(async () => {
    if (!token) return;
    setLoadingFriends(true);
    try {
      const [friendsList, requestsList] = await Promise.all([
        chatApi.fetchFriendsList(token).catch(() => []),
        chatApi.fetchFriendRequests(token, "all").catch(() => []),
      ]);
      setFriends(friendsList);
      setIncomingRequests(requestsList.filter((r) => r.status === "PENDING" && r.receiverId === user?.id));
    } catch (err) {
      console.error("Failed to load friends:", err);
    } finally {
      setLoadingFriends(false);
    }
  }, [token, user?.id]);

  // Fetch Messages for active room
  const loadMessages = useCallback(
    async (room: ChatRoom) => {
      if (!token) return;
      setLoadingMessages(true);
      try {
        const isDM = room.type === "dm";
        const roomId = isDM ? room.conversationId! : room.groupId!;
        const msgs = isDM
          ? await chatApi.getConversationMessages(token, roomId, { take: 50 })
          : await chatApi.getGroupMessages(token, roomId, { take: 50 });

        setMessages(msgs);
        setHasMoreOlder(msgs.length >= 50);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token]
  );

  // Load older messages when the reader scrolls to the top (the list keeps their place).
  const loadOlderMessages = async () => {
    if (!token || !activeRoom || messages.length === 0 || olderBusy.current) return;
    olderBusy.current = true;
    const oldestId = messages[0].id;
    setLoadingOlder(true);
    try {
      const isDM = activeRoom.type === "dm";
      const roomId = isDM ? activeRoom.conversationId! : activeRoom.groupId!;
      const older = isDM
        ? await chatApi.getConversationMessages(token, roomId, { take: 50, before: oldestId })
        : await chatApi.getGroupMessages(token, roomId, { take: 50, before: oldestId });

      setHasMoreOlder(older.length >= 50);
      if (older.length > 0) setMessages((prev) => [...older, ...prev]);
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingOlder(false);
      olderBusy.current = false;
    }
  };

  // Socket event callbacks
  const handleReceiveMessage = useCallback(
    (newMsg: ChatMessage & { conversationId?: string; groupId?: string }) => {
      setMessages((prev) => {
        const isCurrentDM = activeRoom?.type === "dm" && newMsg.conversationId === activeRoom.conversationId;
        const isCurrentGroup = activeRoom?.type === "group" && newMsg.groupId === activeRoom.groupId;

        if (isCurrentDM || isCurrentGroup) {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        }
        return prev;
      });

      // Update room in sidebar
      setRooms((prev) => {
        const updated = prev.map((r) => {
          const matchDM = r.type === "dm" && r.conversationId === newMsg.conversationId;
          const matchGroup = r.type === "group" && r.groupId === newMsg.groupId;
          if (matchDM || matchGroup) {
            return {
              ...r,
              lastMessage: newMsg.content || (newMsg.attachmentUrl ? "Sent a photo" : ""),
              lastMessageAt: newMsg.sentAt,
            };
          }
          return r;
        });
        return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
    },
    [activeRoom]
  );

  const handleMessageDeleted = useCallback((data: { messageId: string }) => {
    setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
  }, []);

  const handleFriendNotification = useCallback(
    (type: "friendRequest" | "acceptFriendRequest") => {
      loadFriendsData();
      if (type === "friendRequest") {
        showToast("New friend request received!");
      } else {
        showToast("Friend request accepted! You can now chat.");
        loadRooms();
      }
    },
    [loadFriendsData, loadRooms, showToast]
  );

  // Hook into WebSocket
  const { isConnected, onlineUsers, typingUsers, sendMessageSocket, emitTyping } = useChatSocket({
    token,
    activeRoom,
    onReceiveMessage: handleReceiveMessage,
    onMessageDeleted: handleMessageDeleted,
    onFriendNotification: handleFriendNotification,
  });

  // Initial load
  useEffect(() => {
    if (token) {
      loadRooms();
      loadFriendsData();
    }
  }, [token, loadRooms, loadFriendsData]);

  // Load messages when another room opens. Keyed on the id: refreshing the sidebar replaces the
  // room object, and reloading then would flash the thread.
  const activeRoomId = activeRoom?.id;
  useEffect(() => {
    if (activeRoom) loadMessages(activeRoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, loadMessages]);

  // Open / Switch chat room
  const openRoom = (room: ChatRoom) => {
    if (room.id !== activeRoom?.id) setMessages([]);
    setActiveRoom(room);
    setRoomMenuOpen(false);
    setMobileChatOpen(true);
  };

  const closeRoom = () => {
    setMobileChatOpen(false);
    setActiveRoom(null);
    setMessages([]);
    setRoomMenuOpen(false);
  };

  // Start chat with a friend
  const startChatWithFriend = async (friend: FriendUser) => {
    if (!token) return;
    try {
      const conv = await chatApi.createConversation(token, friend.id);
      const room: ChatRoom = {
        id: `conv_${conv.id}`,
        conversationId: conv.id,
        type: "dm",
        name: friendName(friend),
        avatar: friend.avatar || null,
        otherId: friend.id,
        lastMessage: "Conversation opened",
        lastMessageAt: new Date().toISOString(),
        online: friend.isOnline,
      };

      setRooms((prev) => [room, ...prev.filter((r) => r.conversationId !== conv.id)]);
      setTab("chats");
      openRoom(room);
    } catch (err) {
      console.error("Failed to open chat with friend:", err);
      showToast("Unable to start chat conversation.");
    }
  };

  // Handle Remove Friend
  const handleRemoveFriend = async (friend: FriendUser) => {
    if (!token) return;
    const name = friend.username || friend.email;
    if (!confirm(`Are you sure you want to remove ${name} from friends?`)) return;

    try {
      await chatApi.removeFriend(token, friend.id);
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
      showToast(`${name} removed from friends.`);
      loadFriendsData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove friend");
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!token) return;
    try {
      await chatApi.deleteMessage(token, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      showToast("Message unsent");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not unsend message");
    }
  };

  const pickAttachment = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (PNG, JPG, WEBP)");
      return;
    }
    setAttachmentFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAttachmentPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  // Send message handler
  const sendMessage = async () => {
    if (!token || !activeRoom) return;

    const text = draft.trim();
    if (!text && !attachmentFile) return;

    let mediaUrl: string | undefined = undefined;
    if (attachmentFile) {
      setUploadingAttachment(true);
      try {
        mediaUrl = await chatApi.uploadMedia(token, attachmentFile);
      } catch (err) {
        console.error("Failed to upload attachment:", err);
        showToast("Could not upload image. Please try again.");
        setUploadingAttachment(false);
        return;
      }
      setUploadingAttachment(false);
    }

    // Send via WebSocket
    const sent = sendMessageSocket(text, mediaUrl, mediaUrl ? "image" : undefined);

    // If socket failed, send via REST fallback
    if (!sent) {
      try {
        const isDM = activeRoom.type === "dm";
        const saved = await chatApi.sendMessage(token, {
          conversationId: isDM ? activeRoom.conversationId : undefined,
          groupId: !isDM ? activeRoom.groupId : undefined,
          content: text,
          attachmentUrl: mediaUrl,
          attachmentType: mediaUrl ? "image" : undefined,
        });
        setMessages((prev) => [...prev, saved]);
      } catch (err) {
        console.error("REST send failed:", err);
        showToast("Failed to send message.");
      }
    }

    setDraft("");
    removeAttachment();
  };

  // Filtered lists for sidebar
  const q = searchQuery.trim().toLowerCase();
  const filteredRooms = useMemo(() => rooms.filter((r) => !q || r.name.toLowerCase().includes(q)), [rooms, q]);
  const filteredFriends = useMemo(
    () => friends.filter((f) => !q || (f.username && f.username.toLowerCase().includes(q)) || f.email.toLowerCase().includes(q)),
    [friends, q]
  );
  const isFriendOnline = useCallback((f: FriendUser) => onlineUsers.has(f.id) || Boolean(f.isOnline), [onlineUsers]);
  // The row of friends above the chats, online first, like Instagram's active strip.
  const activeStrip = useMemo(
    () => [...friends].sort((a, b) => Number(isFriendOnline(b)) - Number(isFriendOnline(a))).slice(0, 16),
    [friends, isFriendOnline]
  );

  // Determine if active contact is online
  const isContactOnline = useMemo(() => {
    if (!activeRoom || activeRoom.type === "group") return false;
    if (activeRoom.otherId && onlineUsers.has(activeRoom.otherId)) return true;
    return activeRoom.online ?? false;
  }, [activeRoom, onlineUsers]);

  const callRoom = (video: boolean) =>
    activeRoom?.type === "dm" && activeRoom.otherId
      ? startCall({ id: activeRoom.otherId, name: activeRoom.name, avatar: activeRoom.avatar }, video)
      : showToast("Calls work in one-to-one chats");

  if (authStatus === "loading") {
    return (
      <div className="flex h-[calc(100dvh-var(--app-header))] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-accent-bright" />
      </div>
    );
  }

  return (
    <>
      {/* Phones: pinned between the top bar and the tab bar, edge to edge, so only the lists and
          the thread scroll. Desktop: a glass panel that fills the window below the header. */}
      <div
        data-chat-frame
        className="fixed inset-x-0 bottom-(--app-tabbar) top-(--app-header) flex md:static md:mx-auto md:h-[calc(100dvh-var(--app-header))] md:max-w-[1400px] md:p-4 lg:p-6"
      >
        <div className="relative isolate flex min-w-0 flex-1 overflow-hidden md:rounded-(--radius-frame) md:border md:border-white/10 md:bg-[linear-gradient(180deg,rgba(102,69,235,0.1)_0%,rgba(14,15,27,0.6)_100%)] md:shadow-[0_24px_60px_-36px_rgba(0,0,0,0.9)] md:backdrop-blur-xl">
          {/* Colour glows blurred inside the panel, as on the landing page's cards. */}
          <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden md:block">
            <span className="absolute -left-20 -top-24 size-72 rounded-full bg-[#1f8fff] opacity-15 blur-[90px]" />
            <span className="absolute -bottom-28 right-[20%] size-80 rounded-full bg-[#d61fff] opacity-10 blur-[100px]" />
          </span>

          {/* ─── Conversations ─────────────────────────────────────── */}
          <aside className={cn("min-w-0 flex-1 flex-col md:w-[340px] md:flex-none md:border-r md:border-white/8 lg:w-[380px]", mobileChatOpen ? "hidden md:flex" : "flex")}>
            <div className="flex shrink-0 flex-col gap-3 px-4 pb-3 pt-2 md:px-5 md:pt-5">
              <div className="flex items-center justify-between gap-3">
                <h1 className="flex items-center gap-2 text-h3 font-medium text-white">
                  Messages
                  <span
                    title={isConnected ? "Connected" : "Connecting…"}
                    className={cn("size-2 rounded-full", isConnected ? "bg-green" : "animate-pulse bg-amber-400")}
                  />
                </h1>
                <button
                  type="button"
                  onClick={() => setShowAddFriendModal(true)}
                  aria-label="Add friends"
                  title="Add friends"
                  className="flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/8"
                >
                  <SquarePen className="size-[22px]" strokeWidth={1.75} />
                </button>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tab === "chats" ? "Search" : "Search friends"}
                  aria-label={tab === "chats" ? "Search conversations" : "Search friends"}
                  className="h-10 w-full rounded-full border border-white/10 bg-white/[0.06] pl-10 pr-9 text-base text-white outline-none transition-colors placeholder:text-muted focus:border-white/25 md:text-sm [&::-webkit-search-cancel-button]:hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <div role="tablist" aria-label="Messages" className="flex gap-2">
                {(
                  [
                    { id: "chats", label: "Chats", count: rooms.length, alert: 0 },
                    { id: "friends", label: "Friends", count: friends.length, alert: incomingRequests.length },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-full px-4 text-sm transition-colors",
                      tab === t.id ? "chip-on font-medium" : "border border-white/10 text-subtle hover:border-white/25 hover:text-white"
                    )}
                  >
                    {t.label}
                    <span className={cn("text-xs tabular-nums", tab === t.id ? "text-canvas/60" : "text-muted")}>{t.count}</span>
                    {t.alert > 0 && (
                      <span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">{t.alert}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {tab === "chats" ? (
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3">
                {!q && activeStrip.length > 0 && (
                  <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-3 pt-1 md:px-5">
                    {activeStrip.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => startChatWithFriend(f)}
                        className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-xl text-center"
                      >
                        <ChatAvatar name={friendName(f)} avatar={f.avatar} online={isFriendOnline(f)} className="size-16 text-xl" />
                        <span className="w-full truncate text-xs text-subtle">{friendName(f)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {loadingRooms && rooms.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="size-6 animate-spin text-accent-bright" />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <EmptyList
                    icon={MessagesSquare}
                    title={q ? "No chats found" : "No chats yet"}
                    body="Start a conversation with a friend or a stylist."
                    action="Find friends"
                    onAction={() => setShowAddFriendModal(true)}
                  />
                ) : (
                  <ul>
                    {filteredRooms.map((room) => {
                      const isDM = room.type === "dm";
                      const online = isDM ? Boolean(room.otherId && onlineUsers.has(room.otherId)) : undefined;
                      const unread = (room.unread ?? 0) > 0;
                      return (
                        <li key={room.id}>
                          <button
                            type="button"
                            onClick={() => openRoom(room)}
                            aria-current={activeRoom?.id === room.id ? "true" : undefined}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors md:px-5",
                              activeRoom?.id === room.id ? "bg-white/[0.07]" : "hover:bg-white/[0.04] active:bg-white/[0.06]"
                            )}
                          >
                            <ChatAvatar name={room.name} avatar={room.avatar} group={!isDM} online={online} className="size-14 text-lg" />
                            <span className="min-w-0 flex-1">
                              <span className={cn("block truncate text-[15px] text-white", unread && "font-semibold")}>{room.name}</span>
                              <span className={cn("flex min-w-0 gap-1 text-sm", unread ? "font-medium text-white" : "text-muted")}>
                                <span className="truncate">{room.lastMessage || (isDM ? "Tap to chat" : `${room.memberCount || 2} members`)}</span>
                                <span className="shrink-0">· {shortAgo(room.lastMessageAt)}</span>
                              </span>
                            </span>
                            {unread && <span aria-label="Unread" className="size-2.5 shrink-0 rounded-full bg-accent-bright" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 md:px-4">
                {incomingRequests.length > 0 && (
                  <div className="card-violet mb-3 rounded-(--radius-card) p-3">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-cyan">
                        <Sparkles className="size-3.5" />
                        Requests ({incomingRequests.length})
                      </span>
                      <button type="button" onClick={() => setShowAddFriendModal(true)} className="text-xs text-muted hover:text-white">
                        View all
                      </button>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {incomingRequests.slice(0, 3).map((req) => {
                        const name = req.sender?.username || req.sender?.email?.split("@")[0] || "Stylist";
                        return (
                          <li key={req.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                            <ChatAvatar name={name} avatar={req.sender?.avatar} className="size-9 text-xs" />
                            <span className="min-w-0 flex-1 truncate text-sm text-white">{name}</span>
                            <button type="button" onClick={() => setShowAddFriendModal(true)} className="btn-primary h-8 rounded-full px-4 text-xs font-medium">
                              Review
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {loadingFriends && friends.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="size-6 animate-spin text-accent-bright" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <EmptyList
                    icon={UserPlus}
                    title="No friends found"
                    body="Grow your styling circle to swap looks and ideas."
                    action="Add friends"
                    onAction={() => setShowAddFriendModal(true)}
                  />
                ) : (
                  <ul className="flex flex-col">
                    {filteredFriends.map((friend) => {
                      const online = isFriendOnline(friend);
                      return (
                        <li key={friend.id} className="flex items-center gap-3 rounded-2xl px-1 py-2">
                          <ChatAvatar name={friendName(friend)} avatar={friend.avatar} online={online} className="size-12" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] text-white">{friendName(friend)}</span>
                            <span className="block truncate text-sm text-muted">{online ? "Active now" : "Offline"}</span>
                          </span>
                          <button type="button" onClick={() => startChatWithFriend(friend)} className="btn-primary h-8 rounded-full px-4 text-xs font-medium">
                            Message
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFriend(friend)}
                            aria-label={`Remove ${friendName(friend)}`}
                            title="Remove friend"
                            className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-500/15 hover:text-red-300"
                          >
                            <UserMinus className="size-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </aside>

          {/* ─── Thread ────────────────────────────────────────────── */}
          <section className={cn("relative min-w-0 flex-1 flex-col", mobileChatOpen ? "flex" : "hidden md:flex")}>
            {activeRoom ? (
              <>
                <header className="relative z-10 flex h-14 shrink-0 items-center gap-1 border-b border-white/8 bg-canvas/70 px-1.5 backdrop-blur-xl sm:px-3 md:h-16 md:bg-transparent md:px-4 md:backdrop-blur-none">
                  <button
                    type="button"
                    onClick={closeRoom}
                    aria-label="Back to chats"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/8 md:hidden"
                  >
                    <ArrowLeft className="size-6" strokeWidth={1.75} />
                  </button>

                  <div className="flex min-w-0 flex-1 items-center gap-3 pl-1 md:pl-0">
                    <ChatAvatar
                      name={activeRoom.name}
                      avatar={activeRoom.avatar}
                      group={activeRoom.type === "group"}
                      online={activeRoom.type === "dm" ? isContactOnline : undefined}
                      className="size-9 text-sm md:size-10"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium leading-tight text-white">{activeRoom.name}</p>
                      <p className="truncate text-xs text-muted">
                        {activeRoom.type === "group" ? `${activeRoom.memberCount || 2} members` : isContactOnline ? "Active now" : "Offline"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => callRoom(false)}
                    disabled={callBusy}
                    aria-label="Voice call"
                    title="Voice call"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/8 disabled:opacity-50"
                  >
                    <Phone className="size-[22px]" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => callRoom(true)}
                    disabled={callBusy}
                    aria-label="Video call"
                    title="Video call"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/8 disabled:opacity-50"
                  >
                    <Video className="size-6" strokeWidth={1.75} />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setRoomMenuOpen((prev) => !prev)}
                      aria-label="More"
                      aria-expanded={roomMenuOpen}
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/8"
                    >
                      <MoreVertical className="size-5" strokeWidth={1.75} />
                    </button>
                    {roomMenuOpen && (
                      <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-2xl border border-white/10 bg-[#0e0d26]/95 p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setRoomMenuOpen(false);
                            showToast("Conversation cleared");
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-subtle hover:bg-white/6 hover:text-white"
                        >
                          <Trash2 className="size-4" />
                          Clear messages
                        </button>
                      </div>
                    )}
                  </div>
                </header>

                <MessageList
                  key={activeRoom.id}
                  messages={messages}
                  meId={user?.id}
                  isGroup={activeRoom.type === "group"}
                  loading={loadingMessages}
                  hasMoreOlder={hasMoreOlder}
                  loadingOlder={loadingOlder}
                  onLoadOlder={loadOlderMessages}
                  typing={typingUsers.length > 0}
                  typingPerson={{ name: activeRoom.name, avatar: activeRoom.avatar }}
                  onDelete={handleDeleteMessage}
                />

                <Composer
                  value={draft}
                  onChange={(text) => {
                    setDraft(text);
                    emitTyping();
                  }}
                  onSend={sendMessage}
                  onPick={pickAttachment}
                  attachment={attachmentPreview ? { preview: attachmentPreview, name: attachmentFile?.name ?? "Photo" } : null}
                  onRemoveAttachment={removeAttachment}
                  uploading={uploadingAttachment}
                  placeholder="Message…"
                />
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <span className="keycap flex size-20 items-center justify-center rounded-full">
                  <MessagesSquare className="icon-silver size-9" strokeWidth={1.5} />
                </span>
                <h2 className="chrome mt-6 text-h3 font-medium">Your messages</h2>
                <p className="mt-2 max-w-sm text-sm text-muted">Send looks to friends and stylists, and get their take before you buy.</p>
                <button
                  type="button"
                  onClick={() => setShowAddFriendModal(true)}
                  className="btn-primary mt-6 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium transition-[filter] hover:brightness-110"
                >
                  <SquarePen className="size-4" />
                  Send message
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      <AddFriendModal
        open={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        token={token}
        currentUserId={user?.id || ""}
        friends={friends}
        incomingRequests={incomingRequests}
        onFriendActionSuccess={(msg) => {
          showToast(msg);
          loadFriendsData();
          loadRooms();
        }}
        onRefreshRequests={loadFriendsData}
      />

      {toast && (
        <div
          role="status"
          className="animate-rise-in fixed bottom-[calc(var(--app-tabbar)+5rem)] left-1/2 z-[90] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 rounded-full border border-white/12 bg-[#0e0d26]/95 px-4 py-2.5 text-sm text-white shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl md:bottom-8"
        >
          <span className="chip-on flex size-5 shrink-0 items-center justify-center rounded-full">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}
    </>
  );
}

function EmptyList({
  icon: Icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: typeof MessagesSquare;
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="keycap flex size-14 items-center justify-center rounded-2xl">
        <Icon className="icon-silver size-6" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-[15px] font-medium text-white">{title}</p>
      <p className="mt-1 max-w-[260px] text-sm text-muted">{body}</p>
      <button type="button" onClick={onAction} className="btn-primary mt-5 inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium transition-[filter] hover:brightness-110">
        <UserPlus className="size-4" />
        {action}
      </button>
    </div>
  );
}
