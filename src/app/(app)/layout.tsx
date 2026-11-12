import type { Viewport } from "next";
import { RequireAuth } from "@/features/auth/guards";
import { AppShell } from "@/features/app/AppShell";

export const viewport: Viewport = {
  themeColor: "#010214",
  // Edge to edge on phones (the app bars pad for the notch and home indicator), and the
  // keyboard shrinks the layout so the chat composer stays above it.
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
