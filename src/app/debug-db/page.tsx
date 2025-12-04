// src/app/debug-db/page.tsx
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TEST_ID = "d88a7c42-1ac3-41e5-9473-26c07234276a";

export default async function DebugDbPage() {
  let count = 0;
  let hasTestLocation = false;
  let error: string | null = null;

  try {
    count = await prisma.location.count();
    const loc = await prisma.location.findFirst({
      where: { id: TEST_ID },
    });
    hasTestLocation = !!loc;
  } catch (e) {
    console.error("Debug DB error", e);
    error = String(e);
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8 space-y-4 text-sm">
      <h1 className="text-2xl font-semibold">DB debug</h1>
      <p className="text-xs text-gray-600">
        Dit is een tijdelijke debugpagina. Verwijder dit bestand na het testen.
      </p>

      <div className="rounded-xl border bg-white p-4 space-y-2 font-mono text-xs">
        <p>
          <span className="font-semibold">Location count:</span> {count}
        </p>
        <p>
          <span className="font-semibold">Heeft DB TEST_ID?</span>{" "}
          {hasTestLocation ? "JA ✅" : "NEE ❌"}
        </p>
        <p>
          <span className="font-semibold">TEST_ID:</span> {TEST_ID}
        </p>
        {error && (
          <p className="text-red-600">
            <span className="font-semibold">Error:</span> {error}
          </p>
        )}
      </div>

      <a
        href="/"
        className="inline-flex px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-xs"
      >
        ← Terug naar startpagina
      </a>
    </main>
  );
}
