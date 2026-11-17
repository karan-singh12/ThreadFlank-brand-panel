import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk } from "next/font/google";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { BackendWarmup } from "@/components/layout/BackendWarmup";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONSUMER_SITE_URL, ORGANIZATION_ID, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo";
import "./globals.css";

const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: { icon: [{ url: "/icon.png", type: "image/png" }] },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    // Square logo until a 1200x630 social image is added at src/app/opengraph-image.png.
    images: [{ url: "/logo.png", width: 1252, height: 1252, alt: SITE_NAME }],
  },
  twitter: { card: "summary", title: SITE_TITLE, description: SITE_DESCRIPTION, images: ["/logo.png"] },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Threadflank",
    url: CONSUMER_SITE_URL,
    logo: `${CONSUMER_SITE_URL}/logo.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  },
];

export const viewport: Viewport = { themeColor: "#010214" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${familjen.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-clip bg-canvas text-ink">
        <JsonLd data={structuredData} />
        <BackendWarmup />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
