"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icons";

const links = [
  { href: "/report", label: "Report" },
  { href: "/track", label: "Track" },
  { href: "/dashboard", label: "Dashboard" },
];

// Client component only because it reads the current URL to mark the active link
// (aria-current="page" tells screen readers which page you are on).
export default function SiteNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1">
      {links.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-control px-2.5 text-sm font-semibold transition-colors duration-150 sm:px-3 ${
              active ? "bg-brand-100 text-brand-800" : "text-ink hover:bg-brand-50 hover:text-brand-800"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
      {/* Staff entry point: deliberately quiet, and only in the footer on small screens */}
      <Link
        href="/admin"
        aria-current={isActive("/admin") ? "page" : undefined}
        className="ml-2 hidden min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-muted transition-colors duration-150 hover:bg-brand-50 hover:text-brand-800 aria-[current=page]:text-brand-800 sm:inline-flex"
      >
        <Icon name="lock" className="h-4 w-4" />
        Admin
      </Link>
    </nav>
  );
}
