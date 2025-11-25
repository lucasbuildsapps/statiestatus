// src/components/ReportFlow.tsx
"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  fetchLocationsShared,
  type ApiLocation,
} from "@/lib/locationsClient";

type Machine = {
  id: string;
  name: string;
  retailer: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  currentStatus: "WORKING" | "ISSUES" | "OUT_OF_ORDER" | null;
};

type MachineWithDistance = Machine & {
  distanceKm: number | null;
};

type Screen =
  | "intro"
  | "locating"
  | "choose-auto"
  | "choose-manual"
  | "report"
  | "submitting"
  | "success";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(d: number | null) {
  if (d == null || !isFinite(d)) return "Afstand onbekend";
  if (d < 0.15) return "Bij jou in de buurt";
  if (d < 0.5) return `${(d * 1000).toFixed(0)} meter`;
  if (d < 10) return `${d.toFixed(1)} km`;
  return `${Math.round(d)} km`;
}

export default function ReportFlow() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [machinesError, setMachinesError] = useState<string | null>(null);

  const [screen, setScreen] = useState<Screen>("intro");

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [geoError, setGeoError] = useState<string | null>(null);

  const [candidateMachines, setCandidateMachines] = useState<
    MachineWithDistance[]
  >([]);
  const [selectedMachine, setSelectedMachine] =
    useState<MachineWithDistance | null>(null);

  const [worksNow, setWorksNow] = useState<null | boolean>(null);
  const [issueType, setIssueType] = useState<
    "FULL" | "RECEIPT" | "NO_ACCEPT" | "DOWN" | "OTHER" | null
  >(null);
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // fetch machines from shared cache
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMachines(true);
        const data = await fetchLocationsShared(false);
        if (!cancelled) {
          const mapped: Machine[] = data.map((l: ApiLocation) => ({
            id: l.id,
            name: l.name,
            retailer: l.retailer,
            lat: l.lat,
            lng: l.lng,
            address: l.address,
            city: l.city,
            currentStatus: l.currentStatus ?? null,
          }));
          setMachines(mapped);
          setMachinesError(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setMachines([]);
          setMachinesError("Kon machines niet laden.");
        }
      } finally {
        if (!cancelled) setLoadingMachines(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasMachines = machines.length > 0;

  const machinesWithDistance: MachineWithDistance[] = useMemo(() => {
    if (!userPos) {
      return machines.map((m) => ({ ...m, distanceKm: null }));
    }
    return machines.map((m) => ({
      ...m,
      distanceKm: haversineKm(userPos.lat, userPos.lng, m.lat, m.lng),
    }));
  }, [machines, userPos]);

  function startGeolocation() {
    setSubmitError(null);
    setGeoError(null);

    if (!hasMachines) {
      setMachinesError("Nog geen machines geladen. Probeer zo opnieuw.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setGeoError("Je browser ondersteunt locatie niet.");
      setScreen("choose-manual");
      return;
    }

    setScreen("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserPos(coords);
        pickNearestMachine(coords);
      },
      (err) => {
        console.error(err);
        setGeoError("Kon je locatie niet ophalen.");
        setScreen("choose-manual");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function pickNearestMachine(position: { lat: number; lng: number }) {
    if (!hasMachines) {
      setScreen("intro");
      return;
    }

    const withDist = machines.map((m) => ({
      ...m,
      distanceKm: haversineKm(position.lat, position.lng, m.lat, m.lng),
    }));

    const sorted = withDist.sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      return da - db;
    });

    const top = sorted.slice(0, 3);
    if (top.length === 0) {
      setScreen("choose-manual");
      return;
    }

    const best = top[0];
    const second = top[1];

    const autoRadiusKm = 0.3; // 300m
    const minGapKm = 0.1; // 100m

    if (
      best.distanceKm != null &&
      best.distanceKm <= autoRadiusKm &&
      (!second ||
        second.distanceKm == null ||
        second.distanceKm - best.distanceKm > minGapKm)
    ) {
      setSelectedMachine(best);
      setScreen("report");
      return;
    }

    setCandidateMachines(top);
    setScreen("choose-auto");
  }

  function selectMachineManual(m: MachineWithDistance) {
    setSelectedMachine(m);
    setScreen("report");
  }

  async function submitReport(e: FormEvent) {
    e.preventDefault();
    if (!selectedMachine || worksNow === null) return;

    setSubmitError(null);
    setScreen("submitting");

    const status = worksNow ? "WORKING" : "OUT_OF_ORDER";

    const issueLabel =
      worksNow || !issueType
        ? ""
        : {
            FULL: "Machine lijkt vol",
            RECEIPT: "Bon komt niet uit",
            NO_ACCEPT: "Accepteert geen flessen",
            DOWN: "Machine lijkt uitgevallen",
            OTHER: "Anders probleem",
          }[issueType];

    const noteParts: string[] = [];
    if (issueLabel) noteParts.push(issueLabel);
    if (note.trim()) noteParts.push(note.trim());
    const finalNote = noteParts.join(" — ");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedMachine.id,
          status,
          note: finalNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(
          data?.error || "Er ging iets mis bij het verzenden."
        );
        setScreen("report");
        return;
      }

      setScreen("success");
    } catch (err) {
      console.error(err);
      setSubmitError("Netwerkfout bij verzenden.");
      setScreen("report");
    }
  }

  const manualSearchEnabled = screen === "choose-manual";

  const filteredForManual = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = machinesWithDistance;
    if (!term) return list.slice(0, 20);
    return list
      .filter((m) =>
        [m.name, m.retailer, m.city, m.address].some((v) =>
          String(v).toLowerCase().includes(term)
        )
      )
      .slice(0, 20);
  }, [machinesWithDistance, search]);

  return (
    <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-900 border border-emerald-100">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Meld de status van een statiegeldmachine
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hoe werkt de machine nu?
        </h1>
        <p className="text-sm text-gray-600">
          Je helpt anderen door te melden of de statiegeldmachine op dit
          moment werkt. Geen account nodig, meldingen zijn anoniem.
        </p>
      </header>

      {machinesError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {machinesError}
        </div>
      )}

      {/* INTRO */}
      {screen === "intro" && (
        <section className="space-y-4">
          <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-3 text-sm">
            <p>
              Sta je nu bij een statiegeldmachine? Gebruik je locatie om
              automatisch de dichtstbijzijnde machine te vinden.
            </p>
            <button
              type="button"
              onClick={startGeolocation}
              disabled={loadingMachines || !hasMachines}
              className="w-full rounded-lg bg-black text-white text-sm px-4 py-2.5 disabled:opacity-60"
            >
              {loadingMachines
                ? "Machines laden…"
                : "📍 Gebruik mijn locatie"}
            </button>
            <button
              type="button"
              onClick={() => setScreen("choose-manual")}
              className="w-full rounded-lg border text-sm px-4 py-2.5"
            >
              Locatie niet delen? Zoek handmatig
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            We slaan geen exacte locatie op, alleen een anonieme melding voor
            de gekozen machine.
          </p>
        </section>
      )}

      {/* LOCATING */}
      {screen === "locating" && (
        <section className="rounded-2xl border bg-white shadow-sm p-5 space-y-3 text-sm text-center">
          <p className="font-medium">Locatie bepalen…</p>
          <p className="text-xs text-gray-500">
            Dit duurt meestal maar een paar seconden. Zorg dat
            locatie-toegang is toegestaan voor deze site.
          </p>
          <button
            type="button"
            onClick={() => setScreen("intro")}
            className="mt-2 text-xs text-gray-500 underline"
          >
            Annuleren
          </button>
        </section>
      )}

      {/* CHOOSE AUTO */}
      {screen === "choose-auto" && (
        <section className="rounded-2xl border bg-white shadow-sm p-5 space-y-3 text-sm">
          <p className="font-medium">
            We vonden meerdere machines in de buurt. Welke wil je melden?
          </p>
          <ul className="space-y-2">
            {candidateMachines.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => selectMachineManual(m)}
                  className="w-full text-left rounded-xl border px-3 py-2 hover:bg-gray-50"
                >
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-600">
                    {m.retailer} • {m.city}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {formatDistance(m.distanceKm)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setScreen("choose-manual")}
            className="w-full rounded-lg border text-xs px-3 py-2"
          >
            Toch liever handmatig zoeken
          </button>
        </section>
      )}

      {/* CHOOSE MANUAL */}
      {manualSearchEnabled && (
        <section className="rounded-2xl border bg-white shadow-sm p-5 space-y-3 text-sm">
          <p className="font-medium">Zoek je machine</p>
          {geoError && (
            <p className="text-[11px] text-gray-500">
              Locatie-toegang is niet beschikbaar. Kies hieronder
              handmatig de juiste machine.
            </p>
          )}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op supermarkt, plaats of adres…"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <ul className="space-y-2 max-h-80 overflow-auto">
            {filteredForManual.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => selectMachineManual(m)}
                  className="w-full text-left rounded-xl border px-3 py-2 hover:bg-gray-50"
                >
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-600">
                    {m.retailer} • {m.city}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {formatDistance(m.distanceKm)}
                  </div>
                </button>
              </li>
            ))}
            {!filteredForManual.length && (
              <li className="text-[11px] text-gray-500">
                Geen machines gevonden. Probeer een andere zoekterm.
              </li>
            )}
          </ul>
          <button
            type="button"
            onClick={() => setScreen("intro")}
            className="w-full rounded-lg border text-xs px-3 py-2"
          >
            Terug
          </button>
        </section>
      )}

      {/* REPORT FORM */}
      {(screen === "report" || screen === "submitting") &&
        selectedMachine && (
          <section className="rounded-2xl border bg-white shadow-sm p-5 space-y-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Je meldt nu:</p>
              <div className="rounded-xl border px-3 py-2 bg-gray-50">
                <div className="font-medium">{selectedMachine.name}</div>
                <div className="text-xs text-gray-600">
                  {selectedMachine.retailer} • {selectedMachine.city}
                </div>
                <div className="text-[11px] text-gray-500">
                  {selectedMachine.address}
                </div>
                {selectedMachine.distanceKm != null && (
                  <div className="text-[11px] text-gray-500 mt-1">
                    {formatDistance(selectedMachine.distanceKm)}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={submitReport} className="space-y-3">
              <div className="space-y-2">
                <p className="font-medium">
                  Werkt de machine op dit moment?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWorksNow(true);
                      setIssueType(null);
                    }}
                    className={
                      "rounded-lg border px-3 py-2 text-sm flex items-center justify-center gap-1 " +
                      (worksNow === true
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-800 hover:bg-gray-50")
                    }
                  >
                    ✅ Ja, hij werkt
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorksNow(false)}
                    className={
                      "rounded-lg border px-3 py-2 text-sm flex items-center justify-center gap-1 " +
                      (worksNow === false
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-gray-800 hover:bg-gray-50")
                    }
                  >
                    ❌ Nee, hij werkt niet
                  </button>
                </div>
              </div>

              {worksNow === false && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    Wat lijkt er aan de hand? (optioneel)
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {[
                      { id: "FULL", label: "Machine vol" },
                      { id: "RECEIPT", label: "Bon komt niet uit" },
                      { id: "NO_ACCEPT", label: "Accepteert geen flessen" },
                      { id: "DOWN", label: "Machine uitgevallen" },
                      { id: "OTHER", label: "Anders" },
                    ].map((opt) => {
                      const active = issueType === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() =>
                            setIssueType(
                              active ? null : (opt.id as typeof issueType)
                            )
                          }
                          className={
                            "px-3 py-1 rounded-full border " +
                            (active
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-800 hover:bg-gray-50")
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(worksNow === false || worksNow === true) && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Opmerking (optioneel)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={280}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder="Bijvoorbeeld: druk maar werkt, of scherm geeft foutcode X aan…"
                  />
                  <div className="text-[10px] text-gray-400 text-right">
                    {note.length}/280
                  </div>
                </div>
              )}

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={worksNow === null || screen === "submitting"}
                className="w-full rounded-lg bg-black text-white text-sm px-4 py-2.5 disabled:opacity-60"
              >
                {screen === "submitting"
                  ? "Melding versturen…"
                  : "Melding plaatsen"}
              </button>

              <button
                type="button"
                onClick={() => setScreen("intro")}
                className="w-full rounded-lg border text-xs px-3 py-2"
              >
                Andere machine kiezen
              </button>
            </form>
            <p className="text-[11px] text-gray-500">
              Meldingen worden gebundeld per locatie en zijn anoniem. Dit is
              geen officiële bron van supermarkten of fabrikanten.
            </p>
          </section>
        )}

      {/* SUCCESS */}
      {screen === "success" && (
        <section className="rounded-2xl border bg-white shadow-sm p-6 space-y-4 text-center text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-emerald-200 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl shadow-md">
                ✓
              </div>
            </div>
            <h2 className="text-lg font-semibold">
              Bedankt voor je melding! 🎉
            </h2>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              Je helpt anderen om een kapotte machine te vermijden en maakt
              de gegevens op statiestatus.nl betrouwbaarder.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <a
              href="/"
              className="w-full rounded-lg bg-black text-white text-sm px-4 py-2.5"
            >
              Terug naar de kaart
            </a>
            <button
              type="button"
              onClick={() => {
                setWorksNow(null);
                setIssueType(null);
                setNote("");
                setSubmitError(null);
                setSelectedMachine(null);
                setScreen("intro");
              }}
              className="w-full rounded-lg border text-xs px-3 py-2"
            >
              Nog een machine melden
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
