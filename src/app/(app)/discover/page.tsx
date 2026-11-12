import type { Metadata } from "next";
import { DiscoverView } from "@/features/discover/DiscoverView";

export const metadata: Metadata = { title: "Discover — Threadflank", robots: { index: false } };

export default function DiscoverPage() {
  return <DiscoverView />;
}
