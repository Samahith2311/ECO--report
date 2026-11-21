import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Public_Sans } from "next/font/google";
import SiteNav from "@/components/site-nav";
import { Icon } from "@/components/ui/icons";
import "./globals.css";

// Two Google fonts loaded by Next.js: a readable sans for UI, a serif for headings.
const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "EcoReport - report environmental complaints",
    template: "%s | EcoReport",
  },
  description:
    "Report environmental complaints in Mysuru and track how the authorities respond.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${publicSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Skip link: first thing a keyboard user reaches, hidden until focused */}
        <a
          href="#main"
          className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[1200] focus:px-5"
        >
          Skip to main content
        </a>

        {/* z-[1100] keeps the header above Leaflet maps (their panes go up to z-index 1000) */}
        <header className="sticky top-0 z-[1100] border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
            <Link
              href="/"
              aria-label="EcoReport home"
              className="flex min-h-11 items-center gap-2 rounded-control font-display text-lg font-semibold text-brand-800 sm:text-xl"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
                <Icon name="leaf" className="h-5 w-5" />
              </span>
              {/* on very narrow phones only the logo mark shows, so the nav still fits on one row */}
              <span className="max-[379px]:sr-only">EcoReport</span>
            </Link>
            <SiteNav />
          </div>
        </header>

        {/* tabIndex lets the skip link move keyboard focus here */}
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
            <p>EcoReport is a prototype built for an Environmental Studies course project in Mysuru.</p>
            <nav aria-label="Footer" className="-mx-3 flex shrink-0 flex-wrap">
              <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-control px-3 hover:text-brand-800">
                Public dashboard
              </Link>
              <Link href="/admin" className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 hover:text-brand-800">
                <Icon name="lock" className="h-4 w-4" />
                Admin login
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
