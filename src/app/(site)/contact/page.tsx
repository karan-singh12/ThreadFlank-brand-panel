import { Suspense } from "react";
import type { Metadata } from "next";
import { ContactView } from "@/features/site/ContactView";

export const metadata: Metadata = {
  title: "Contact Threadflank for Brands",
  description: "Talk to the Threadflank team about adding AI virtual try-on to your fashion store.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Suspense>
      <ContactView />
    </Suspense>
  );
}
