export type Theme = "dark" | "light";

/** localStorage key read by the no-flash script in the root layout. */
export const THEME_KEY = "adet-theme";

/** Runs in <head> before paint so the stored theme applies without a flash. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode: the theme still applies for this page view.
  }
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
