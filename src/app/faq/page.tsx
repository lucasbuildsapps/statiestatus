// src/app/faq/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "../../components/NavBar";

export const metadata: Metadata = {
  title: "Veelgestelde vragen – statiestatus.nl",
  description:
    "Antwoorden op veelgestelde vragen over statiestatus.nl, betrouwbaarheid, privacy en misbruik.",
};

export default function FaqPage() {
  return (
    <>
      <NavBar />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Help & uitleg</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Veelgestelde vragen
            </h1>
          </div>
          <Link
            href="/"
            className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full border bg-white hover:bg-gray-50 text-gray-700"
          >
            ← Terug naar kaart
          </Link>
        </div>

        <Link
          href="/"
          className="sm:hidden inline-flex text-xs px-3 py-1.5 rounded-full border bg-white hover:bg-gray-50 text-gray-700"
        >
          ← Terug naar kaart
        </Link>

        <section className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
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
                bijgewerkt. De tekst &ldquo;Laatste update&rdquo; is gebaseerd
                op recente meldingen in de database.
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
      </main>
    </>
  );
}
