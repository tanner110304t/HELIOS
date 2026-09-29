"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ExerciseOption, Workout, WorkoutItem } from "@/lib/workout/generateWorkout";
import { goalLabels, levelLabels } from "@/lib/workout/templates";
import type { Equipment } from "@/types/domain";
import { buttonClass } from "@/components/ui/Button";
import { IconCheck, IconClock, IconSwap } from "@/components/ui/icons";
import { EquipmentTile } from "./EquipmentGlyph";

function equipmentLabel(equipment: Equipment[]) {
  // Interchangeable units (two treadmills) read as one choice.
  const names = equipment.map((e) => e.name);
  const treadmills = names.filter((n) => n.startsWith("Treadmill"));
  if (treadmills.length > 1) {
    return [...names.filter((n) => !n.startsWith("Treadmill")), "Treadmill #1 or #2"].join(" + ");
  }
  return names.join(" + ");
}

function prescription(item: WorkoutItem) {
  if (item.kind === "cardio") return `${item.minutes} min`;
  return `${item.sets} sets × ${item.reps} reps`;
}

export function WorkoutView({
  workout,
  facilityName,
  facilitySlug,
  totalEquipment,
}: {
  workout: Workout;
  facilityName: string;
  facilitySlug: string;
  totalEquipment: number;
}) {
  const [items, setItems] = useState<WorkoutItem[]>(workout.items);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [openSwap, setOpenSwap] = useState<number | null>(null);

  const steps = [...(workout.warmup ? ["warmup"] : []), ...items.map((_, i) => `item-${i}`)];
  const completed = steps.filter((s) => done.has(s)).length;
  const allDone = completed === steps.length;
  const { goal, level, duration } = workout.request;

  const toggle = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const swap = (index: number, choice: ExerciseOption) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i !== index
          ? item
          : {
              ...item,
              exercise: choice.exercise,
              equipment: choice.equipment,
              alternatives: [
                ...item.alternatives.filter((a) => a.exercise.id !== choice.exercise.id),
                { exercise: item.exercise, equipment: item.equipment },
              ],
            },
      ),
    );
    setOpenSwap(null);
  };

  const usedEquipment = [
    ...new Map(
      [...(workout.warmup?.equipment ?? []), ...items.flatMap((i) => i.equipment)].map((e) => [e.id, e]),
    ).values(),
  ];

  return (
    <div className="pt-2">
      <p className="eyebrow">Your workout</p>
      <h1 className="mt-1.5 text-[26px] font-semibold leading-[1.15] tracking-[-0.025em]">
        {duration}-minute {goalLabels[goal]}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {levelLabels[level]} · {items.length} exercises{workout.warmup ? " + warm-up" : ""}
      </p>

      {/* The point of the demo: the workout knows what is in this room. */}
      <section
        aria-label="Built for this room"
        className="mt-5 rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line shadow-card"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sun-soft text-sun-ink">
            <IconCheck className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Built for this room</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
              Uses only the {workout.availableEquipmentCount} available pieces at {facilityName}.
              {workout.excludedEquipment.length > 0 && (
                <>
                  {" "}
                  <span className="text-ink-3">
                    {workout.excludedEquipment.map((e) => e.name).join(", ")}{" "}
                    {workout.excludedEquipment.length === 1 ? "is" : "are"} temporarily unavailable, so{" "}
                    {workout.excludedEquipment.length === 1 ? "it's" : "they're"} left out.
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Equipment this workout uses">
          {usedEquipment.map((e) => (
            <li key={e.id}>
              <Link
                href={`/g/${facilitySlug}/equipment/${e.slug}`}
                className="inline-flex items-center rounded-full bg-paper-2 px-2.5 py-1 text-xs text-ink-3 ring-1 ring-inset ring-line hover:ring-line-strong"
              >
                {e.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-faint">
          {usedEquipment.length} of {totalEquipment} mapped pieces in today&apos;s plan
        </p>
      </section>

      {/* Progress */}
      <div className="mt-6 flex items-center gap-3" aria-live="polite">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2">
          <div
            className="h-full rounded-full bg-sun transition-[width] duration-500"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>
        <span className="tabular text-xs text-muted">
          {completed} of {steps.length} done
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {workout.warmup && (
          <li>
            <ExerciseCard
              label="Warm-up"
              item={workout.warmup}
              facilitySlug={facilitySlug}
              done={done.has("warmup")}
              onToggle={() => toggle("warmup")}
            />
          </li>
        )}
        {items.map((item, i) => (
          <li key={`slot-${i}`}>
            <ExerciseCard
              label={String(i + 1).padStart(2, "0")}
              item={item}
              facilitySlug={facilitySlug}
              done={done.has(`item-${i}`)}
              onToggle={() => toggle(`item-${i}`)}
              swapOpen={openSwap === i}
              onSwapToggle={() => setOpenSwap(openSwap === i ? null : i)}
              onSwap={(choice) => swap(i, choice)}
            />
          </li>
        ))}
      </ol>

      {allDone ? (
        <section className="mt-6 rounded-2xl bg-ink p-5 text-paper" aria-live="polite">
          <p className="text-lg font-semibold">Workout complete</p>
          <p className="mt-1 text-sm text-paper/70">Nice work. Same room, new plan any time you scan.</p>
          <div className="mt-4 flex gap-2">
            <Link href={`/g/${facilitySlug}`} className={buttonClass("sun", "md", "flex-1")}>
              Build another
            </Link>
            <Link
              href={`/g/${facilitySlug}/equipment`}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-medium text-paper ring-1 ring-inset ring-paper/30 hover:bg-paper/10"
            >
              Equipment
            </Link>
          </div>
        </section>
      ) : (
        <p className="mt-6 text-center text-xs text-muted">Check off each exercise as you go.</p>
      )}
    </div>
  );
}

function ExerciseCard({
  label,
  item,
  facilitySlug,
  done,
  onToggle,
  swapOpen,
  onSwapToggle,
  onSwap,
}: {
  label: string;
  item: WorkoutItem;
  facilitySlug: string;
  done: boolean;
  onToggle: () => void;
  swapOpen?: boolean;
  onSwapToggle?: () => void;
  onSwap?: (choice: ExerciseOption) => void;
}) {
  const primary = item.equipment[0];
  const panelId = `swap-${item.exercise.id}`;
  return (
    <article
      className={cn(
        "rounded-2xl bg-surface ring-1 ring-inset shadow-card transition",
        done ? "ring-ok/35" : "ring-line",
      )}
    >
      <div className="flex gap-3.5 p-4">
        <Link
          href={`/g/${facilitySlug}/equipment/${primary.slug}`}
          className="shrink-0"
          aria-label={`${primary.name} details`}
        >
          <EquipmentTile kind={primary.kind} className="size-14" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</p>
          <h2 className={cn("mt-0.5 text-[16px] font-semibold leading-snug", done && "text-muted line-through decoration-1")}>
            {item.exercise.name}
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-sun-ink">{equipmentLabel(item.equipment)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[13px]">
        <span className="tabular font-medium">{prescription(item)}</span>
        {item.rest && (
          <span className="inline-flex items-center gap-1 text-muted">
            <IconClock className="size-3.5" /> Rest {item.rest}
          </span>
        )}
      </div>
      <p className="px-4 pb-3 text-[13px] leading-relaxed text-ink-3">{item.exercise.instruction}</p>

      <div className="flex gap-2 px-3 pb-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          className={buttonClass(done ? "done" : "secondary", "md", "min-h-11 flex-1")}
        >
          <IconCheck className="size-4" />
          {done ? "Done" : "Mark done"}
        </button>
        {onSwapToggle && item.alternatives.length > 0 && (
          <button
            type="button"
            onClick={onSwapToggle}
            aria-expanded={swapOpen}
            aria-controls={panelId}
            className={buttonClass("ghost", "md", "min-h-11 ring-1 ring-inset ring-line")}
          >
            <IconSwap className="size-4" />
            Swap exercise
          </button>
        )}
      </div>

      {swapOpen && onSwap && (
        <div id={panelId} className="border-t border-line bg-paper/60 px-4 pb-4 pt-3 rounded-b-2xl">
          <p className="text-xs text-muted">Also possible with the equipment in this room:</p>
          <ul className="mt-2 space-y-2">
            {item.alternatives.map((alt) => (
              <li key={alt.exercise.id}>
                <button
                  type="button"
                  onClick={() => onSwap(alt)}
                  className="flex w-full items-center gap-3 rounded-xl bg-surface p-2.5 text-left ring-1 ring-inset ring-line hover:ring-line-strong"
                >
                  <EquipmentTile kind={alt.equipment[0].kind} className="size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{alt.exercise.name}</span>
                    <span className="block truncate text-xs text-muted">{equipmentLabel(alt.equipment)}</span>
                  </span>
                  <span className="text-xs font-medium text-sun-ink">Use this</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
