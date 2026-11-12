import { Suspense } from "react";
import type { Metadata } from "next";
import { WidgetTryOn } from "@/features/widget/WidgetTryOn";

export const metadata: Metadata = { title: "Virtual try-on", robots: { index: false } };

export default function EmbedTryOnPage() {
  return (
    <Suspense>
      <WidgetTryOn />
    </Suspense>
  );
}
