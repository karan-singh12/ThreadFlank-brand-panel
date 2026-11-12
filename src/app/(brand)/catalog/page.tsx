import type { Metadata } from "next";
import { CatalogView } from "@/features/brand-panel/catalog/CatalogView";

export const metadata: Metadata = { title: "Catalog — Threadflank", robots: { index: false } };

export default function CatalogPage() {
  return <CatalogView />;
}
