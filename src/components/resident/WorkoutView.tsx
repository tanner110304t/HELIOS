"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  bestSetText,
  isComplete,
  optionsFor,
  primaryEquipmentId,
  steps,
  type ActivePlan,
  type PlanItem,
  type SetLog,
} from "@/lib/demo/resident";
import { estimateMinutes, type ExerciseOption, type WorkoutItem } from "@/lib/workout/generateWorkout";
import { formatOf } from "@/lib/workout/timeModel";
import { focusLabels, goalLabels, levelLabels } from "@/lib/workout/templates";
import type { Equipment, Exercise } from "@/types/domain";
import { buttonClass } from "@/components/ui/Button";
import { IconCheck, IconClock, IconPin, IconSwap } from "@/components/ui/icons";
import { EquipmentTile } from "./EquipmentGlyph";

export type PlanActions = {
  toggleDone: (key: string) => void;
  swap: (slot: string, option: ExerciseOption) => void;
  setBusy: (equipmentId: string, busy: boolean) => void;
  skip: (slot: string) => void;
  moveToEnd: (slot: string) => void;
  logSet: (slot: string, index: number, patch: SetLog) => void;
};

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
  return `${item.sets} sets × ${item.reps}`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Names of the machines an exercise needs that are out of service (empty = fine). */
function blockedBy(exercise: Exercise, status: Map<string, Equipment>): string[] {
  const out = exercise.equipmentIds
    .map((id) => status.get(id))
    .filter((e): e is Equipment => !!e && e.status !== "available")
    .map((e) => e.name);
  const anyOf = (exercise.anyOfEquipmentIds ?? []).map((id) => status.get(id)).filter((e): e is Equipment => !!e);
  if (anyOf.length > 0 && anyOf.every((e) => e.status !== "available")) out.push(...anyOf.map((e) => e.name));
  return out;
}

export function WorkoutView({
  plan,
  saved,
  equipment,
  exercises,
  actions,
  lastTimeFor,
  onStartOver,
  facilityName,
  facilitySlug,
  totalEquipment,
  completion,
}: {
  plan: ActivePlan;
  /** False when this browser refuses to save — progress lasts only while the page is open. */
  saved: boolean;
  /** Current status of the room's equipment (may have changed since the plan was built). */
  equipment: Equipment[];
  exercises: Exercise[];
  actions: PlanActions;
  lastTimeFor: (exerciseId: string) => { at: string; sets: SetLog[] } | null;
  onStartOver: () => void;
  facilityName: string;
  facilitySlug: string;
  totalEquipment: number;
  /** Rendered when the plan is complete (feedback question etc.). */
  completion?: React.ReactNode;
}) {
  const status = new Map(equipment.map((e) => [e.id, e]));
  const inService = (list: Equipment[]) => {
    const ok = list.filter((e) => status.get(e.id)?.status === "available");
    return ok.length > 0 ? ok : list;
  };
  const { goal, level, duration, focus = [] } = plan.request;
  const focusText = focus.map((f) => focusLabels[f]).join(" + ");
  const all = steps(plan);
  const finished = all.filter((s) => plan.done.includes(s) || plan.skipped.includes(s)).length;
  const complete = isComplete(plan);
  const started = plan.done.length > 0 || plan.skipped.length > 0 || Object.keys(plan.logs).length > 0;
  const selectedIds = new Set(plan.items.map((i) => i.exercise.id));
  const estimated = estimateMinutes(plan.warmup, plan.items);

  if (plan.items.length === 0) {
    return (
      <div className="pt-2">
        <p className="eyebrow">Your workout</p>
        <h1 className="mt-1.5 text-[24px] font-semibold leading-[1.2] tracking-[-0.025em]">
          We couldn&apos;t build a plan with these settings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Not enough equipment at {facilityName} is marked in service for this plan right now. Try a different goal,
          focus or level, or look up a machine directly.
        </p>
        <div className="mt-6 grid gap-2">
          <Link href={`/g/${facilitySlug}`} className={buttonClass("primary", "lg", "w-full")}>
            Change settings
          </Link>
          <Link href={`/g/${facilitySlug}/equipment`} className={buttonClass("secondary", "lg", "w-full")}>
            Equipment
          </Link>
        </div>
      </div>
    );
  }

  const usedEquipment = [
    ...new Map(
      [...(plan.warmup?.equipment ?? []), ...plan.items.flatMap((i) => i.equipment)].map((e) => [e.id, e]),
    ).values(),
  ];

  return (
    <div className="pt-2">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">Your workout</p>
        {started && (
          <button type="button" onClick={onStartOver} className="-mt-1 text-xs font-medium text-muted hover:text-ink">
            Start over
          </button>
        )}
      </div>
      <h1 className="mt-1.5 text-[26px] font-semibold leading-[1.15] tracking-[-0.025em]">
        {duration}-minute {goalLabels[goal]}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {focusText ? `${focusText} focus · ` : ""}
        {levelLabels[level]} · {plan.items.length} exercises{plan.warmup ? " + warm-up" : ""} · about {estimated} min
      </p>
      {!saved && (
        <p role="status" className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-warn">
          This browser isn&apos;t letting Helios save, so your progress and weights last only while this page is open.
        </p>
      )}
      {plan.shortOfTime && (
        <p className="mt-3 rounded-xl bg-sun-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-sun-ink">
          This room supports about {estimated} minutes of {focusText ? `${focusText.toLowerCase()} ` : ""}work at{" "}
          {levelLabels[level].toLowerCase()} level. {focus.length > 0 ? "Add another focus area" : "Try a higher level"}{" "}
          for a longer plan.
        </p>
      )}

      {/* The point of the demo: the workout knows what is in this room. */}
      <section aria-label="Built for this room" className="mt-5 rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line shadow-card">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sun-soft text-sun-ink">
            <IconCheck className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Built for this room</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
              Uses only equipment at {facilityName} that&apos;s marked in service.
              {plan.excludedEquipmentNames.length > 0 && (
                <span className="text-ink-3">
                  {" "}
                  {plan.excludedEquipmentNames.join(", ")} {plan.excludedEquipmentNames.length === 1 ? "is" : "are"} out
                  of service, so {plan.excludedEquipmentNames.length === 1 ? "it's" : "they're"} left out.
                </span>
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
        <p className="mt-2 text-xs text-muted">
          Uses {usedEquipment.length} of the {totalEquipment} equipment entries in this room ·{" "}
          {saved ? "progress and weights are saved on this device" : "not saved on this device"}
        </p>
      </section>

      {/* Progress */}
      <div className="mt-6 flex items-center gap-3" aria-live="polite">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2">
          <div
            className="h-full rounded-full bg-sun transition-[width] duration-500"
            style={{ width: `${all.length ? (finished / all.length) * 100 : 0}%` }}
          />
        </div>
        <span className="tabular text-xs text-muted">
          {finished} of {all.length} done
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {plan.warmup && (
          <li>
            <ExerciseCard
              label="Warm-up"
              item={plan.warmup}
              blockedNames={blockedBy(plan.warmup.exercise, status)}
              displayEquipment={inService(plan.warmup.equipment)}
              facilitySlug={facilitySlug}
              done={plan.done.includes("warmup")}
              onToggle={() => actions.toggleDone("warmup")}
            />
          </li>
        )}
        {plan.items.map((item, i) => {
          const primaryId = primaryEquipmentId(item);
          const primary = primaryId ? status.get(primaryId) : undefined;
          const otherSelected = new Set([...selectedIds].filter((id) => id !== item.exercise.id));
          return (
            <li key={item.slot}>
              <ExerciseCard
                label={String(i + 1).padStart(2, "0")}
                item={item}
                slot={item.slot}
                facilitySlug={facilitySlug}
                done={plan.done.includes(item.slot)}
                skipped={plan.skipped.includes(item.slot)}
                onToggle={() => actions.toggleDone(item.slot)}
                blockedNames={blockedBy(item.exercise, status)}
                displayEquipment={inService(item.equipment)}
                busyMachine={primary && plan.busy.includes(primary.id) ? primary : undefined}
                primary={primary}
                options={optionsFor(item, {
                  exercises,
                  equipment,
                  level,
                  busy: plan.busy,
                  selectedIds: otherSelected,
                })}
                lastTime={item.kind === "strength" ? lastTimeFor(item.exercise.id) : null}
                sets={plan.logs[item.slot] ?? []}
                actions={actions}
              />
            </li>
          );
        })}
      </ol>

      {complete ? (
        <section className="mt-6 rounded-2xl bg-ink p-5 text-paper" aria-live="polite">
          <p className="text-lg font-semibold">Workout complete</p>
          <p className="mt-1 text-sm text-paper/70">
            Nice work. Anything you logged is saved in{" "}
            <Link href={`/g/${facilitySlug}/history`} className="underline underline-offset-2">
              My history
            </Link>{" "}
            on this device.
          </p>
          {completion}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onStartOver} className={buttonClass("sun", "md", "flex-1")}>
              New workout
            </button>
            <Link
              href={`/g/${facilitySlug}/equipment`}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-medium text-paper ring-1 ring-inset ring-paper/30 hover:bg-paper/10"
            >
              Equipment
            </Link>
          </div>
        </section>
      ) : (
        <p className="mt-6 text-center text-xs text-muted">
          Check off each exercise as you go. You can leave to look at a machine and come back — your place is kept.
        </p>
      )}
    </div>
  );
}

function ExerciseCard({
  label,
  item,
  slot,
  facilitySlug,
  done,
  skipped = false,
  onToggle,
  blockedNames = [],
  displayEquipment,
  busyMachine,
  primary,
  options = [],
  lastTime,
  sets = [],
  actions,
}: {
  label: string;
  item: WorkoutItem | PlanItem;
  slot?: string;
  facilitySlug: string;
  done: boolean;
  skipped?: boolean;
  onToggle: () => void;
  blockedNames?: string[];
  displayEquipment?: Equipment[];
  busyMachine?: Equipment;
  primary?: Equipment;
  options?: ExerciseOption[];
  lastTime?: { at: string; sets: SetLog[] } | null;
  sets?: SetLog[];
  actions?: PlanActions;
}) {
  const [panel, setPanel] = useState<"none" | "swap" | "busy">("none");
  const [logOpen, setLogOpen] = useState(sets.length > 0);
  const first = item.equipment[0];
  const blocked = blockedNames.length > 0;
  const canChange = !!actions && !!slot && item.kind === "strength";
  const showOptions = canChange && !done && (panel !== "none" || blocked || !!busyMachine);
  const unit = formatOf(item.exercise) === "carry" ? "sec" : "reps";
  const last = lastTime ? bestSetText(lastTime.sets, unit) : null;
  const panelId = `options-${slot ?? "warmup"}`;

  return (
    <article
      className={cn(
        "rounded-2xl bg-surface ring-1 ring-inset shadow-card transition",
        done ? "ring-ok/35" : "ring-line",
        skipped && "opacity-60",
      )}
    >
      <div className="flex gap-3.5 p-4">
        <Link href={`/g/${facilitySlug}/equipment/${first.slug}`} className="shrink-0" aria-label={`${first.name} details`}>
          <EquipmentTile kind={first.kind} className="size-14" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {label}
            {skipped && " · skipped"}
          </p>
          <h2 className={cn("mt-0.5 text-[16px] font-semibold leading-snug", done && "text-muted line-through decoration-1")}>
            {item.exercise.name}
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-sun-ink">{equipmentLabel(displayEquipment ?? item.equipment)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <IconPin className="size-3.5 shrink-0" />
            {first.location}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[13px]">
        <span className="tabular font-medium">{prescription(item)}</span>
        {item.rest && (
          <span className="inline-flex items-center gap-1 text-muted">
            <IconClock className="size-3.5" /> Rest {item.rest}
          </span>
        )}
        {last && lastTime && (
          <span className="text-ink-3">
            Last time: <span className="font-medium">{last}</span>{" "}
            <span className="text-muted">({shortDate(lastTime.at)})</span>
          </span>
        )}
      </div>
      <p className="px-4 pb-3 text-[13px] leading-relaxed text-ink-3">{item.exercise.instruction}</p>

      {blocked && (
        <p role="status" className="mx-4 mb-3 rounded-lg bg-down-soft px-3 py-2 text-[13px] leading-relaxed text-down">
          <span className="font-semibold">{blockedNames.join(" and ")}</span> {blockedNames.length === 1 ? "was" : "were"}{" "}
          just marked out of service.{!done && canChange ? " Pick another option below." : ""}
        </p>
      )}
      {busyMachine && !blocked && (
        <div role="status" className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-lg bg-paper-2 px-3 py-2 text-[13px]">
          <span>
            You marked <span className="font-semibold">{busyMachine.name}</span> as busy.
          </span>
          <button
            type="button"
            onClick={() => actions?.setBusy(busyMachine.id, false)}
            className="shrink-0 text-xs font-medium text-sun-ink hover:underline"
          >
            It&apos;s free now
          </button>
        </div>
      )}

      {/* Weight log */}
      {canChange && logOpen && item.sets && (
        <SetLogger
          key={`${slot}-${item.exercise.id}`}
          slot={slot!}
          count={item.sets}
          sets={sets}
          lastSets={lastTime?.sets ?? []}
          unit={unit}
          onLog={(i, patch) => actions!.logSet(slot!, i, patch)}
        />
      )}

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
        {canChange && item.sets && (
          <button
            type="button"
            onClick={() => setLogOpen((v) => !v)}
            aria-expanded={logOpen}
            className={buttonClass("ghost", "md", "min-h-11 ring-1 ring-inset ring-line")}
          >
            {logOpen ? "Hide log" : "Log weights"}
          </button>
        )}
      </div>

      {canChange && !done && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 text-[13px]">
          <button
            type="button"
            onClick={() => setPanel(panel === "swap" ? "none" : "swap")}
            aria-expanded={panel === "swap"}
            aria-controls={panelId}
            className="inline-flex min-h-8 items-center gap-1 font-medium text-ink-3 hover:text-ink"
          >
            <IconSwap className="size-3.5" /> Try another exercise
          </button>
          {primary && !busyMachine && !blocked && (
            <button
              type="button"
              onClick={() => {
                actions!.setBusy(primary.id, true);
                setPanel("busy");
              }}
              className="inline-flex min-h-8 items-center font-medium text-ink-3 hover:text-ink"
            >
              {primary.name} is busy
            </button>
          )}
          <button
            type="button"
            onClick={() => actions!.skip(slot!)}
            className="inline-flex min-h-8 items-center font-medium text-muted hover:text-ink"
          >
            {skipped ? "Undo skip" : "Skip"}
          </button>
        </div>
      )}

      {showOptions && (
        <div id={panelId} className="rounded-b-2xl border-t border-line bg-paper/60 px-4 pb-4 pt-3">
          {options.length > 0 ? (
            <>
              <p className="text-xs text-muted">
                {busyMachine
                  ? `Options that don't need the ${busyMachine.name}:`
                  : "Also possible with the equipment in service in this room:"}
              </p>
              <ul className="mt-2 space-y-2">
                {options.map((alt) => (
                  <li key={alt.exercise.id}>
                    <button
                      type="button"
                      onClick={() => {
                        actions!.swap(slot!, alt);
                        setPanel("none");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl bg-surface p-2.5 text-left ring-1 ring-inset ring-line hover:ring-line-strong"
                    >
                      <EquipmentTile kind={alt.equipment[0].kind} className="size-10" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{alt.exercise.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {equipmentLabel(alt.equipment)} · {alt.equipment[0].location}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-sun-ink">Use this</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="text-[13px] text-ink-3">
                No other option in this room right now
                {busyMachine ? ` without the ${busyMachine.name}` : ""}.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    actions!.moveToEnd(slot!);
                    setPanel("none");
                  }}
                  className={buttonClass("secondary", "md", "flex-1")}
                >
                  Do it later
                </button>
                <button
                  type="button"
                  onClick={() => {
                    actions!.skip(slot!);
                    setPanel("none");
                  }}
                  className={buttonClass("ghost", "md", "flex-1 ring-1 ring-inset ring-line")}
                >
                  Skip for today
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function SetLogger({
  slot,
  count,
  sets,
  lastSets,
  unit,
  onLog,
}: {
  slot: string;
  count: number;
  sets: SetLog[];
  lastSets: SetLog[];
  unit: "reps" | "sec";
  onLog: (index: number, patch: SetLog) => void;
}) {
  // Inputs keep what's typed (so "7." can become "7.5"); only valid numbers are saved.
  const commit = (i: number, field: "weight" | "reps", v: string) => {
    const t = v.trim();
    if (t === "") return onLog(i, { [field]: undefined });
    const n = Number(t);
    if (Number.isFinite(n)) onLog(i, { [field]: n });
  };
  return (
    <fieldset className="mx-4 mb-3 rounded-xl bg-paper px-3 py-2.5 ring-1 ring-inset ring-line">
      <legend className="sr-only">Log weight and {unit} for each set</legend>
      <div className="grid grid-cols-[3rem_1fr_1fr] gap-x-2 pb-1 text-[11px] font-medium text-muted">
        <span>Set</span>
        <span>Weight (lb)</span>
        <span>{unit === "sec" ? "Seconds" : "Reps"}</span>
      </div>
      {Array.from({ length: count }, (_, i) => {
        const s = sets[i] ?? {};
        const prev = lastSets[i] ?? lastSets[lastSets.length - 1];
        return (
          <div key={i} className="grid grid-cols-[3rem_1fr_1fr] items-center gap-x-2 py-1">
            <span className="text-[13px] tabular text-ink-3">{i + 1}</span>
            <input
              inputMode="decimal"
              aria-label={`Set ${i + 1} weight in pounds`}
              defaultValue={s.weight ?? ""}
              placeholder={prev?.weight !== undefined ? String(prev.weight) : "—"}
              onChange={(e) => commit(i, "weight", e.target.value)}
              className="h-10 w-full rounded-lg bg-surface px-2.5 text-[15px] tabular ring-1 ring-inset ring-line placeholder:text-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-sun"
              name={`${slot}-w${i}`}
            />
            <input
              inputMode="numeric"
              aria-label={`Set ${i + 1} ${unit === "sec" ? "seconds" : "reps"}`}
              defaultValue={s.reps ?? ""}
              placeholder={prev?.reps !== undefined ? String(prev.reps) : "—"}
              onChange={(e) => commit(i, "reps", e.target.value)}
              className="h-10 w-full rounded-lg bg-surface px-2.5 text-[15px] tabular ring-1 ring-inset ring-line placeholder:text-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-sun"
              name={`${slot}-r${i}`}
            />
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-muted">
        Grey numbers are from last time. Saved on this device as you type.
      </p>
    </fieldset>
  );
}
