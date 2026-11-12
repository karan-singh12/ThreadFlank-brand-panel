import { AppShell } from "@/features/app/AppShell";
import { SiteFooter } from "@/features/site/SiteFooter";

/** Public pages (pricing, legal, contact): same top bar as the app, no sign-in required. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <SiteFooter />
    </AppShell>
  );
}
