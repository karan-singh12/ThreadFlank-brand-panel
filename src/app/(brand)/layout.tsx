import type { Viewport } from "next";
import { RequireAuth } from "@/features/auth/guards";
import { BrandPanelProvider } from "@/features/brand-panel/BrandPanelProvider";
import { BrandShell } from "@/features/brand-panel/BrandShell";

export const viewport: Viewport = {
  themeColor: "#010214",
  viewportFit: "cover",
};

/** Every signed-in brand tab (dashboard, catalog, AI studio, drops, bidding) shares this data and frame. */
export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <BrandPanelProvider>
        <BrandShell>{children}</BrandShell>
      </BrandPanelProvider>
    </RequireAuth>
  );
}
