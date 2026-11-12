import type { Metadata } from "next";
import { AiStudioView } from "@/features/brand-panel/ai-studio/AiStudioView";

export const metadata: Metadata = { title: "AI Studio — Threadflank", robots: { index: false } };

export default function AiStudioPage() {
  return <AiStudioView />;
}
