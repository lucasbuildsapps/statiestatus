// src/app/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import NavBar from "../components/NavBar";
import MapClient from "../components/MapClient";
import NearbyList from "../components/NearbyList";
import ContactForm from "../components/ContactForm";
import PrivacyNote from "../components/PrivacyNote";
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

      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 space-y-8 sm:space-y-10">
        {/* HERO */}
        <section className="space-y-4 md:space-y-5">
          <div className="space-y-3 md:space-y-4 max-w-2xl">
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

        <PrivacyNote />

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

        {/* NEARBY + WHY */}
        <section className="grid md:grid-cols-[1.6fr,1.2fr] gap-6">
          <section
            id="nearby"
            className="rounded-2xl border bg-white shadow-sm p-4"
          >
            <h2 className="text-base font-semibold mb-2">
              Statiegeldmachines bij jou in de buurt
            </h2>
            <NearbyList />
          </section>

          <section className="rounded-2xl border bg-white shadow-sm p-5 space-y-3 text-sm">
            <h2 className="text-base font-semibold">
              Waarom statiestatus.nl?
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Bespaar tijd: zie vooraf of de machine het doet.</li>
              <li>✅ Geen account, geen reclame, geen trackers.</li>
              <li>✅ Meldingen worden anoniem en gebundeld per locatie.</li>
            </ul>
            <div className="border-t pt-3 space-y-1 text-xs text-gray-500">
              <p>
                Dit is een onafhankelijk project, niet gekoppeld aan
                supermarkten of fabrikanten.
              </p>
              <p>
                Status kan afwijken van de werkelijkheid; check altijd ook ter
                plekke.
              </p>
              <p>
                Nieuwsgierig naar gemiddelden en trends?{" "}
                <Link
                  href="/stats"
                  className="underline hover:text-gray-700"
                >
                  Bekijk de statistiekenpagina.
                </Link>
              </p>
            </div>
          </section>
        </section>


        {/* CITY / RETAILER QUICK LINKS */}
        <section className="rounded-2xl border bg-white shadow-sm p-5 space-y-3 text-sm">
          <h2 className="text-base font-semibold">
            Snel zoeken per stad of winkelketen
          </h2>
          <p className="text-gray-700 text-sm">
            Liever een overzicht? Gebruik de kaarten per stad of per keten om
            snel te zien welke machines er zijn en wat hun status is.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="font-medium text-gray-700">
                Populaire steden
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/stad/Amsterdam"
                  className="px-3 py-1.5 rounded-full border bg-gray-50 hover:bg-gray-100"
                >
                  Amsterdam
                </Link>
                <Link
                  href="/stad/Rotterdam"
                  className="px-3 py-1.5 rounded-full border bg-gray-50 hover:bg-gray-100"
                >
                  Rotterdam
                </Link>
                <Link
                  href="/stad/Utrecht"
                  className="px-3 py-1.5 rounded-full border bg-gray-50 hover:bg-gray-100"
                >
                  Utrecht
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-gray-700">
                Populaire winkelketens
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/keten/Albert%20Heijn"
                  className="px-3 py-1.5 rounded-full border bg-gray-50 hover:bg-gray-100"
                >
                  Albert Heijn
                </Link>
                <Link
                  href="/keten/Jumbo"
                  className="px-3 py-1.5 rounded-full border bg-gray-50 hover:bg-gray-100"
                >
                  Jumbo
                </Link>
                <Link
                  href="/keten/Lidl"
                  className="px-3 py-1.5 rounded-full border bg-gray-50 hover:bg-gray-100"
                >
                  Lidl
                </Link>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Deze pagina&apos;s zijn extra ingangen voor zoekmachines én voor
            bezoekers die snel willen filteren op locatie of keten.
          </p>
        </section>



        {/* HOW IT WORKS */}
        <section
          id="about"
          className="rounded-2xl border bg-white shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">Hoe werkt het?</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                1. Zoek een machine
              </div>
              <p>
                Gebruik de kaart of de lijst &ldquo;In de buurt&rdquo; om jouw
                statiegeldmachine te vinden.
              </p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                2. Check de status
              </div>
              <p>
                Bekijk recente meldingen van andere gebruikers en de huidige
                status (werkend of stuk).
              </p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                3. Meld jouw ervaring
              </div>
              <p>
                Plaats zelf een melding na je bezoek. Zo help je anderen én
                wordt de data betrouwbaarder.
              </p>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section
          id="trust"
          className="rounded-2xl border bg-white shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">
            Transparant & privacy-vriendelijk
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <div className="font-medium mb-1">Community-data</div>
              <p>
                Alle statussen komen van gebruikers. Hoe meer meldingen, hoe
                betrouwbaarder de locatie. We tonen dit bij iedere machine.
              </p>
            </div>
            <div>
              <div className="font-medium mb-1">Geen tracking</div>
              <p>
                We slaan geen namen of accounts op. IP-adressen worden gehasht
                puur om misbruik te voorkomen.
              </p>
            </div>
            <div>
              <div className="font-medium mb-1">Feedback welkom</div>
              <p>
                Foutje gezien of idee voor verbetering? Laat het weten via het
                formulier hieronder.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="rounded-2xl border bg-white shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">Veelgestelde vragen</h2>
          <dl className="space-y-3 text-sm text-gray-700">
            <div>
              <dt className="font-medium">Hoe betrouwbaar zijn de meldingen?</dt>
              <dd className="text-gray-600">
                Meldingen komen volledig van gebruikers. Bij elke machine zie je
                hoeveel meldingen er zijn en hoe recent de laatste is. Meer
                meldingen en een recente update betekenen meestal een
                betrouwbaardere status.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Hoe vaak wordt de kaart bijgewerkt?</dt>
              <dd className="text-gray-600">
                Zodra iemand een melding plaatst wordt de kaart direct
                bijgewerkt. De tekst &ldquo;Laatste update&rdquo; boven de kaart
                is gebaseerd op recente meldingen in de database.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Wat doe je tegen misbruik?</dt>
              <dd className="text-gray-600">
                Meldingen zijn anoniem, maar IP-adressen worden gehasht zodat
                herhaald misbruik opgespoord kan worden. Bij opvallende patronen
                kunnen meldingen worden gefilterd of handmatig aangepast.
              </dd>
            </div>
            <div>
              <dt className="font-medium">
                Is dit een officiële dienst van supermarkten?
              </dt>
              <dd className="text-gray-600">
                Nee. statiestatus.nl is een onafhankelijk community-project. De
                gegevens zijn indicatief en geen officiële bron van supermarkten
                of fabrikanten.
              </dd>
            </div>
          </dl>
        </section>

        {/* CONTACT & NIEUWE MACHINE IN ÉÉN */}
        <section
          id="contact"
          className="rounded-2xl border bg-white shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">Nieuwe machine of feedback?</h2>
          <p className="text-sm text-gray-700">
            Zie je een statiegeldmachine die nog ontbreekt, of heb je een vraag
            of suggestie? Gebruik het formulier hieronder om een nieuwe locatie
            door te geven of algemene feedback te sturen.
          </p>
          <ContactForm />
        </section>

        <footer className="pt-2 pb-10 text-center text-xs text-gray-500">
          statiestatus.nl • community-project • geen officiële bron
        </footer>
      </main>
    </>
  );
}
