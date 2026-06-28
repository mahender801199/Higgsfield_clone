// Lumora — original brand mark. An abstract aperture/spark glyph in the
// brand gradient. No resemblance to any existing product's logo.

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lumora-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#16b4a6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path
        d="M24 3c11.6 0 21 9.4 21 21s-9.4 21-21 21S3 35.6 3 24 12.4 3 24 3Zm0 7c-7.7 0-14 6.3-14 14s6.3 14 14 14 14-6.3 14-14-6.3-14-14-14Z"
        fill="url(#lumora-grad)"
        opacity="0.4"
      />
      <path
        d="M24 12c6.6 0 12 5.4 12 12 0 1.6-.3 3.1-.9 4.5L24 24V12Z"
        fill="url(#lumora-grad)"
      />
      <circle cx="24" cy="24" r="4.5" fill="url(#lumora-grad)" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-7 w-7" />
      <span className="text-lg font-semibold tracking-tight text-white">
        Lumora
      </span>
    </span>
  );
}
