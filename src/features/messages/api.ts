import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS, assetUrl } from "@/lib/api/config";
import type {
  ChatMessage,
  ChatRoom,
  ChatSearchResult,
  FriendRequestItem,
  FriendUser,
} from "./types";

export const chatApi = {
  // ─── Conversations (DMs) ──────────────────────────────────────────────────
  async getConversations(token: string): Promise<ChatRoom[]> {
    const res = await apiRequest<{ conversations: ChatRoom[] }>(
      ENDPOINTS.chat.conversations,
      { token }
    );
    return res.data?.conversations ?? [];
  },

  async createConversation(token: string, otherUserId: string): Promise<any> {
    const res = await apiRequest<{ conversation: any }>(
      ENDPOINTS.chat.conversations,
      {
        method: "POST",
        token,
        body: { otherUserId },
      }
    );
    return res.data?.conversation;
  },

  async getConversationMessages(
    token: string,
    conversationId: string,
    options: { take?: number; before?: string } = {}
  ): Promise<ChatMessage[]> {
    const params = new URLSearchParams();
    if (options.take) params.set("take", String(options.take));
    if (options.before) params.set("before", options.before);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiRequest<{ messages: ChatMessage[] }>(
      `${ENDPOINTS.chat.conversationMessages(conversationId)}${query}`,
      { token }
    );
    return res.data?.messages ?? [];
  },

  // ─── Groups ───────────────────────────────────────────────────────────────
  async getGroups(token: string): Promise<ChatRoom[]> {
    const res = await apiRequest<{ groups: ChatRoom[] }>(
      ENDPOINTS.chat.groups,
      { token }
    );
    return res.data?.groups ?? [];
  },

  async createGroup(
    token: string,
    body: { name: string; description?: string; memberIds: string[] }
  ): Promise<any> {
    const res = await apiRequest<{ group: any }>(ENDPOINTS.chat.groups, {
      method: "POST",
      token,
      body,
    });
    return res.data?.group;
  },

  async getGroupMessages(
    token: string,
    groupId: string,
    options: { take?: number; before?: string } = {}
  ): Promise<ChatMessage[]> {
    const params = new URLSearchParams();
    if (options.take) params.set("take", String(options.take));
    if (options.before) params.set("before", options.before);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiRequest<{ messages: ChatMessage[] }>(
      `${ENDPOINTS.chat.groupMessages(groupId)}${query}`,
      { token }
    );
    return res.data?.messages ?? [];
  },

  // ─── Messages HTTP fallback & actions ─────────────────────────────────────
  async sendMessage(
    token: string,
    body: {
      conversationId?: string;
      groupId?: string;
      content: string;
      attachmentUrl?: string;
      attachmentType?: string;
      replyToId?: string;
    }
  ): Promise<ChatMessage> {
    const res = await apiRequest<{ message: ChatMessage }>(
      ENDPOINTS.chat.messages,
      {
        method: "POST",
        token,
        body,
      }
    );
    return res.data.message;
  },

  async editMessage(
    token: string,
    messageId: string,
    content: string
  ): Promise<ChatMessage> {
    const res = await apiRequest<{ message: ChatMessage }>(
      ENDPOINTS.chat.message(messageId),
      {
        method: "PATCH",
        token,
        body: { content },
      }
    );
    return res.data.message;
  },

  async deleteMessage(token: string, messageId: string): Promise<void> {
    await apiRequest<unknown>(ENDPOINTS.chat.message(messageId), {
      method: "DELETE",
      token,
    });
  },

  // ─── Search ───────────────────────────────────────────────────────────────
  async searchChat(token: string, query: string): Promise<ChatSearchResult> {
    const res = await apiRequest<ChatSearchResult>(
      `${ENDPOINTS.chat.search}?query=${encodeURIComponent(query)}`,
      { token }
    );
    return res.data ?? { users: [], groups: [], messages: [] };
  },

  // ─── Friends System ───────────────────────────────────────────────────────
  async fetchFriendsList(token: string): Promise<FriendUser[]> {
    const res = await apiRequest<FriendUser[]>(
      ENDPOINTS.users.friends.list,
      { token }
    );
    return res.data ?? [];
  },

  async fetchFriendRequests(
    token: string,
    type: "all" | "received" | "sent" = "all"
  ): Promise<FriendRequestItem[]> {
    const res = await apiRequest<FriendRequestItem[]>(
      `${ENDPOINTS.users.friends.requests}?type=${type}`,
      { token }
    );
    return res.data ?? [];
  },

  async sendFriendRequest(
    token: string,
    identifier: string
  ): Promise<{ friendship: any; friend: FriendUser; accepted: boolean }> {
    const res = await apiRequest<{
      friendship: any;
      friend: FriendUser;
      accepted: boolean;
    }>(ENDPOINTS.users.friends.request, {
      method: "POST",
      token,
      body: { identifier },
    });
    return res.data;
  },

  async respondToFriendRequest(
    token: string,
    requestId: string,
    status: "ACCEPTED" | "REJECTED"
  ): Promise<any> {
    const res = await apiRequest<any>(
      ENDPOINTS.users.friends.respond(requestId),
      {
        method: "PUT",
        token,
        body: { status },
      }
    );
    return res.data;
  },

  async removeFriend(token: string, friendId: string): Promise<void> {
    await apiRequest<unknown>(
      ENDPOINTS.users.friends.remove(friendId),
      {
        method: "DELETE",
        token,
      }
    );
  },

  async fetchFriendSuggestions(token: string): Promise<FriendUser[]> {
    const res = await apiRequest<FriendUser[]>(
      ENDPOINTS.users.friends.suggestions,
      { token }
    );
    return res.data ?? [];
  },

  // ─── Media Attachment Upload ──────────────────────────────────────────────
  async uploadMedia(token: string, file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "chat");
    const res = await apiRequest<{ url: string }>(ENDPOINTS.uploads, {
      method: "POST",
      token,
      body: form,
      timeoutMs: 60_000,
    });
    return assetUrl(res.data.url);
  },
};
