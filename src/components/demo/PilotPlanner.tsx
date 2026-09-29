"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { CopyText } from "./CopyText";

/**
 * A proposed one-property pilot, as a checklist the presenter can tick,
 * copy or print during the meeting. Nothing is submitted anywhere.
 */
const groups: { title: string; items: string[] }[] = [
  {
    title: "Scope",
    items: [
      "One property, one fitness room, one verified equipment list",
      "A proposed 30-day evaluation window (to be agreed)",
    ],
  },
  {
    title: "Inputs",
    items: [
      "Equipment list from the dealer (models confirmed where relevant)",
      "A property point of contact",
      "Where the QR signs go in the room",
      "Who handles equipment reports, and whether existing service arrangements apply",
    ],
  },
  {
    title: "Questions the pilot answers",
    items: [
      "Can residents get started without help?",
      "Do they find the plans useful (optional feedback, with counts)?",
      "Do they come back on other days?",
      "Can the property team act on equipment reports?",
    ],
  },
  {
    title: "Baseline to capture first",
    items: [
      "How residents report equipment problems today",
      "Roughly how much staff time that takes, where known",
    ],
  },
  {
    title: "Needed before a real pilot",
    items: [
      "Shared storage so reports from residents' phones reach the property team",
      "Sign-in for the property team's dashboard",
    ],
  },
];

export function PilotPlanner({ propertyName }: { propertyName: string }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const text = [
    `Helios one-property pilot — proposed checklist (${propertyName})`,
    ...groups.flatMap((g) => ["", g.title.toUpperCase(), ...g.items.map((i) => `[${checked.has(i) ? "x" : " "}] ${i}`)]),
    "",
    "Proposed, not an agreement. No reduced-complaint or time-saving claims without a comparable baseline.",
  ].join("\n");

  return (
    <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card print:shadow-none">
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
        {groups.map((g) => (
          <fieldset key={g.title}>
            <legend className="text-sm font-semibold">{g.title}</legend>
            <ul className="mt-2 space-y-1.5">
              {g.items.map((item) => {
                const on = checked.has(item);
                return (
                  <li key={item}>
                    <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => {
                          const next = new Set(checked);
                          if (on) next.delete(item);
                          else next.add(item);
                          setChecked(next);
                        }}
                        className="mt-1 size-4 shrink-0 accent-[var(--color-sun)]"
                      />
                      <span className={cn(on && "text-muted line-through")}>{item}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>
      <p className="mt-5 rounded-xl bg-paper-2 px-3.5 py-2.5 text-xs leading-relaxed text-ink-3">
        A proposed pilot workflow, not an agreement. Helios captures and organises equipment problems; it doesn&apos;t repair
        equipment or change anyone&apos;s service obligations. Any reduction in complaints or staff time needs a baseline to
        compare against.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <CopyText text={text} label="Copy checklist" className="h-10 px-4 text-sm ring-1 ring-inset ring-line" />
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </div>
  );
}
