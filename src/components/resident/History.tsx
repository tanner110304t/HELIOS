"use client";

import Link from "next/link";
import { useState } from "react";
import { clearHistory, useResident } from "@/lib/demo/client";
import { bestSetText, historyForEquipment } from "@/lib/demo/resident";
import { buttonClass } from "@/components/ui/Button";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

/** Past sessions with logged sets — stored only in this browser. */
export function HistoryList({ facilityId, facilitySlug }: { facilityId: string; facilitySlug: string }) {
  const { state, hydrated } = useResident(facilityId);
  const [confirm, setConfirm] = useState(false);
  if (!hydrated) return <div className="mt-6 h-32 animate-pulse rounded-2xl bg-paper-2" aria-busy="true" />;

  if (state.history.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line">
        <p className="text-[15px] font-semibold">Nothing logged yet</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Tap <span className="font-medium text-ink-3">Log weights</span> on any exercise in a workout. Next time, Helios
          shows what you used last time on that machine.
        </p>
        <Link href={`/g/${facilitySlug}`} className={buttonClass("primary", "md", "mt-4")}>
          Build a workout
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-6 space-y-3">
        {state.history.map((h) => (
          <li key={h.planId} className="rounded-2xl bg-surface ring-1 ring-inset ring-line shadow-card">
            <div className="flex items-baseline justify-between gap-3 px-4 pt-3.5">
              <p className="text-[15px] font-semibold">{h.title}</p>
              <p className="shrink-0 text-xs text-muted">{h.at ? date(h.at) : ""}</p>
            </div>
            <p className="px-4 text-xs text-muted">{h.completed ? "Completed" : "Not finished"}</p>
            <ul className="mt-2 divide-y divide-line border-t border-line">
              {h.exercises.map((e) => (
                <li key={e.exerciseId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                  <span className="min-w-0">
                    <span className="block font-medium">{e.name}</span>
                    <span className="block truncate text-xs text-muted">{e.equipmentName}</span>
                  </span>
                  <span className="shrink-0 text-right tabular">
                    <span className="block font-medium">{bestSetText(e.sets) ?? "—"}</span>
                    <span className="block text-xs text-muted">
                      {e.sets.length} set{e.sets.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-center">
        {confirm ? (
          <p className="text-sm">
            Delete all history on this device?{" "}
            <button
              type="button"
              className="font-medium text-down underline"
              onClick={() => {
                clearHistory(facilityId);
                setConfirm(false);
              }}
            >
              Delete
            </button>{" "}
            ·{" "}
            <button type="button" className="font-medium text-muted underline" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </p>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="text-sm font-medium text-muted hover:text-ink">
            Clear my history
          </button>
        )}
      </div>
    </>
  );
}

/** On a machine page: what this device has logged on this machine. */
export function MachineHistory({ facilityId, equipmentId }: { facilityId: string; equipmentId: string }) {
  const { state, hydrated } = useResident(facilityId);
  if (!hydrated) return null;
  const rows = historyForEquipment(state, equipmentId).slice(0, 5);
  if (rows.length === 0) return null;
  return (
    <section className="mt-6" aria-labelledby="my-history">
      <h2 id="my-history" className="eyebrow mb-2.5">
        Your history on this machine
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface ring-1 ring-inset ring-line">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
            <span>
              <span className="block font-medium">{r.name}</span>
              <span className="block text-xs text-muted">{r.at ? date(r.at) : ""}</span>
            </span>
            <span className="tabular font-medium">{bestSetText(r.sets) ?? "—"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-muted">Saved on this device only.</p>
    </section>
  );
}
