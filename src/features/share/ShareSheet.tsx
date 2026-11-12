"use client";

import { useRef } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi } from "@/features/social/api";
import { CardShareSheet, type ShareChannel } from "./CardShareSheet";

/**
 * Share a look as a branded card (feature #22), or send it into a chat (#18).
 * A share link always points at a saved look, so `ensureLookId` saves it first when needed.
 */
export function ShareSheet({
  open,
  onClose,
  lookId,
  ensureLookId,
  image,
  video,
  name,
}: {
  open: boolean;
  onClose: () => void;
  lookId?: string | null;
  ensureLookId?: () => Promise<string>;
  image: string;
  video?: string | null;
  name: string;
}) {
  const { token } = useAuth();
  // Save at most once, even if several channels are tapped while the save is still running.
  const saving = useRef<Promise<string> | null>(null);

  const savedLookId = () => {
    if (lookId) return Promise.resolve(lookId);
    if (!ensureLookId) return Promise.reject(new Error("Save the look before sharing it"));
    if (!saving.current) {
      saving.current = ensureLookId();
      saving.current.catch(() => {
        saving.current = null;
      });
    }
    return saving.current;
  };

  const prepare = async (channel: ShareChannel) => {
    if (!token) throw new Error("Sign in to share");
    const share = await socialApi.createShare(token, await savedLookId(), channel);
    return {
      url: `${window.location.origin}/s/${share.token}`,
      card: (format: "whatsapp" | "story") => `/api/share-card/${share.token}?format=${format}`,
    };
  };

  return (
    <CardShareSheet
      open={open}
      onClose={onClose}
      title="Share this look"
      name={name}
      image={image}
      video={video}
      shareText={`👗 ${name} — what do you think?`}
      prepare={prepare}
      note={!lookId && ensureLookId ? "It's saved to your looks so the link keeps working." : undefined}
    />
  );
}
