/** Main navigation, in canvas v2 order. Icons are the canvas strokes (24px, 1.5 stroke). */
export type NavItem = { href: string; label: string; icon: React.ReactNode };

const svg = (children: React.ReactNode) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0"
  >
    {children}
  </svg>
);

const BEADS: [number, number][] = [
  [8.2, 14.8], [5.8, 11.5], [5.8, 7.5], [8.2, 4.2], [12, 3],
  [15.8, 4.2], [18.2, 7.5], [18.2, 11.5], [15.8, 14.8],
];

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Басты бет", icon: svg(<><path d="M3 12 12 4l9 8" /><path d="M5 10v10h14V10" /></>) },
  {
    href: "/month",
    label: "Ай кестесі",
    icon: svg(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v11M15 10v11" /></>),
  },
  { href: "/namaz", label: "Намаз", icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>) },
  {
    href: "/zikir",
    label: "Зікір",
    icon: svg(
      <>
        {BEADS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.3" />
        ))}
        <circle cx="12" cy="16.6" r="1.6" />
        <path d="M12 18.2v2.3M10.3 22.5l1.7-2 1.7 2" />
      </>,
    ),
  },
  {
    href: "/quran",
    label: "Құран",
    icon: svg(
      <>
        <path d="M2 5.5c3.5-1.5 7-1.2 10 1.2v13.5c-3-2.4-6.5-2.7-10-1.2z" />
        <path d="M22 5.5c-3.5-1.5-7-1.2-10 1.2v13.5c3-2.4 6.5-2.7 10-1.2z" />
      </>,
    ),
  },
  { href: "/health", label: "Денсаулық", icon: svg(<path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12" />) },
  {
    href: "/oraza",
    label: "Ораза",
    icon: svg(
      <>
        <path d="M13.5 3.5a8.5 8.5 0 1 0 7 13.2A7 7 0 0 1 13.5 3.5z" />
        <path d="M18.5 6.5l.6 1.4 1.5.1-1.2 1 .4 1.5-1.3-.8-1.3.8.4-1.5-1.2-1 1.5-.1z" />
      </>,
    ),
  },
  { href: "/reports", label: "Есептер", icon: svg(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />) },
];

export function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
