import type { Metadata } from "next";
import { BiddingView } from "@/features/brand-panel/bidding/BiddingView";

export const metadata: Metadata = { title: "Bidding — Threadflank", robots: { index: false } };

export default function BiddingPage() {
  return <BiddingView />;
}
