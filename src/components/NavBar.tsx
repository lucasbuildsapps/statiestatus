// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "#kaart", label: "Kaart", type: "anchor" as const },
  { href: "#nearby", label: "In de buurt", type: "anchor" as const },
  { href: "#about", label: "Over", type: "anchor" as const },
  { href: "#contact", label: "Contact", type: "anchor" as const },
  { href: "/stats", label: "Stats", type: "link" as const },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <nav className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 h-12 flex items-center justify-between text-sm">
        <Link href="/" className="font-semibold">
          statiestatus.nl
        </Link>
        <div className="flex gap-4 text-xs sm:text-sm">
          {navItems.map((item) =>
            item.type === "anchor" ? (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-black"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "hover:text-black " +
                  (pathname === item.href
                    ? "text-black font-medium"
                    : "text-gray-700")
                }
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      </nav>
    </header>
  );
}
