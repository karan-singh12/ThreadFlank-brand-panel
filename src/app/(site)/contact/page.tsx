import { Suspense } from "react";
import type { Metadata } from "next";
import { ContactView } from "@/features/site/ContactView";

export const metadata: Metadata = { title: "Contact us — Threadflank" };

export default function ContactPage() {
  return (
    <Suspense>
      <ContactView />
    </Suspense>
  );
}
