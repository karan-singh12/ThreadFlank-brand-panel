import type { Metadata } from "next";
import { BrandsView } from "@/features/brands/BrandsView";

export const metadata: Metadata = {
  title: "Partner Brands & Ateliers — Threadflank",
  description: "Browse verified Indian and global luxury couture houses. Explore complete catalogs and drape on your digital twin.",
  robots: { index: false },
};

export default function BrandsPage() {
  return <BrandsView />;
}

