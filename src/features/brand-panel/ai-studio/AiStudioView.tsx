"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import { ContentStudio } from "./ContentStudio";
import { ContentLibrary } from "./ContentLibrary";
import { VideoStudio } from "./VideoStudio";
import { ReelStudio } from "./ReelStudio";

/** The promo reel leads: it is the finished thing a brand actually posts. */
const TABS = [
  { id: "reel", label: "Promo reel" },
  { id: "video", label: "Single clip" },
  { id: "content", label: "Write copy" },
  { id: "library", label: "Saved copy" },
] as const;

/** AI Studio: promo reels, single motion clips, written copy and saved copy. */
export function AiStudioView() {
  const { brand } = useReadyPanel();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("reel");

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="AI Studio" className="glass-pill inline-flex rounded-full p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("h-9 rounded-full px-5 text-sm transition-colors", tab === t.id ? "chip-on" : "text-subtle hover:text-white")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reel" ? (
        <ReelStudio />
      ) : tab === "video" ? (
        <VideoStudio />
      ) : tab === "content" ? (
        <div className="space-y-6">
          <BrandPageHeader
            eyebrow="AI Studio"
            title="Write with AI"
            blurb="Captions, product pages, launch posts, emails and search listings in your brand's voice — written from your real catalog details only, and previewed exactly where they'll go."
            actions={
              <p className="glass-pill flex h-11 items-center gap-2 rounded-full px-5 text-sm text-white tabular-nums">
                2 credits per write · <span className="font-medium">{brand.aiCredits} available</span> ·{" "}
                <Link href="/billing" className="text-accent-bright hover:underline">
                  Buy more
                </Link>
              </p>
            }
          />
          <ContentStudio />
        </div>
      ) : (
        <div className="space-y-6">
          <BrandPageHeader eyebrow="AI Studio" title="Saved copy" blurb="Everything you saved from the writer, ready to copy again. Up to 500 items." />
          <ContentLibrary />
        </div>
      )}
    </div>
  );
}
