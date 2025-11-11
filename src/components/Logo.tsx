// components/Logo.tsx
"use client";

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* SVG mascot: bottle + smile + sparkles */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
        {/* Bottle body */}
        <rect x="18" y="10" width="28" height="42" rx="10" fill="#10b981" opacity="0.12" />
        <rect x="20" y="12" width="24" height="38" rx="8" fill="#10b981" />
        {/* Bottle cap */}
        <rect x="26" y="6" width="12" height="6" rx="2" fill="#065f46" />
        {/* Face */}
        <circle cx="30" cy="28" r="2.2" fill="#064e3b" />
        <circle cx="38" cy="28" r="2.2" fill="#064e3b" />
        <path d="M27 34c2.3 2.2 7.7 2.2 10 0" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
        {/* Sparkles */}
        <path d="M49 16l2 2-2 2-2-2 2-2Z" fill="#34d399" />
        <path d="M14 20l1.6 1.6L14 23.2 12.4 21.6 14 20Z" fill="#a7f3d0" />
      </svg>
      <span className="font-semibold tracking-tight">statiestatus.nl</span>
    </div>
  );
}
