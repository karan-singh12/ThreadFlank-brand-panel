import type { Metadata } from "next";
import { TrendingView } from "@/features/discover/TrendingView";

export const metadata: Metadata = { title: "Trending — Threadflank", robots: { index: false } };

export default function TrendingPage() {
  return <TrendingView />;
}
