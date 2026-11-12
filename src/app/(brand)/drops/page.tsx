import type { Metadata } from "next";
import { DropsView } from "@/features/brand-panel/drops/DropsView";

export const metadata: Metadata = { title: "Drops — Threadflank", robots: { index: false } };

export default function DropsPage() {
  return <DropsView />;
}
