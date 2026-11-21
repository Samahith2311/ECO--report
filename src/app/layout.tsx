import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Public_Sans } from "next/font/google";
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

const navLinks = [
  { href: "/report", label: "Report" },
  { href: "/track", label: "Track" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${publicSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* z-[1100] keeps the header above Leaflet maps (their panes go up to z-index 1000) */}
        <header className="sticky top-0 z-[1100] border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-brand-800">
              {/* simple leaf icon */}
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 18C6 10 11 5 19 5c0 8-5 13-13 13Z" />
                <path d="M6 18 14 10" />
              </svg>
              EcoReport
            </Link>
            <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium sm:gap-2">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-md px-2.5 py-1.5 text-ink hover:bg-brand-50 hover:text-brand-700">
                  {l.label}
                </Link>
              ))}
              <Link href="/admin" className="rounded-md border border-line px-2.5 py-1.5 text-muted hover:border-brand-600 hover:text-brand-700">
                Admin
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-line py-6 text-center text-sm text-muted">
          EcoReport is a prototype built for an Environmental Studies course project.
        </footer>
      </body>
    </html>
  );
}
