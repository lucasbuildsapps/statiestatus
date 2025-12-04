// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "#kaart", label: "Kaart", type: "anchor" as const },
  { href: "#nearby", label: "In de buurt", type: "anchor" as const },
  { href: "/over", label: "Over", type: "link" as const },
  { href: "/reports", label: "Snel melden", type: "link" as const },
  { href: "/contact", label: "Contact", type: "link" as const },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isHome = pathname === "/";
  const handleClick = () => setOpen(false);

  const visibleItems = navItems.filter((item) =>
    item.type === "anchor" ? isHome : true
  );

  return (
    <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-[1000]">
      <nav className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 h-12 flex items-center justify-between text-sm">
        <Link href="/" className="font-semibold" onClick={handleClick}>
          statiestatus.nl
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex gap-4 text-xs sm:text-sm">
          {visibleItems.map((item) =>
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

        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs text-gray-700 bg-white/80"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu openen"
        >
          ☰
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t bg-white/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-3 py-2 flex flex-col gap-1 text-sm">
            {visibleItems.map((item) =>
              item.type === "anchor" ? (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={handleClick}
                  className="px-2 py-2 rounded-lg hover:bg-gray-50 text-gray-800"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleClick}
                  className={
                    "px-2 py-2 rounded-lg hover:bg-gray-50 " +
                    (pathname === item.href
                      ? "text-black font-medium"
                      : "text-gray-800")
                  }
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
