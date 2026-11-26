"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { saveTheme } from "@/app/(app)/actions";
import { NAV_ITEMS, isActive } from "./nav-items";
import { applyTheme, currentTheme } from "./theme";
import { QuickEntry } from "./quick-entry";

/**
 * Canvas v2 shell: sidebar (brand, nav, profile) beside the main panel.
 * At ≤1024px the sidebar collapses to its header row and the nav opens as a drawer.
 */
export function AppShell({
  profile,
  badges,
  children,
}: {
  profile: React.ReactNode;
  /** Small counters next to nav items, keyed by href (e.g. remaining qaza on /namaz). */
  badges?: Partial<Record<string, React.ReactNode>>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    burgerRef.current?.focus();
  }, []);

  // A navigation closes the drawer.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    navRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    void saveTheme(next);
  }

  return (
    <div className="shell">
      <aside className={open ? "side open" : "side"} aria-label="Бүйір панель">
        <div className="side-head">
          <button
            ref={burgerRef}
            type="button"
            className="icon-btn burger"
            onClick={() => (open ? close() : setOpen(true))}
            aria-label={open ? "Мәзірді жабу" : "Мәзірді ашу"}
            aria-expanded={open}
            aria-controls="side-nav"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
          <Logo />
          <div className="flex min-w-0 flex-col">
            <span className="whitespace-nowrap text-lg font-bold">Әдет трекер</span>
            <span className="truncate text-[13px] text-[var(--t-text)]">Күнделікті әдеттер</span>
          </div>
          <span className="ml-auto" />
          <QuickEntry variant="head" />
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Ақшыл / қараңғы режим"
            title="Ақшыл / қараңғы режим"
          >
            {/* Both icons render; CSS shows the one for the current theme (no hydration mismatch). */}
            <svg className="theme-icon-dark" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg className="theme-icon-light" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          </button>
        </div>

        <nav id="side-nav" ref={navRef} className="side-nav" aria-label="Негізгі мәзір">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link key={item.href} href={item.href} className="nav-link" aria-current={active ? "page" : undefined}>
                {item.icon}
                <span className="flex-grow">{item.label}</span>
                {badges?.[item.href]}
              </Link>
            );
          })}
        </nav>

        <div className="side-prof">{profile}</div>
      </aside>

      {open && <button type="button" className="scrim" onClick={close} aria-label="Мәзірді жабу" tabIndex={-1} />}

      <main className="main">{children}</main>
      <QuickEntry variant="fab" />
    </div>
  );
}
