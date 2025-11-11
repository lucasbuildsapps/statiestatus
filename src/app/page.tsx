// app/page.tsx
import NavBar from "../components/NavBar";
import MapClient from "../components/MapClient";
import NearbyList from "../components/NearbyList";
import ContactForm from "../components/ContactForm";
import PrivacyNote from "../components/PrivacyNote";

export default function Page() {
  return (
    <>
      <NavBar />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">statiestatus.nl</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Controleer of een statiegeldmachine werkt en help anderen door de status te rapporteren.
          </p>
          <p className="text-xs text-gray-500">Laatste update: real-time uit community meldingen</p>
        </header>

        {/* ✅ Privacy banner */}
        <PrivacyNote />

        <section id="kaart" className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <MapClient />
        </section>

        <section id="nearby" className="rounded-2xl border bg-white shadow-sm p-4">
          <NearbyList />
        </section>

        <section id="about" className="rounded-2xl border bg-white shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold">Over dit project</h2>
          <p className="text-sm text-gray-700 max-w-2xl">
            Deze site helpt mensen snel te zien of een statiegeldmachine werkt. Meldingen komen van de
            community. Zo bespaar je tijd en frustratie in de winkel.
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Open source mindset — verbeteringen welkom.</li>
            <li>Privacy: we slaan geen persoonlijke gegevens op.</li>
            <li>Data wordt anoniem geaggregeerd per locatie.</li>
          </ul>
        </section>

        <section id="contact" className="rounded-2xl border bg-white shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="text-sm text-gray-700">Heb je een suggestie of foutmelding?</p>
          <ContactForm />
        </section>

        <footer className="pt-2 pb-10 text-center text-xs text-gray-500">
          Gemaakt met ❤️ door de community.
        </footer>
      </main>
    </>
  );
}
