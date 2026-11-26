import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/components/shell/theme";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

/**
 * Manrope has no Kazakh letters (Ә Ғ Қ Ң Ұ), so Onest — a Cyrillic-first face with the full
 * Kazakh alphabet — supplies them in light text and sets all bold (600+) text.
 */
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: "Әдет трекер",
  description: "Күнделікті әдеттер: намаз, зікір, Құран, денсаулық, ораза",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme may be changed by the init script before hydration.
    <html lang="kk" data-theme="dark" className={`${manrope.variable} ${onest.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
