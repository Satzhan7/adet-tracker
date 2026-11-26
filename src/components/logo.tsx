/** Brand mark from canvas v2 (orange tile, ring and check). */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Әдет трекер логотипі" className="shrink-0">
      <defs>
        <linearGradient id="adet-logo-g" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff630e" />
          <stop offset="1" stopColor="#ff4e0e" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#adet-logo-g)" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="3" />
      <path d="M20 9a11 11 0 1 1-10.4 14.6" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M15 20.5l3.5 3.5 6.5-7" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
