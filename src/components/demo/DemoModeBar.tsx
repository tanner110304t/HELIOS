"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { resetDemo } from "@/lib/demo/client";

/**
 * Presenter-only navigation. Never part of the resident product:
 * - on presenter pages (/, /demo/...) it is a slim bar across the top
 * - on resident pages (/g/...) a small floating control appears only in a
 *   browser that has opened a presenter page this session (the presenter's
 *   laptop), never on a phone that just scanned the QR, and never inside the
 *   phone frame on /demo/resident
 */

const PRESENTER_KEY = "helios-presenter";

function markPresenter() {
  try {
    window.sessionStorage.setItem(PRESENTER_KEY, "1");
  } catch {
    // ignore
  }
}

function isPresenterBrowser() {
  try {
    return window.self === window.top && window.sessionStorage.getItem(PRESENTER_KEY) === "1";
  } catch {
    return false;
  }
}

const steps: { title: string; body: string; href: string }[] = [
  { title: "Resident starts", body: "In the phone frame, tap Help me get started.", href: "/demo/resident" },
  {
    title: "Resident gets help",
    body: "Open a machine and come back — the place is kept. Tap “[machine] is busy” and pick an alternative.",
    href: "/demo/resident",
  },
  {
    title: "Resident reports & gives feedback",
    body: "Report a problem on a machine. Finish the plan and answer “Did this plan help?”.",
    href: "/demo/resident",
  },
  {
    title: "Operator acts",
    body: "Show This demo session updating. Acknowledge the new report with an update; take the machine out of service.",
    href: "/demo/operator",
  },
  {
    title: "Resident sees the result",
    body: "Open that machine in the phone frame: status and update show. Then resolve it and return it to service.",
    href: "/demo/resident",
  },
  {
    title: "Dealer & pilot close",
    body: "Walk the install-list mapping, copy a service brief, tick through the pilot checklist.",
    href: "/demo/dealer",
  },
];

/** A short presenter checklist for the ~5-minute walkthrough. Ticks last for this browser tab only. */
function GuideMenu() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="demo-guide"
        onClick={() => setOpen((v) => !v)}
        className="whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] text-paper/80 ring-1 ring-inset ring-paper/20 hover:bg-paper/10"
      >
        Guide
      </button>
      {open && (
        <div
          id="demo-guide"
          className="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl bg-ink p-4 text-paper shadow-lift ring-1 ring-paper/10"
        >
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">5-minute walkthrough</p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-paper/60 hover:text-paper">
              Close
            </button>
          </div>
          <p className="mt-0.5 text-xs text-paper/60">Press Reset demo first so every meeting starts the same way.</p>
          <ol className="mt-3 space-y-2.5">
            {steps.map((st, i) => {
              const on = done.includes(i);
              return (
                <li key={st.title} className="flex gap-2.5">
                  <input
                    type="checkbox"
                    checked={on}
                    aria-label={`Step ${i + 1} done`}
                    onChange={() => setDone(on ? done.filter((d) => d !== i) : [...done, i])}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-sun-glow)]"
                  />
                  <div className={cn("min-w-0", on && "opacity-50")}>
                    <Link href={st.href} onClick={() => setOpen(false)} className="text-[13px] font-semibold hover:underline">
                      {i + 1}. {st.title}
                    </Link>
                    <p className="text-xs leading-relaxed text-paper/70">{st.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 border-t border-paper/10 pt-2.5 text-[11px] leading-relaxed text-paper/55">
            Phones that scan the QR keep their own separate data. Use the phone frame on this laptop for the connected
            resident → operator story.
          </p>
        </div>
      )}
    </div>
  );
}

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

/** Clears every report, resolution and other demo state saved in this browser. */
function ResetDemoButton({ className }: { className?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(t);
  }, [state]);
  return (
    <button
      type="button"
      onClick={() => setState(resetDemo() ? "done" : "failed")}
      className={cn(
        "whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] ring-1 ring-inset ring-paper/20 transition-colors hover:bg-paper/10",
        state === "done" ? "text-sun-glow" : "text-paper/80",
        className,
      )}
      aria-live="polite"
    >
      {state === "done" ? "Demo reset ✓" : state === "failed" ? "Reset failed" : "Reset demo"}
    </button>
  );
}

export function DemoModeBar() {
  const pathname = usePathname() ?? "/";
  useEffect(markPresenter, []);
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
        <GuideMenu />
        <ResetDemoButton className="shrink-0" />
      </div>
    </nav>
  );
}

export function DemoFloatingControl() {
  const pathname = usePathname() ?? "/";
  const presenter = useSyncExternalStore(
    () => () => {},
    isPresenterBrowser,
    () => false,
  );
  if (!presenter) return null;
  return (
    <details className="group fixed bottom-5 right-5 z-50 print:hidden">
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
        <div className="mt-1 border-t border-paper/10 px-1 pt-1.5">
          <ResetDemoButton className="w-full text-left ring-0" />
        </div>
      </nav>
    </details>
  );
}
