// src/app/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import PrivacyNote from "../../components/PrivacyNote";

export const metadata: Metadata = {
  title: "Privacy – statiestatus.nl",
  description:
    "Uitleg over hoe statiestatus.nl met gegevens, IP-adressen en meldingen omgaat.",
};

export default function PrivacyPage() {
  return (
    <>
      <NavBar />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Privacy</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Hoe we met jouw gegevens omgaan
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

        <section className="rounded-2xl border bg-white shadow-sm p-6 space-y-4 text-sm text-gray-700">
          <PrivacyNote />
        </section>
      </main>
    </>
  );
}
