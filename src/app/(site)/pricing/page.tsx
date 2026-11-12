import { Suspense } from "react";
import type { Metadata } from "next";
import { PricingView } from "@/features/site/PricingView";

export const metadata: Metadata = { title: "Pricing — Threadflank" };

export default function PricingPage() {
  return (
    <Suspense>
      <PricingView />
    </Suspense>
  );
}
