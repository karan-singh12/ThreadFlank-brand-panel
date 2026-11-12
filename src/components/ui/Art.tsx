"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Gradient stand-ins that echo the palette of the reference imagery.
const TONES: Record<string, string> = {
  ember:
    "radial-gradient(circle at 70% 30%, #ffd08a 0%, transparent 35%), radial-gradient(circle at 30% 70%, #e2552f 0%, transparent 55%), radial-gradient(circle at 80% 85%, #2fb5a8 0%, transparent 35%), linear-gradient(135deg, #7a1d22, #f08a3c)",
  meadow:
    "radial-gradient(circle at 50% 35%, #f6e7d2 0%, transparent 30%), radial-gradient(circle at 30% 80%, #4f9a3a 0%, transparent 55%), linear-gradient(160deg, #9fd46b, #2f6b3a)",
  dusk:
    "radial-gradient(circle at 70% 25%, #ffd7e4 0%, #ff9ab6 12%, transparent 22%), linear-gradient(180deg, #f07aa5 0%, #b0407e 45%, #3a2360 70%, #e06aa0 100%)",
  neon:
    "radial-gradient(circle at 50% 40%, #ffd1dc 0%, transparent 25%), radial-gradient(circle at 25% 70%, #2d7df0 0%, transparent 50%), radial-gradient(circle at 80% 30%, #ff4fa8 0%, transparent 40%), linear-gradient(135deg, #1c1a55, #b8367c)",
  brain:
    "radial-gradient(ellipse at 55% 50%, #7fb3ff 0%, #3c62f0 25%, transparent 55%), radial-gradient(ellipse at 75% 60%, #b04cff 0%, transparent 40%), linear-gradient(135deg, #1a1d6e 0%, #2b2fb8 45%, #0c0d3a 100%)",
  slate: "radial-gradient(circle at 50% 35%, #e3e6ee 0%, #8d93a8 45%, #3a3f55 100%)",
  amber: "radial-gradient(circle at 50% 35%, #ffe4c2 0%, #d99a5c 45%, #5c3a24 100%)",
  rose: "radial-gradient(circle at 50% 35%, #ffd0d0 0%, #e0463f 45%, #5a1420 100%)",
  teal: "radial-gradient(circle at 50% 35%, #d2f5ef 0%, #4fb3a6 45%, #1b3f45 100%)",
  violet: "radial-gradient(circle at 50% 35%, #e5ddff 0%, #8b6cf2 45%, #2b1c66 100%)",
};

export function Art({
  image,
  tone = "violet",
  alt = "",
  className,
  sizes = "400px",
}: {
  image?: string;
  tone?: string;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  const [error, setError] = useState(false);
  const isSvg = Boolean(image && (image.endsWith(".svg") || image.startsWith("data:") || image.includes(".svg?")));
  const showImage = Boolean(image && !error);

  return (
    <div
      className={cn("relative overflow-hidden flex items-center justify-center", className)}
      style={showImage ? undefined : { background: TONES[tone] ?? TONES.violet }}
    >
      {showImage && (
        isSvg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={alt}
            onError={() => setError(true)}
            className="size-full object-cover"
          />
        ) : (
          <Image
            src={image!}
            alt={alt}
            fill
            sizes={sizes}
            onError={() => setError(true)}
            className="object-cover"
          />
        )
      )}
      {!showImage && alt && (
        <span className="select-none font-bold text-white text-[11px] uppercase tracking-wider">
          {alt.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
