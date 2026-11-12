import { Suspense } from "react";
import type { Metadata } from "next";
import { SavedView } from "@/features/saved/SavedView";

export const metadata: Metadata = {
  title: "Saved Looks — Threadflank",
  description: "View and manage your saved virtual drape styles, curated outfits, and fashion looks.",
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <Suspense>
      <SavedView />
    </Suspense>
  );
}
