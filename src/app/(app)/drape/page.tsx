import { Suspense } from "react";
import type { Metadata } from "next";
import { DrapeView } from "@/features/drape/DrapeView";

export const metadata: Metadata = { title: "Drape — Threadflank", robots: { index: false } };

export default function DrapePage() {
  return (
    <Suspense>
      <DrapeView />
    </Suspense>
  );
}
