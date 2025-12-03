// src/app/over/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "../../components/NavBar";

export const metadata: Metadata = {
  title: "Over statiestatus.nl",
  description:
    "Lees hoe statiestatus.nl werkt, waarom het is gemaakt en hoe we met privacy en betrouwbaarheid omgaan.",
};

export default function OverPage() {
  return (
    <>
      <NavBar />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Over dit project</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Transparante status van statiegeldmachines
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

        {/* Waarom */}
        <section className="rounded-2xl border bg-white shadow-sm p-6 space-y-3 text-sm">
          <h2 className="text-lg font-semibold">Waarom statiestatus.nl?</h2>
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
          </div>
        </section>

        {/* Hoe werkt het */}
        <section className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
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

        {/* Trust & privacy */}
        <section className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
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
                Foutje gezien of idee voor verbetering? Laat het weten via de
                contactpagina.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Meer details over gegevensverwerking vind je op de{" "}
            <Link href="/privacy" className="underline hover:text-gray-700">
              privacypagina
            </Link>
            .
          </p>
        </section>

        {/* FAQ teaser */}
        <section className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
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
                bijgewerkt.
              </dd>
            </div>
          </dl>

          <Link
            href="/faq"
            className="inline-flex text-xs px-3 py-1.5 rounded-full border bg-gray-50 hover:bg-gray-100 text-gray-700"
          >
            Alle veelgestelde vragen bekijken →
          </Link>
        </section>
      </main>
    </>
  );
}
