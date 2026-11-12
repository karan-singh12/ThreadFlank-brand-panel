"use client";

import { useState } from "react";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";

/**
 * User-generated imagery (uploads, try-on results, product links) comes from
 * arbitrary hosts, so it renders as a plain <img> with graceful error fallback.
 */
export function Photo({ src, alt, className, fit = "cover" }: { src: string; alt: string; className?: string; fit?: "cover" | "contain" }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <span className={cn("flex size-full items-center justify-center bg-white/5 text-xs text-muted", className)}>
        {alt ? alt.charAt(0).toUpperCase() : ""}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetUrl(src)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setError(true)}
      className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}
