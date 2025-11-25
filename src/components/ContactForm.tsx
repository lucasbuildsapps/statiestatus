// src/components/ContactForm.tsx
"use client";

import { useState } from "react";

type Mode = "ADD_MACHINE" | "GENERAL";

export default function ContactForm() {
  const [mode, setMode] = useState<Mode>("ADD_MACHINE");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    const modeValue = (data.get("mode") as string) || "ADD_MACHINE";
    const mode = (modeValue as Mode) ?? "ADD_MACHINE";

    const name = (data.get("name") as string) || "";
    const email = (data.get("email") as string) || "";

    let subject = "";
    const bodyLines: string[] = [];

    if (mode === "ADD_MACHINE") {
      const locationName = (data.get("locationName") as string) || "";
      const retailer = (data.get("retailer") as string) || "";
      const address = (data.get("address") as string) || "";
      const city = (data.get("city") as string) || "";
      const note = (data.get("machineNote") as string) || "";

      subject = `Nieuwe statiegeldmachine via statiestatus.nl`;

      bodyLines.push(
        `Type melding: Nieuwe machine`,
        "",
        `Naam: ${name}`,
        `E-mail: ${email}`,
        "",
        `Naam locatie: ${locationName}`,
        `Winkelketen: ${retailer}`,
        `Adres: ${address}`,
        `Plaats: ${city}`,
        "",
        `Extra info:`,
        note || "(geen extra info)",
        "",
        "Verstuurd via statiestatus.nl"
      );
    } else {
      const topic = (data.get("topic") as string) || "";
      const message = (data.get("message") as string) || "";

      subject = `Bericht via statiestatus.nl`;

      bodyLines.push(
        `Type melding: Algemene vraag / feedback`,
        "",
        `Naam: ${name}`,
        `E-mail: ${email}`,
        topic ? `Onderwerp: ${topic}` : "",
        "",
        `Bericht:`,
        message,
        "",
        "Verstuurd via statiestatus.nl"
      );
    }

    const cleanedLines = bodyLines.filter(Boolean);
    const body = encodeURIComponent(cleanedLines.join("\n"));
    const encodedSubject = encodeURIComponent(subject);

    const to = "lucas.abbenhuis@gmail.com";
    window.location.href = `mailto:${to}?subject=${encodedSubject}&body=${body}`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl"
    >
      {/* mode toggle */}
      <div className="md:col-span-2 flex items-center gap-2 text-xs">
        <input type="hidden" name="mode" value={mode} />
        <div className="inline-flex rounded-full border bg-gray-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("ADD_MACHINE")}
            className={
              "px-3 py-1 rounded-full transition " +
              (mode === "ADD_MACHINE"
                ? "bg-black text-white"
                : "text-gray-700")
            }
          >
            Nieuwe machine doorgeven
          </button>
          <button
            type="button"
            onClick={() => setMode("GENERAL")}
            className={
              "px-3 py-1 rounded-full transition " +
              (mode === "GENERAL"
                ? "bg-black text-white"
                : "text-gray-700")
            }
          >
            Algemene vraag / feedback
          </button>
        </div>
      </div>

      {/* algemene gegevens */}
      <input
        name="name"
        placeholder="Naam"
        className="border rounded-lg px-3 py-2 text-sm"
        required
      />
      <input
        type="email"
        name="email"
        placeholder="E-mail"
        className="border rounded-lg px-3 py-2 text-sm"
        required
      />

      {/* velden voor NIEUWE MACHINE */}
      {mode === "ADD_MACHINE" && (
        <>
          <input
            name="locationName"
            placeholder="Naam locatie (bijv. Jumbo Stadionplein)"
            className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
            required
          />
          <input
            name="retailer"
            placeholder="Winkelketen (bijv. Jumbo, Albert Heijn)"
            className="border rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            name="address"
            placeholder="Adres"
            className="border rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            name="city"
            placeholder="Plaats"
            className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
            required
          />
          <textarea
            name="machineNote"
            placeholder="Extra info (binnen/buiten, bij welke ingang, etc.)"
            className="border rounded-lg px-3 py-2 text-sm resize-y min-h-[100px] md:col-span-2"
          />
        </>
      )}

      {/* velden voor ALGEMENE VRAAG */}
      {mode === "GENERAL" && (
        <>
          <input
            name="topic"
            placeholder="Onderwerp (optioneel)"
            className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            name="message"
            placeholder="Bericht"
            className="border rounded-lg px-3 py-2 text-sm resize-y min-h-[120px] md:col-span-2"
            required
          />
        </>
      )}

      <div className="md:col-span-2 flex flex-col gap-2">
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded-lg text-sm"
        >
          Verstuur
        </button>
        <p className="text-xs text-gray-500">
          We gebruiken je e-mail alleen om te antwoorden. Je bericht wordt
          verstuurd via je eigen e-mailprogramma.
        </p>
      </div>
    </form>
  );
}
