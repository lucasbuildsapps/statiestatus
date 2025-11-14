// src/components/NavBar.tsx
"use client";

import Image from "next/image";

export default function NavBar() {
  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
        <a href="#top" className="flex items-center gap-2">
          <Image
            src="/icon.svg"
            alt="statiestatus.nl"
            width={24}
            height={24}
          />
          <span className="font-semibold text-sm sm:text-base">
            statiestatus.nl
          </span>
        </a>
        <nav className="flex items-center gap-3 text-xs sm:text-sm text-gray-700">
          <a href="#kaart" className="hover:text-black">
            Kaart
          </a>
          <a href="#nearby" className="hover:text-black">
            In de buurt
          </a>
          <a href="#about" className="hover:text-black">
            Over
          </a>
          <a href="#contact" className="hover:text-black">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
