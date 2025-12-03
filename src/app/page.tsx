// src/app/page.tsx
import type { Metadata } from "next";
import NavBar from "../components/NavBar";
import MapClient from "../components/MapClient";
import NearbyList from "../components/NearbyList";
import InstallPrompt from "../components/InstallPrompt";

export const metadata: Metadata = {
  title: "statiestatus.nl – Check de status van statiegeldmachines in Nederland",
  description:
    "Controleer of een statiegeldmachine werkt en meld jouw ervaring. Geen account nodig, geen reclame, volledig community-gedreven.",
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
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-900 border border-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live community project in Nederland
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              statiestatus.nl
            </h1>

            <p className="text-gray-700 text-sm sm:text-base md:text-lg">
              Controleer of een statiegeldmachine werkt en help anderen door de
              status te rapporteren. Geen account nodig, geen reclame, volledig
              community-gedreven.
            </p>
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
            <a
              href="/over"
              className="underline hover:text-gray-700"
            >
              Over & veelgestelde vragen
            </a>
            <a
              href="/contact"
              className="underline hover:text-gray-700"
            >
              Contact & nieuwe machine
            </a>
            <a
              href="/privacy"
              className="underline hover:text-gray-700"
            >
              Privacy
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}
