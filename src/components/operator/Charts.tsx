"use client";

import { useState } from "react";
import type { WeeklyEngagement } from "@/data/demoAnalytics";

/**
 * Deliberately small charts (no chart library).
 * Series colors are a validated CVD-safe pair; identity is also carried by
 * the legend, and every value is available on hover/focus and in a table.
 */

export function EngagementChart({ weeks }: { weeks: WeeklyEngagement[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...weeks.map((w) => w.workoutsGenerated));
  const top = Math.ceil(max / 20) * 20;
  const ticks = [0, top / 2, top];

  return (
    <figure className="mt-4">
      <div className="flex items-center gap-4 text-xs text-ink-3" aria-hidden>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-series-1" /> Generated
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-series-2" /> Completed
        </span>
      </div>

      <div className="relative mt-6 h-52" aria-hidden>
        {/* gridlines */}
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `${(t / top) * 100}%` }}
          >
            <span className="tabular w-6 -translate-y-px text-right text-[10px] text-faint">{t}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        ))}
        <div className="absolute inset-y-0 left-8 right-0 grid grid-cols-4 gap-3">
          {weeks.map((w, i) => (
            <div
              key={w.label}
              className="relative flex items-end justify-center gap-[2px]"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {active === i && <div className="absolute inset-x-0 -bottom-1 top-0 rounded-lg bg-paper-2/70" />}
              <div
                className="relative w-[34%] max-w-7 rounded-t-[4px] bg-series-1"
                style={{ height: `${(w.workoutsGenerated / top) * 100}%` }}
              />
              <div
                className="relative w-[34%] max-w-7 rounded-t-[4px] bg-series-2"
                style={{ height: `${(w.workoutsCompleted / top) * 100}%` }}
              />
              {active === i && (
                <div className="absolute bottom-full left-1/2 z-10 mb-2 w-36 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-[11px] text-paper shadow-lift">
                  <p className="font-medium">Week of {w.label}</p>
                  <p className="tabular mt-1 flex justify-between"><span className="text-paper/70">Generated</span>{w.workoutsGenerated}</p>
                  <p className="tabular flex justify-between"><span className="text-paper/70">Completed</span>{w.workoutsCompleted}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="ml-8 mt-2 grid grid-cols-4 gap-3 text-center text-[11px] text-muted" aria-hidden>
        {weeks.map((w) => (
          <span key={w.label}>{w.label}</span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Helios workouts per week (demo data)</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Generated</th>
            <th scope="col">Completed</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.label}>
              <th scope="row">{w.label}</th>
              <td>{w.workoutsGenerated}</td>
              <td>{w.workoutsCompleted}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="mt-3 text-xs text-muted">
        Completion means the resident checked off every exercise in Helios.
      </figcaption>
    </figure>
  );
}

export function ShareBars({ rows }: { rows: { label: string; share: number }[] }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-[13px]">
            <span className="text-ink-3">{r.label}</span>
            <span className="tabular font-medium">{r.share}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
            <div className="h-full rounded-full bg-series-1" style={{ width: `${r.share}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
