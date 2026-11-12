import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk } from "next/font/google";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { BackendWarmup } from "@/components/layout/BackendWarmup";
import "./globals.css";

const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Threadflank — See every outfit on you first",
  description:
    "Threadflank drapes any outfit on you from one selfie, in seconds. Try on from any store, plan looks for every occasion and decide with your circle.",
  icons: { icon: [{ url: "/icon.png", type: "image/png" }] },
};

export const viewport: Viewport = { themeColor: "#010214" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${familjen.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-clip bg-canvas text-ink">
        <BackendWarmup />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
