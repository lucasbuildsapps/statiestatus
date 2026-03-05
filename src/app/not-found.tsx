// src/app/not-found.tsx
import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Pagina niet gevonden – statiestatus.nl",
};

export default function NotFound() {
  return (
    <>
      <NavBar />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-16 sm:py-24 flex flex-col items-center text-center space-y-6">
        <p className="text-6xl font-bold text-slate-200 select-none">404</p>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Pagina niet gevonden
          </h1>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            De pagina die je zoekt bestaat niet of is verplaatst. Gebruik de kaart om
            een statiegeldmachine in jouw buurt te vinden.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-sm pt-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
          >
            Naar de kaart
          </Link>
          <Link
            href="/reports"
            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-slate-700"
          >
            Melding plaatsen
          </Link>
        </div>
      </main>
    </>
  );
}
