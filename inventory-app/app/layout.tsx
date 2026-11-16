import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kitchen Inventory",
  description: "Stock, deliveries and vendors for the restaurant.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2b4a7c" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {/* Every screen depends on who is signed in, so it all streams in per request. */}
        <Suspense fallback={<p className="p-6 text-stone-500">Loading…</p>}>{children}</Suspense>
      </body>
    </html>
  );
}
