// src/app/page.tsx
"use client";

import NavBar from "../components/NavBar";
import MapClient from "../components/MapClient";
import NearbyList from "../components/NearbyList";
import ContactForm from "../components/ContactForm";
import PrivacyNote from "../components/PrivacyNote";
import AddMachineForm from "../components/AddMachineForm";

export default function Page() {
  return (
    <>
      <NavBar />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 space-y-8 sm:space-y-10">
        {/* HERO */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-900 border border-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live community project in Nederland
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            statiestatus.nl
          </h1>

          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Controleer of een statiegeldmachine werkt en help anderen door de
            status te rapporteren. Geen account nodig, volledig community-gedreven.
          </p>

          <p className="text-xs text-gray-500">
            Laatste update: real-time uit community meldingen • gegevens zijn
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
                Dit is een onafhankelijk project, niet gekoppeld aan supermarkten
                of fabrikanten.
              </p>
              <p>
                Status kan afwijken van de werkelijkheid; check altijd ook ter
                plekke.
              </p>
            </div>
          </section>
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
                Gebruik de kaart of lijst &ldquo;In de buurt&rdquo; om jouw
                statiegeldmachine te vinden.
              </p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                2. Check de status
              </div>
              <p>
                Bekijk recente meldingen van andere gebruikers en de huidige status
                (werkend, problemen, stuk).
              </p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                3. Meld jouw ervaring
              </div>
              <p>
                Plaats zelf een melding na je bezoek. Zo help je anderen én wordt
                de data betrouwbaarder.
              </p>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section
          id="trust"
          className="rounded-2xl border bg-white shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">Transparant & privacy-vriendelijk</h2>
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
                contactformulier hieronder.
              </p>
            </div>
          </div>
        </section>

        {/* ADD MACHINE */}
        <section
          id="add-machine"
          className="rounded-2xl border bg-white shadow-sm p-6 space-y-3"
        >
          <h2 className="text-lg font-semibold">Mist er een machine?</h2>
          <p className="text-sm text-gray-700">
            Zie je een statiegeldmachine die nog niet op de kaart staat? Stuur de
            gegevens in en we voegen hem zo snel mogelijk toe.
          </p>
          <AddMachineForm />
        </section>

        {/* CONTACT */}
        <section
          id="contact"
          className="rounded-2xl border bg-white shadow-sm p-6 space-y-3"
        >
          <h2 className="text-lg font-semibold">Contact & feedback</h2>
          <p className="text-sm text-gray-700">
            Suggesties, bugs of wil je helpen? Stuur een bericht via het formulier
            hieronder.
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
