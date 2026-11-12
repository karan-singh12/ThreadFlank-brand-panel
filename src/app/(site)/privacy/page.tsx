import type { Metadata } from "next";
import { LegalView } from "@/features/site/LegalView";
import { brand } from "@/data/landing-page";
import { privacyContent } from "@/data/site-content";

export const metadata: Metadata = { title: "Privacy policy — Threadflank" };

export default function PrivacyPage() {
  return <LegalView cmsKey="privacy" {...privacyContent(brand.name)} />;
}
