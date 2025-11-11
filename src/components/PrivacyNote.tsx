// components/PrivacyNote.tsx
"use client";

import { useState, useEffect } from "react";

export default function PrivacyNote() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = window.localStorage.getItem("privacyNoteSeen");
    if (!seen) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="rounded-xl border bg-white shadow-sm p-3 text-xs text-gray-700 flex items-start gap-3">
      <div className="font-medium">Privacy</div>
      <div className="flex-1">
        We gebruiken Vercel Analytics en Speed Insights voor geanonimiseerde statistieken.
        Er worden geen persoonlijke gegevens opgeslagen.
      </div>
      <button
        onClick={() => {
          window.localStorage.setItem("privacyNoteSeen", "1");
          setShow(false);
        }}
        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
      >
        Oké
      </button>
    </div>
  );
}
