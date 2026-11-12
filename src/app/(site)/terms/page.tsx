import type { Metadata } from "next";
import { LegalView } from "@/features/site/LegalView";
import { brand } from "@/data/landing-page";
import { termsContent } from "@/data/site-content";

export const metadata: Metadata = { title: "Terms & conditions — Threadflank" };

export default function TermsPage() {
  return <LegalView cmsKey="terms" {...termsContent(brand.name)} />;
}
