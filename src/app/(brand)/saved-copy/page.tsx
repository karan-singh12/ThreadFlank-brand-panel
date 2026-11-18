import type { Metadata } from "next";
import { BrandPageHeader } from "@/features/brand-panel/BrandPageHeader";
import { ContentLibrary } from "@/features/brand-panel/ai-studio/ContentLibrary";

export const metadata: Metadata = { title: "Saved copy — Threadflank", robots: { index: false } };

export default function SavedCopyPage() {
  return (
    <div className="space-y-6">
      <BrandPageHeader eyebrow="AI Studio" title="Saved copy" blurb="Everything you saved from the writer, ready to copy again. Up to 500 items." />
      <ContentLibrary />
    </div>
  );
}
