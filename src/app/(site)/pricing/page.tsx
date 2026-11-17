import { Suspense } from "react";
import type { Metadata } from "next";
import { PricingView } from "@/features/site/PricingView";

export const metadata: Metadata = {
  title: "Pricing for Brands — Threadflank",
  description: "Compare Threadflank plans for brands: catalog listings, virtual try-on, launch drops and shopper insights.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <Suspense>
      <PricingView />
    </Suspense>
  );
}
