"use client";

import { useMemo, useState } from "react";
import {
  changePlan,
  endPlan,
  recordEvent,
  removeEvent,
  startPlan,
  useFacilityState,
  useResident,
} from "@/lib/demo/client";
import * as R from "@/lib/demo/resident";
import { generateWorkout, type ExerciseOption, type WorkoutRequest } from "@/lib/workout/generateWorkout";
import type { Equipment, Exercise } from "@/types/domain";
import { FeedbackPrompt } from "./FeedbackPrompt";
import { WorkoutView, type PlanActions } from "./WorkoutView";

/**
 * Connects the workout screen to this device's saved plan.
 *
 * - Same settings as a saved, unfinished plan → resume it (reload-safe, and
 *   safe to leave for a machine page and come back).
 * - Otherwise show a fresh plan built from the room's CURRENT service status.
 *   It's only saved when the resident does something (checks off, logs, swaps).
 * - If the browser refuses to save, keep working in memory and say so.
 */
export function WorkoutClient({
  request,
  facilityId,
  facilityName,
  facilitySlug,
  equipment: seedEquipment,
  exercises,
}: {
  request: WorkoutRequest;
  facilityId: string;
  facilityName: string;
  facilitySlug: string;
  equipment: Equipment[];
  exercises: Exercise[];
}) {
  const { equipment } = useFacilityState(facilityId, seedEquipment);
  const { state: resident, hydrated } = useResident(facilityId);
  const fresh = useMemo(() => generateWorkout(request, { equipment, exercises }), [request, equipment, exercises]);
  const [memory, setMemory] = useState<R.ActivePlan | null>(null); // used only when saving fails
  const [restarted, setRestarted] = useState(0);

  const saved = resident.active;
  const matches = !!saved && saved.facilityId === facilityId && R.requestKey(saved.request) === R.requestKey(request);
  const preview = useMemo(
    () => R.newActivePlan(fresh, facilityId, "preview", ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fresh, facilityId, restarted],
  );
  const plan = memory ?? (matches ? saved! : preview);

  /** Apply a change to the plan, save it, and note the few events the operator panel counts. */
  const apply = (fn: (p: R.ActivePlan) => R.ActivePlan) => {
    if (memory) return setMemory(fn(memory));
    let current = plan;
    if (!matches) {
      const started = startPlan(facilityId, fresh);
      if (!started) return setMemory(fn({ ...preview, id: "memory" }));
      current = started;
      recordEvent(facilityId, { type: "plan_started", planId: started.id });
    }
    const next = fn(current);
    if (!current.completedAt && next.completedAt) recordEvent(facilityId, { type: "plan_completed", planId: current.id });
    if (current.completedAt && !next.completedAt) removeEvent(facilityId, "plan_completed", current.id);
    if (!changePlan(facilityId, fn)) setMemory(next);
  };

  const now = () => new Date().toISOString();
  const actions: PlanActions = {
    toggleDone: (key) => apply((p) => R.toggleDone(p, key, now())),
    swap: (slot: string, option: ExerciseOption) => {
      const item = plan.items.find((i) => i.slot === slot);
      const primary = item && R.primaryEquipmentId(item);
      const busy = !!primary && plan.busy.includes(primary);
      apply((p) => R.swapItem(p, slot, option));
      recordEvent(facilityId, { type: busy ? "busy_alternative" : "exercise_swapped", planId: plan.id });
    },
    setBusy: (id, busy) => apply((p) => R.setBusy(p, id, busy)),
    skip: (slot) => apply((p) => R.skipItem(p, slot, now())),
    moveToEnd: (slot) => apply((p) => R.moveToEnd(p, slot)),
    logSet: (slot, i, patch) => apply((p) => R.logSet(p, slot, i, patch)),
  };

  const onStartOver = () => {
    endPlan(facilityId);
    setMemory(null);
    setRestarted((n) => n + 1);
    window.scrollTo({ top: 0 });
  };

  if (!hydrated) {
    return (
      <div className="pt-2" aria-busy="true">
        <p className="eyebrow">Your workout</p>
        <div className="mt-3 h-8 w-3/4 animate-pulse rounded-lg bg-paper-2" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-paper-2" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-paper-2" />
      </div>
    );
  }

  return (
    <WorkoutView
      key={restarted} /* not plan.id: starting to save mid-typing must not reset inputs */
      plan={plan}
      saved={!memory}
      equipment={equipment}
      exercises={exercises}
      actions={actions}
      lastTimeFor={(exerciseId) => R.lastTime(resident, exerciseId, plan.id)}
      onStartOver={onStartOver}
      facilityName={facilityName}
      facilitySlug={facilitySlug}
      totalEquipment={equipment.length}
      completion={
        <FeedbackPrompt
          plan={plan}
          onAnswer={(answer, reasons) => {
            apply((p) => ({ ...p, feedback: { answer, reasons, at: now() } }));
            if (answer !== "skip") recordEvent(facilityId, { type: "feedback_submitted", planId: plan.id, answer, reasons });
          }}
        />
      }
    />
  );
}
