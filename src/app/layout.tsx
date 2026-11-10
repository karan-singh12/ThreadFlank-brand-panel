import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Threadflank Brand Panel | Virtual Flagship & Fashion OS",
  description: "Virtual store builder, catalog management, AI launch videos, and drape analytics for fashion brands.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-canvas text-ink antialiased selection:bg-brand-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

