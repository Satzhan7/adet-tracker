import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/components/shell/theme";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: "Әдет трекер",
  description: "Күнделікті әдеттер: намаз, зікір, Құран, денсаулық, ораза",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme may be changed by the init script before hydration.
    <html lang="kk" data-theme="dark" className={`${manrope.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
