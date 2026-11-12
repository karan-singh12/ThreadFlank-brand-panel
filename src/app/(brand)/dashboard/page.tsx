import type { Metadata } from "next";
import { DashboardView } from "@/features/brand-panel/dashboard/DashboardView";

export const metadata: Metadata = { title: "Dashboard — Threadflank", robots: { index: false } };

export default function DashboardPage() {
  return <DashboardView />;
}
