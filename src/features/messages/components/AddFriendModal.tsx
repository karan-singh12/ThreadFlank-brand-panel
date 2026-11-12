"use client";

import { assetUrl } from "@/lib/api/config";
import { useState, useEffect, useId, useRef, useCallback } from "react";
import {
  X,
  Search,
  UserPlus,
  Check,
  Clock,
  Sparkles,
  Users,
  Inbox,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatApi } from "../api";
import type { FriendRequestItem, FriendUser } from "../types";

interface AddFriendModalProps {
  open: boolean;
  onClose: () => void;
  token: string | null;
  currentUserId: string;
  friends: FriendUser[];
  incomingRequests: FriendRequestItem[];
  onFriendActionSuccess: (msg: string) => void;
  onRefreshRequests: () => void;
}

export function AddFriendModal({
  open,
  onClose,
  token,
  currentUserId,
  friends,
  incomingRequests,
  onFriendActionSuccess,
  onRefreshRequests,
}: AddFriendModalProps) {
  const [modalTab, setModalTab] = useState<"search" | "suggestions" | "requests">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; username: string | null; email: string; avatar: string | null }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadSuggestions();
    } else {
      setSearchTerm("");
      setSearchResults([]);
      setErrorMessage(null);
    }
  }, [open]);

  // Load Suggestions
  const loadSuggestions = useCallback(async () => {
    if (!token) return;
    setLoadingSuggestions(true);
    try {
      const data = await chatApi.fetchFriendSuggestions(token);
      setSuggestions(data);
    } catch (err) {
      console.error("Failed to load friend suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [token]);

  // Live Search
  useEffect(() => {
    const q = searchTerm.trim();
    if (!q || !token) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setErrorMessage(null);
      try {
        const res = await chatApi.searchChat(token, q);
        setSearchResults(res.users || []);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, token]);

  // Send friend request
  const handleSendRequest = async (identifier: string, targetId?: string) => {
    if (!token || !identifier.trim()) return;

    const idKey = targetId || identifier;
    setActionLoadingId(idKey);
    setErrorMessage(null);

    try {
      const res = await chatApi.sendFriendRequest(token, identifier.trim());
      setSentMap((prev) => ({ ...prev, [idKey]: true }));
      onFriendActionSuccess(
        res.accepted ? "Friend added instantly!" : "Friend request sent!"
      );
      loadSuggestions();
      onRefreshRequests();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send friend request");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Respond to request
  const handleRespondRequest = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    if (!token) return;
    setActionLoadingId(requestId);
    setErrorMessage(null);

    try {
      await chatApi.respondToFriendRequest(token, requestId, status);
      onFriendActionSuccess(status === "ACCEPTED" ? "Friend request accepted!" : "Friend request declined.");
      onRefreshRequests();
      loadSuggestions();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update request");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[85vh] w-full max-w-[560px] flex-col rounded-3xl border border-white/10 bg-[#070717]/95 p-6 shadow-[0_20px_60px_-15px_rgba(102,69,235,0.4)] backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#3d2db8,#130e42)] ring-1 ring-accent-bright/30">
              <UserPlus className="size-5 text-accent-bright" />
            </span>
            <div>
              <h2 id={titleId} className="chrome text-lg font-semibold tracking-tight text-white">
                Add Friends &amp; Stylists
              </h2>
              <p className="text-xs text-muted">Connect, share outfits, and get real-time feedback</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Switcher inside Modal */}
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-white/[0.04] p-1 ring-1 ring-white/5">
          <button
            type="button"
            onClick={() => setModalTab("search")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition",
              modalTab === "search"
                ? "bg-gradient-to-r from-accent to-accent-bright text-white shadow-md shadow-accent/25"
                : "text-muted hover:text-white"
            )}
          >
            <Search className="size-3.5" />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab("suggestions")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition",
              modalTab === "suggestions"
                ? "bg-gradient-to-r from-accent to-accent-bright text-white shadow-md shadow-accent/25"
                : "text-muted hover:text-white"
            )}
          >
            <Sparkles className="size-3.5" />
            <span>Suggested ({suggestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab("requests")}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition",
              modalTab === "requests"
                ? "bg-gradient-to-r from-accent to-accent-bright text-white shadow-md shadow-accent/25"
                : "text-muted hover:text-white"
            )}
          >
            <Inbox className="size-3.5" />
            <span>Requests</span>
            {incomingRequests.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ─── TAB: SEARCH ────────────────────────────────────────── */}
        {modalTab === "search" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Search Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchTerm.trim()) {
                  handleSendRequest(searchTerm.trim());
                }
              }}
              className="relative mb-3 flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter username or email..."
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none placeholder:text-muted/60 focus:border-accent-bright/60 focus:ring-1 focus:ring-accent-bright/30"
                />
              </div>
              <button
                type="submit"
                disabled={!searchTerm.trim() || !!actionLoadingId}
                className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-accent to-accent-bright px-5 text-xs font-semibold text-white shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:opacity-50"
              >
                {actionLoadingId === searchTerm.trim() ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </form>

            {/* Results or Helper Tip */}
            <div className="no-scrollbar max-h-[320px] flex-1 overflow-y-auto pr-1">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted">
                  <Loader2 className="mb-2 size-6 animate-spin text-accent-bright" />
                  <p className="text-xs">Searching users across Threadflank...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {searchResults.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const isAlreadyFriend = friends.some((f) => f.id === user.id);
                    const isSent = sentMap[user.id] || sentMap[user.username || ""] || sentMap[user.email];
                    const identifier = user.username || user.email;

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] p-3 transition hover:border-white/12 hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={assetUrl(user.avatar)}
                              alt={user.username || "Avatar"}
                              className="size-10 rounded-full object-cover ring-1 ring-white/10"
                            />
                          ) : (
                            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-sm font-semibold text-white">
                              {(user.username || user.email)[0].toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {user.username || user.email.split("@")[0]}
                            </p>
                            <p className="truncate text-xs text-muted">{user.email}</p>
                          </div>
                        </div>

                        <div>
                          {isSelf ? (
                            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">
                              You
                            </span>
                          ) : isAlreadyFriend ? (
                            <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                              <Check className="size-3" /> Friends
                            </span>
                          ) : isSent ? (
                            <span className="flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-bright">
                              <Clock className="size-3" /> Sent
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendRequest(identifier, user.id)}
                              disabled={actionLoadingId === user.id}
                              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent hover:text-white"
                            >
                              {actionLoadingId === user.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <>
                                  <UserPlus className="size-3.5" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchTerm.trim() ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted">
                    No matching user profile found directly for &ldquo;{searchTerm}&rdquo;.
                  </p>
                  <p className="mt-1 text-xs text-subtle">
                    Click <strong>Send</strong> above to deliver a direct invite to this email or username.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/5 text-muted">
                    <Search className="size-5" />
                  </span>
                  <p className="mt-3 text-xs font-medium text-white">Type a username or email</p>
                  <p className="mt-1 text-[11px] text-muted">
                    Search friends, fashion creators, and stylists to start messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: SUGGESTIONS ───────────────────────────────────── */}
        {modalTab === "suggestions" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">
                People you may know based on style activity
              </span>
              <button
                type="button"
                onClick={loadSuggestions}
                disabled={loadingSuggestions}
                className="text-[11px] text-accent-bright hover:underline"
              >
                Refresh
              </button>
            </div>

            <div className="no-scrollbar max-h-[340px] flex-1 overflow-y-auto pr-1">
              {loadingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted">
                  <Loader2 className="mb-2 size-6 animate-spin text-accent-bright" />
                  <p className="text-xs">Finding suggestions for you...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {suggestions.map((sug) => {
                    const isSent = sentMap[sug.id] || sentMap[sug.username || ""] || sentMap[sug.email];
                    const identifier = sug.username || sug.email;

                    return (
                      <div
                        key={sug.id}
                        className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] p-3 transition hover:border-white/12 hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-3">
                          {sug.avatar ? (
                            <img
                              src={assetUrl(sug.avatar)}
                              alt={sug.username || "Avatar"}
                              className="size-10 rounded-full object-cover ring-1 ring-white/10"
                            />
                          ) : (
                            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-sm font-semibold text-white">
                              {(sug.username || sug.email)[0].toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {sug.username || sug.email.split("@")[0]}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {sug.bio || sug.email}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isSent ? (
                            <span className="flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-bright">
                              <Check className="size-3" /> Sent
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendRequest(identifier, sug.id)}
                              disabled={actionLoadingId === sug.id}
                              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-bright px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-accent/20 transition hover:brightness-110"
                            >
                              {actionLoadingId === sug.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <>
                                  <UserPlus className="size-3.5" />
                                  <span>Add Friend</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/5 text-muted">
                    <Users className="size-5" />
                  </span>
                  <p className="mt-3 text-xs font-medium text-white">No suggestions right now</p>
                  <p className="mt-1 text-[11px] text-muted">
                    Use the Search tab to connect with anyone by email or username
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: REQUESTS ──────────────────────────────────────── */}
        {modalTab === "requests" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="no-scrollbar max-h-[340px] flex-1 overflow-y-auto pr-1">
              {incomingRequests.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {incomingRequests.map((req) => {
                    const senderName = req.sender?.username || req.sender?.email?.split("@")[0] || "Stylist";
                    const initial = senderName[0].toUpperCase();

                    return (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] p-3"
                      >
                        <div className="flex items-center gap-3">
                          {req.sender?.avatar ? (
                            <img
                              src={assetUrl(req.sender.avatar)}
                              alt={senderName}
                              className="size-10 rounded-full object-cover ring-1 ring-white/10"
                            />
                          ) : (
                            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-bright text-sm font-bold text-white">
                              {initial}
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-white">{senderName}</p>
                            <p className="text-xs text-muted">Sent you a friend request</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRespondRequest(req.id, "ACCEPTED")}
                            disabled={actionLoadingId === req.id}
                            className="rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-bright"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespondRequest(req.id, "REJECTED")}
                            disabled={actionLoadingId === req.id}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-white/10 hover:text-white"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/5 text-muted">
                    <Inbox className="size-5" />
                  </span>
                  <p className="mt-3 text-xs font-medium text-white">No pending requests</p>
                  <p className="mt-1 text-[11px] text-muted">When someone adds you, their request appears here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
