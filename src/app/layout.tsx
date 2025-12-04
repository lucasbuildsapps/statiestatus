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
  description: "Check en rapporteer de status van statiegeldmachines.",
  icons: {
    // These should all live in /public
    icon: [
      // Favicon for browsers + Google
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    // If you later add an apple-touch-icon, you can set:
    // apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#16a34a",
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
