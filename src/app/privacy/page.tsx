// src/app/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "../../components/NavBar";

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

        <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-8 text-sm text-gray-700">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Wat we bijhouden</h2>
            <p>
              statiestatus.nl slaat <strong>geen persoonlijke gegevens</strong> op.
              Je hebt geen account nodig en je hoeft je nergens voor aan te melden.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Elke melding bevat de gerapporteerde status, een optionele opmerking, en een{" "}
                <strong>gehashte versie van je IP-adres</strong>. Het IP-adres zelf wordt
                niet bewaard — het hash dient uitsluitend om excessief gebruik te detecteren.
              </li>
              <li>
                Er worden geen cookies geplaatst voor tracking, profilering of advertenties.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Lokale opslag in je browser</h2>
            <p>
              Enkele voorkeuren worden opgeslagen in{" "}
              <code className="px-1 py-0.5 rounded bg-gray-100 text-xs">localStorage</code>{" "}
              van je browser. Deze gegevens verlaten je apparaat nooit en worden nooit naar
              onze servers verstuurd:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Favoriete machines</strong> — zodat je ze snel terugvindt bij een
                volgend bezoek.
              </li>
              <li>
                <strong>Laatste bekende locatie</strong> — om de lijst "In de buurt" sneller
                te laden zonder opnieuw locatietoestemming te vragen.
              </li>
              <li>
                <strong>Privacy-banner gezien</strong> — om de melding onderaan de pagina
                niet herhaaldelijk te tonen.
              </li>
            </ul>
            <p>
              Je kunt deze gegevens op elk moment verwijderen via de instellingen van je
              browser (onder "Site-instellingen" → "Lokale opslag" of "Cookies en sitedata").
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Locatiegegevens</h2>
            <p>
              Als je locatietoestemming geeft, wordt je huidige positie gebruikt om machines
              in de buurt te tonen en op de kaart te centreren. Deze coördinaten worden alleen
              lokaal verwerkt en tijdelijk opgeslagen (zie hierboven). Ze worden niet naar
              onze servers verstuurd of gekoppeld aan meldingen.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Analyse &amp; prestaties</h2>
            <p>
              We gebruiken <strong>Vercel Analytics</strong> en <strong>Vercel Speed Insights</strong>{" "}
              voor geanonimiseerde statistieken over gebruik en laadtijden. Er worden geen
              herleidbare persoonsgegevens doorgestuurd. Vercel verwerkt uitsluitend geanonimiseerde
              signalen (zie{" "}
              <a
                href="https://vercel.com/docs/analytics/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Vercel Privacy Policy
              </a>
              ).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Kaartprovider</h2>
            <p>
              De kaart is gebaseerd op <strong>OpenStreetMap</strong>-tegels via CartoDB/Leaflet.
              Bij het bekijken van de kaart worden tegels opgehaald van externe servers; daarvoor
              gelden de privacybeleiden van{" "}
              <a
                href="https://www.openstreetmap.org/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                OpenStreetMap
              </a>{" "}
              en CartoDB. Statiestatus.nl stuurt geen persoonsgegevens mee in kaartverzoeken.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Lettertypen</h2>
            <p>
              De website gebruikt het lettertype Geist, dat via Next.js <em>lokaal</em> wordt
              gebundeld. Er worden geen lettertypeverzoeken naar externe servers (zoals Google
              Fonts) gestuurd.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Meldingen en inhoud</h2>
            <p>
              Meldingen zijn volledig anoniem. We slaan geen gebruikersnamen, e-mailadressen
              of apparaatinformatie op. Meldingen met een noot zijn openbaar zichtbaar op de
              detailpagina van de betreffende machine.
            </p>
            <p>
              Wil je een specifieke melding laten verwijderen? Neem dan contact op (zie hieronder).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Contact</h2>
            <p>
              statiestatus.nl is een onafhankelijk community-project. Vragen, opmerkingen of
              verzoeken tot verwijdering van inhoud kun je melden via een{" "}
              <a
                href="https://github.com/lucasbuildsapps/statiestatus/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                GitHub-issue
              </a>
              .
            </p>
          </section>

          <p className="text-[11px] text-gray-400 pt-2 border-t">
            Laatst bijgewerkt: januari 2025
          </p>
        </div>
      </main>
    </>
  );
}
