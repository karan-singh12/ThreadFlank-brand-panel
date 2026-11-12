import { Suspense } from "react";
import type { Metadata } from "next";
import { WardrobeView } from "@/features/wardrobe/WardrobeView";

export const metadata: Metadata = { title: "Wardrobe — Threadflank", robots: { index: false } };

export default function WardrobePage() {
  return (
    <Suspense>
      <WardrobeView />
    </Suspense>
  );
}
