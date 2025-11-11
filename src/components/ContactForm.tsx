// components/ContactForm.tsx
"use client";

export default function ContactForm() {
  // simple mailto-based form (geen backend nodig)
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const name = encodeURIComponent((data.get("name") as string) || "");
    const email = encodeURIComponent((data.get("email") as string) || "");
    const message = encodeURIComponent((data.get("message") as string) || "");
    const subject = `statiestatus.nl bericht van ${name}`;
    const body = `Naam: ${name}%0AEmail: ${email}%0A%0ABericht:%0A${message}`;
    window.location.href = `mailto:lucas.abbenhuis@gmail.com?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 max-w-md">
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
      <textarea
        name="message"
        placeholder="Bericht"
        className="border rounded-lg px-3 py-2 text-sm resize-y min-h-[100px]"
        required
      />
      <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm">
        Verstuur
      </button>
      <p className="text-xs text-gray-500">We gebruiken je e-mail alleen om te antwoorden.</p>
    </form>
  );
}
