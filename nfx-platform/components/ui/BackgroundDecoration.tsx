export function BackgroundDecoration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-0 right-0 z-0 select-none overflow-hidden"
      style={{ width: 520, height: 520 }}
    >
      <svg
        viewBox="0 0 520 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          {/* Corner radial glow — neon green, very shallow */}
          <radialGradient id="cornerGlow" cx="100%" cy="100%" r="70%" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#39FF14" stopOpacity="0.055" />
            <stop offset="55%"  stopColor="#00d2ff" stopOpacity="0.018" />
            <stop offset="100%" stopColor="#050505" stopOpacity="0" />
          </radialGradient>

          {/* Stroke gradient for arcs — fades out toward center */}
          <linearGradient id="arcFade" x1="520" y1="520" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#39FF14" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="arcFade2" x1="520" y1="520" x2="160" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#00d2ff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="lineFade" x1="520" y1="520" x2="300" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#ffffff"  stopOpacity="0.07" />
            <stop offset="100%" stopColor="#ffffff"  stopOpacity="0" />
          </linearGradient>

          {/* Glow filter for accent dots */}
          <filter id="dotGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient corner gradient fill */}
        <rect width="520" height="520" fill="url(#cornerGlow)" />

        {/* ── Concentric arcs from bottom-right corner ──────────── */}
        {/* Largest arc — neon green */}
        <path
          d="M 520 260 A 260 260 0 0 1 260 520"
          stroke="url(#arcFade)"
          strokeWidth="0.75"
          fill="none"
        />
        {/* Second arc */}
        <path
          d="M 520 340 A 180 180 0 0 1 340 520"
          stroke="url(#arcFade)"
          strokeWidth="0.75"
          fill="none"
          opacity="0.7"
        />
        {/* Third arc — blue */}
        <path
          d="M 520 400 A 120 120 0 0 1 400 520"
          stroke="url(#arcFade2)"
          strokeWidth="0.75"
          fill="none"
        />
        {/* Tight inner arc */}
        <path
          d="M 520 450 A 70 70 0 0 1 450 520"
          stroke="url(#arcFade2)"
          strokeWidth="1"
          fill="none"
          opacity="0.8"
        />
        {/* Nearest arc */}
        <path
          d="M 520 490 A 30 30 0 0 1 490 520"
          stroke="url(#arcFade)"
          strokeWidth="1.2"
          fill="none"
          opacity="0.9"
        />

        {/* ── Diagonal grid lines ────────────────────────────────── */}
        <line x1="520" y1="200" x2="320" y2="520" stroke="url(#lineFade)" strokeWidth="0.5" />
        <line x1="520" y1="310" x2="430" y2="520" stroke="url(#lineFade)" strokeWidth="0.5" />
        <line x1="380" y1="520" x2="520" y2="380" stroke="url(#lineFade)" strokeWidth="0.5" />

        {/* ── Abstract polygon fragments ─────────────────────────── */}
        {/* Hexagon outline — partially clipped in bottom-right */}
        <polygon
          points="470,520 520,490 520,430 470,400 420,430 420,490"
          stroke="#39FF14"
          strokeWidth="0.6"
          fill="none"
          opacity="0.12"
        />
        {/* Smaller rotated square */}
        <rect
          x="448" y="448"
          width="48" height="48"
          rx="4"
          transform="rotate(15 472 472)"
          stroke="#00d2ff"
          strokeWidth="0.6"
          fill="none"
          opacity="0.15"
        />

        {/* ── Accent dots with glow ──────────────────────────────── */}
        {/* Green node at arc intersection */}
        <circle cx="500" cy="500" r="2.5" fill="#39FF14" opacity="0.55" filter="url(#dotGlow)" />
        <circle cx="448" cy="520" r="1.8" fill="#39FF14" opacity="0.35" filter="url(#dotGlow)" />
        <circle cx="520" cy="448" r="1.8" fill="#39FF14" opacity="0.35" filter="url(#dotGlow)" />

        {/* Blue node */}
        <circle cx="480" cy="480" r="2"   fill="#00d2ff" opacity="0.45" filter="url(#dotGlow)" />
        <circle cx="460" cy="510" r="1.5" fill="#00d2ff" opacity="0.25" filter="url(#dotGlow)" />
        <circle cx="510" cy="460" r="1.5" fill="#00d2ff" opacity="0.25" filter="url(#dotGlow)" />

        {/* Soft larger glow behind the corner cluster */}
        <circle cx="510" cy="510" r="18" fill="#39FF14" opacity="0.04" filter="url(#softGlow)" />
      </svg>
    </div>
  )
}
