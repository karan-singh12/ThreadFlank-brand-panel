"use client";

import { assetUrl } from "@/lib/api/config";
import { useState } from "react";
import { X, Users, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatApi } from "../api";
import type { FriendUser } from "../types";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  token: string | null;
  friends: FriendUser[];
  onGroupCreated: (newGroup: any) => void;
}

export function CreateGroupModal({
  open,
  onClose,
  token,
  friends,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const group = await chatApi.createGroup(token, {
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedIds,
      });
      onGroupCreated(group);
      setName("");
      setDescription("");
      setSelectedIds([]);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[85vh] w-full max-w-[500px] flex-col rounded-3xl border border-white/10 bg-[#070717]/95 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#3d2db8,#130e42)] ring-1 ring-accent-bright/30">
              <Users className="size-5 text-accent-bright" />
            </span>
            <div>
              <h2 className="chrome text-lg font-semibold tracking-tight text-white">Create Group Chat</h2>
              <p className="text-xs text-muted">Collaborate with stylists &amp; friends</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-subtle">Group Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Style Crew, Wedding Outfits"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none focus:border-accent-bright/60"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-subtle">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none focus:border-accent-bright/60"
            />
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-subtle">
                Select Members ({selectedIds.length} selected)
              </label>
            </div>

            <div className="no-scrollbar max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
              {friends.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">
                  Add friends first to invite them to groups.
                </p>
              ) : (
                friends.map((friend) => {
                  const isSelected = selectedIds.includes(friend.id);
                  const friendName = friend.username || friend.email.split("@")[0];

                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => toggleSelect(friend.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition",
                        isSelected
                          ? "bg-accent/20 ring-1 ring-accent-bright/40"
                          : "bg-white/[0.02] hover:bg-white/[0.05]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {friend.avatar ? (
                          <img
                            src={assetUrl(friend.avatar)}
                            alt={friendName}
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-xs font-bold text-white">
                            {friendName[0].toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs font-medium text-white">{friendName}</span>
                      </div>

                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded-md border transition",
                          isSelected
                            ? "border-accent-bright bg-accent text-white"
                            : "border-white/20 bg-white/5 text-transparent"
                        )}
                      >
                        <Check className="size-3 stroke-[3]" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-muted transition hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-bright px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              <span>Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
