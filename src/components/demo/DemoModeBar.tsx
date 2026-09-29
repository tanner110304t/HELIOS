"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Presenter-only navigation. Never part of the resident product:
 * - on /demo pages it is a slim bar across the top
 * - on resident pages (/g/...) it is a small floating control shown only on
 *   laptop-width screens, so a phone that scanned the QR never sees it
 */

const links = [
  { href: "/", label: "Overview", match: (p: string) => p === "/" },
  { href: "/demo/resident", label: "Resident", match: (p: string) => p.startsWith("/demo/resident") },
  { href: "/demo/operator", label: "Operator", match: (p: string) => p.startsWith("/demo/operator") },
  { href: "/demo/dealer", label: "Dealer", match: (p: string) => p.startsWith("/demo/dealer") },
  {
    href: "/g/solstice-lofts/equipment",
    label: "Equipment",
    match: (p: string) => p.startsWith("/g/solstice-lofts/equipment"),
  },
];

function DemoLabel() {
  return (
    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/70">
      <span className="relative flex size-2">
        <span className="absolute inset-0 rounded-full bg-sun-glow/60 motion-safe:animate-ping" />
        <span className="relative size-2 rounded-full bg-sun-glow" />
      </span>
      Demo Mode
    </span>
  );
}

export function DemoModeBar() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Demo navigation" className="sticky top-0 z-40 bg-ink text-paper print:hidden">
      <div className="mx-auto flex h-10 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <DemoLabel />
        <ul className="-mr-4 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pr-4 [scrollbar-width:none] sm:justify-end">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] transition-colors",
                    active ? "bg-paper/12 text-paper" : "text-paper/65 hover:text-paper",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export function DemoFloatingControl() {
  const pathname = usePathname() ?? "/";
  return (
    <details className="group fixed bottom-5 right-5 z-50 hidden md:block print:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-ink px-4 py-2.5 shadow-lift [&::-webkit-details-marker]:hidden">
        <DemoLabel />
      </summary>
      <nav
        aria-label="Demo navigation"
        className="absolute bottom-full right-0 mb-2 w-52 rounded-xl bg-ink p-1.5 shadow-lift"
      >
        <p className="px-2.5 pb-1 pt-1.5 text-[11px] leading-snug text-paper/55">
          Presenter controls — residents don&apos;t see this.
        </p>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={l.match(pathname) ? "page" : undefined}
            className={cn(
              "block rounded-lg px-2.5 py-2 text-sm",
              l.match(pathname) ? "bg-paper/12 text-paper" : "text-paper/75 hover:bg-paper/8 hover:text-paper",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
