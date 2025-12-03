// src/app/contact/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import ContactForm from "../../components/ContactForm";

export const metadata: Metadata = {
  title: "Contact & nieuwe machine aanmelden – statiestatus.nl",
  description:
    "Meld een nieuwe locatie of stuur feedback over statiegeldmachines in Nederland.",
};

export default function ContactPage() {
  return (
    <>
      <NavBar />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Contact</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Nieuwe machine of feedback?
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
          <p className="text-sm text-gray-700">
            Zie je een statiegeldmachine die nog ontbreekt, of heb je een vraag
            of suggestie? Gebruik het formulier hieronder om een nieuwe locatie
            door te geven of algemene feedback te sturen.
          </p>
          <ContactForm />
        </section>
      </main>
    </>
  );
}
