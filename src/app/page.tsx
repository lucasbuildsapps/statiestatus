// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import NavBar from "../components/NavBar";
import MapClient from "../components/MapClient";
import NearbyList from "../components/NearbyList";
import InstallPrompt from "../components/InstallPrompt";

export const metadata: Metadata = {
  title: "statiestatus.nl – Check de status van statiegeldmachines in Nederland",
  description:
    "Voorkom een nutteloze rit. Bekijk actuele meldingen van andere bezoekers en zie hoe betrouwbaar elke locatie is.",
  metadataBase: new URL("https://www.statiestatus.nl"),
  alternates: {
    canonical: "https://www.statiestatus.nl/",
  },
  openGraph: {
    title: "statiestatus.nl – Status van statiegeldmachines",
    description:
      "Bekijk of statiegeldmachines werken en help anderen door de status te rapporteren.",
    url: "https://www.statiestatus.nl/",
    siteName: "statiestatus.nl",
    type: "website",
    locale: "nl_NL",
  },
  twitter: {
    card: "summary_large_image",
    title: "statiestatus.nl – Status van statiegeldmachines",
    description:
      "Controleer of statiegeldmachines werken, bekijk meldingen en voeg zelf meldingen toe.",
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "statiestatus.nl",
    url: "https://www.statiestatus.nl/",
    description:
      "Community-project waarmee je kunt zien of statiegeldmachines in Nederland werken.",
  };

  return (
    <>
      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <NavBar />
      <InstallPrompt />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 space-y-6 sm:space-y-8">
        {/* HERO */}
        <section className="space-y-4">
          <div className="space-y-4 md:space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-900 border border-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Onafhankelijk community-project in Nederland
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
                <Image
                  src="/icon-192.png"
                  alt="Logo statiestatus.nl"
                  fill
                  className="rounded-2xl shadow-sm object-cover"
                  sizes="56px"
                />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-slate-900">
                Zie in één oogopslag welke statiegeldmachines werken
              </h1>
            </div>

            <p className="text-gray-700 text-sm sm:text-base md:text-lg">
              Voorkom een nutteloze rit. Bekijk actuele meldingen van andere
              bezoekers en zie hoe betrouwbaar elke locatie is.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/reports"
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-xs sm:text-sm font-medium hover:bg-gray-900"
              >
                ⚡ Snel melding maken
              </Link>
              {/* Geen aparte 'Kaart bekijken' knop meer: kaart staat direct hieronder */}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-500">
            Laatste update: real-time uit community-meldingen • gegevens zijn
            indicatief en niet officieel.
          </p>
        </section>

        {/* MAP */}
        <section
          id="kaart"
          className="rounded-3xl border bg-white shadow-sm overflow-hidden"
        >
          <MapClient />
        </section>

        {/* MOBILE STICKY ACTIONS */}
        <div className="fixed bottom-3 inset-x-3 z-[950] md:hidden">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-md border flex gap-2 p-2">
            <a
              href="#nearby"
              className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-xl border bg-gray-50"
            >
              📍 In de buurt
            </a>
            <a
              href="#kaart"
              className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-xl bg-black text-white"
            >
              🔍 Terug naar kaart
            </a>
          </div>
        </div>

        {/* NEARBY LIST */}
        <section
          id="nearby"
          className="rounded-2xl border bg-white shadow-sm p-4"
        >
          <NearbyList />
        </section>

        <footer className="pt-2 pb-10 text-center text-xs text-gray-500 space-y-1">
          <p>statiestatus.nl • community-project • geen officiële bron</p>
          <p className="space-x-3">
            <a href="/over" className="underline hover:text-gray-700">
              Over & veelgestelde vragen
            </a>
            <a href="/contact" className="underline hover:text-gray-700">
              Contact & nieuwe machine
            </a>
            <a href="/privacy" className="underline hover:text-gray-700">
              Privacy
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}
