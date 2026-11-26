"use client";

import { useEffect } from "react";
import { applyTheme, type Theme } from "./theme";

/** The profile's saved theme wins over this device's cache, so a change on another device carries over. */
export function ThemeSync({ theme }: { theme: Theme }) {
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}
