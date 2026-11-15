import type { Metadata } from "next";
import { InsightsView } from "@/features/brand-panel/insights/InsightsView";

export const metadata: Metadata = { title: "Insights — Threadflank", robots: { index: false } };

export default function InsightsPage() {
  return <InsightsView />;
}
