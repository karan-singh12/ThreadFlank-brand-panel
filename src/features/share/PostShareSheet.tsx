"use client";

import type { Brand, BrandPost } from "@/data/app-content";
import { getSessionSnapshot } from "@/features/auth/storage";
import { discoverApi } from "@/features/discover/api";
import { CardShareSheet } from "./CardShareSheet";

/** Share a Discover post as a branded card that links to its public post page. */
export function PostShareSheet({ open, onClose, post, brand }: { open: boolean; onClose: () => void; post: BrandPost; brand: Brand }) {
  const name = `${brand.name}: ${post.caption.replace(/\s+/g, " ").trim().slice(0, 60) || post.category}`;
  return (
    <CardShareSheet
      open={open}
      onClose={onClose}
      title="Share this post"
      name={name}
      image={post.image}
      shareText={`✨ ${name} — want to try this on?`}
      // Called once per channel for the life of the sheet, so each way of sharing counts once.
      prepare={async () => {
        discoverApi.recordShare(getSessionSnapshot()?.token, post.id);
        return {
          url: `${window.location.origin}/p/${post.id}`,
          card: (format) => `/api/post-card/${post.id}?format=${format}`,
        };
      }}
    />
  );
}
