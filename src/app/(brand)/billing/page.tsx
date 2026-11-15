import type { Metadata } from "next";
import { BillingView } from "@/features/brand-panel/billing/BillingView";

export const metadata: Metadata = { title: "Billing — Threadflank", robots: { index: false } };

export default function BillingPage() {
  return <BillingView />;
}
