// src/components/NavBar.tsx
"use client";
import Logo from "./Logo";

export default function NavBar() {
  return (
    <div className="sticky top-0 z-[2000] bg-white/90 backdrop-blur border-b">
      <nav className="max-w-4xl mx-auto flex items-center justify-between p-3">
        <a href="/" className="flex items-center gap-2">
          <Logo />
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a href="#kaart" className="hover:underline">Kaart</a>
          <a href="#nearby" className="hover:underline">In de buurt</a>
          <a href="#add-machine" className="hover:underline">Toevoegen</a>
          <a href="#about" className="hover:underline">Over</a>
          <a href="#contact" className="hover:underline">Contact</a>
          <a
            href="#kaart"
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
            title="Plaats een melding"
          >
            Melden
          </a>
        </div>
      </nav>
    </div>
  );
}