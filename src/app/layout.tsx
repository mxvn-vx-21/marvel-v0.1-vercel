import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { appUrl } from "@/lib/urls";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "MARVEL.WTF — Become the character.", template: "%s" },
  description: "Build a superhero-grade personal identity. Claim your username and your own page on MARVEL.WTF.",
  openGraph: { siteName: "MARVEL.WTF", type: "website" },
  twitter: { card: "summary" },
};

export const viewport: Viewport = { themeColor: "#0a0a0f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-spark focus:px-3 focus:py-2 focus:font-bold focus:text-black">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
