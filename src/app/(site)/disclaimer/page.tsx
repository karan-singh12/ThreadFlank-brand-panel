import type { Metadata } from "next";
import { LegalView } from "@/features/site/LegalView";
import { brand } from "@/data/landing-page";
import { disclaimerContent } from "@/data/site-content";

export const metadata: Metadata = {
  title: "Disclaimer — Threadflank",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return <LegalView cmsKey="disclaimer" {...disclaimerContent(brand.name)} />;
}
