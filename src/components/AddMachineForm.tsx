// src/components/AddMachineForm.tsx
"use client";

export default function AddMachineForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const name = (data.get("name") as string) || "";
    const retailer = (data.get("retailer") as string) || "";
    const address = (data.get("address") as string) || "";
    const city = (data.get("city") as string) || "";
    const note = (data.get("note") as string) || "";

    const subject = encodeURIComponent("Nieuwe statiegeldmachine toevoegen");
    const bodyLines = [
      `Naam locatie: ${name}`,
      `Winkelketen: ${retailer}`,
      `Adres: ${address}`,
      `Plaats: ${city}`,
      "",
      `Extra info / beschrijving:`,
      note,
      "",
      "Verstuurd via statiestatus.nl",
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));

    // TODO: set your real email address here
    const to = "lucas.abbenhuis@gmail.com";
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 max-w-md text-sm"
    >
      <input
        name="name"
        placeholder="Naam locatie (bijv. Jumbo Stadionplein)"
        className="border rounded-lg px-3 py-2"
        required
      />
      <input
        name="retailer"
        placeholder="Winkelketen (bijv. Jumbo, Albert Heijn)"
        className="border rounded-lg px-3 py-2"
        required
      />
      <input
        name="address"
        placeholder="Adres"
        className="border rounded-lg px-3 py-2"
        required
      />
      <input
        name="city"
        placeholder="Plaats"
        className="border rounded-lg px-3 py-2"
        required
      />
      <textarea
        name="note"
        placeholder="Extra info (binnen/buiten, bij welke ingang, etc.)"
        className="border rounded-lg px-3 py-2 resize-y min-h-[100px]"
      />
      <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg">
        Verstuur suggestie
      </button>
      <p className="text-xs text-gray-500">
        Je gegevens worden alleen gebruikt om eventueel te reageren op je melding.
      </p>
    </form>
  );
}