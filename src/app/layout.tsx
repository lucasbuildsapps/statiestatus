// src/app/layout.tsx
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "statiestatus.nl",
  applicationName: "Statiestatus",
  description: "Check en rapporteer de status van statiegeldmachines.",
  // All favicon / touch icons
  icons: {
    // Browser tab / address bar
    icon: [
      {
        url: "/favicon-96x96.png",
        type: "image/png",
        sizes: "96x96",
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
    // iOS home-screen icon
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  // Use the manifest that came from RealFaviconGenerator
  manifest: "/site.webmanifest",
  // This also influences how some platforms color the address bar / tile
  themeColor: "#16a34a",
  // Extra Apple PWA metadata (includes apple-mobile-web-app-title)
  appleWebApp: {
    capable: true,
    title: "Statiestatus",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-slate-900 bg-gradient-to-b from-slate-100 to-slate-200`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
