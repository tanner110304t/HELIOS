"use client";

import { useMemo, useState } from "react";
import { useFacilityState } from "@/lib/demo/client";
import { generateWorkout, type Workout, type WorkoutRequest } from "@/lib/workout/generateWorkout";
import type { Equipment, Exercise } from "@/types/domain";
import { WorkoutView } from "./WorkoutView";

const signature = (w: Workout) =>
  [w.warmup?.exercise.id, ...w.items.map((i) => i.exercise.id)].join("|");

/**
 * Builds the plan in the browser from the room's CURRENT service status
 * (seed data + property-team changes). Until the resident starts (checks
 * something off or swaps), the plan follows status changes. After that it's
 * locked: affected exercises are flagged instead of silently rewritten.
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
  const plan = useMemo(() => generateWorkout(request, { equipment, exercises }), [request, equipment, exercises]);
  const [locked, setLocked] = useState<Workout | null>(null);
  const shown = locked ?? plan;

  return (
    <WorkoutView
      key={signature(shown)}
      workout={shown}
      equipment={equipment}
      onStarted={() => setLocked((l) => l ?? plan)}
      facilityName={facilityName}
      facilitySlug={facilitySlug}
      totalEquipment={equipment.length}
    />
  );
}
