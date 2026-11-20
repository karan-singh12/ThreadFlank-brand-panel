"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import { ContentStudio } from "./ContentStudio";
import { ModelStudio } from "./ModelStudio";
import { ReelStudio } from "./ReelStudio";

/** Three things a brand makes here. Saved copy lives on its own page, in the profile menu. */
const TABS = [
  { id: "video", label: "Reel" },
  { id: "model", label: "Model" },
  { id: "content", label: "Write" },
] as const;

/** AI Studio: reels, model shoots and written copy. */
export function AiStudioView() {
  const { brand } = useReadyPanel();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("video");

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

      {tab === "video" ? (
        <ReelStudio />
      ) : tab === "model" ? (
        <ModelStudio />
      ) : (
        <div className="space-y-6">
          <BrandPageHeader
            eyebrow="AI Studio"
            title="Write with AI"
            blurb="Captions, product pages, launch posts, emails and search listings in your brand's voice — written from your real catalog details only, and previewed exactly where they'll go."
            actions={
              <p className="glass-pill flex h-11 items-center gap-2 rounded-full px-5 text-sm text-white tabular-nums">
                2 credits per write · <span className="font-medium">{brand.aiCredits} available</span> ·{" "}
                <Link href="/saved-copy" className="text-accent-bright hover:underline">
                  Saved copy
                </Link>
              </p>
            }
          />
          <ContentStudio />
        </div>
      )}
    </div>
  );
}
