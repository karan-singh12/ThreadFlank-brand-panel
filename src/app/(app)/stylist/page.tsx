import type { Metadata } from "next";
import { StylistQueueView } from "@/features/stylist/StylistQueueView";

export const metadata: Metadata = { title: "Stylist queue — Threadflank", robots: { index: false } };

export default function StylistPage() {
  return <StylistQueueView />;
}
