import type {
  Difficulty,
  Duration,
  Equipment,
  Exercise,
  Goal,
  Level,
  MovementCategory,
} from "@/types/domain";
import { ACCESSORY_CATEGORIES, WARMUP_MINUTES, templates } from "./templates";

/**
 * Helios demo workout engine.
 *
 *   Goal + Experience + Duration + Facility Equipment
 *     → Workout Template        (templates.ts: ordered movement slots)
 *     → Eligible Exercises      (only what this room's AVAILABLE equipment supports)
 *     → Demo Workout            (deterministic: same inputs, same workout)
 *
 * No randomness, no AI. The room constrains the result.
 */

export type WorkoutRequest = { goal: Goal; level: Level; duration: Duration };

/** An exercise paired with the facility equipment it would use. */
export type ExerciseOption = {
  exercise: Exercise;
  /** The facility equipment this exercise will use. */
  equipment: Equipment[];
};

export type WorkoutItem = ExerciseOption & {
  kind: "strength" | "cardio";
  sets?: number;
  reps?: string;
  rest?: string;
  minutes?: number;
  /** Up to two other exercises for the same slot that this room also supports. */
  alternatives: ExerciseOption[];
};

export type Workout = {
  request: WorkoutRequest;
  warmup: WorkoutItem | null;
  items: WorkoutItem[];
  /** Equipment in the room that is currently unavailable and was left out. */
  excludedEquipment: Equipment[];
  availableEquipmentCount: number;
};

const LEVEL_PREFERENCE: Record<Level, Difficulty[]> = {
  beginner: ["beginner"],
  intermediate: ["intermediate", "beginner"],
  advanced: ["advanced", "intermediate", "beginner"],
};

const WARMUP_ORDER = ["ex_bike_easy", "ex_elliptical_steady", "ex_treadmill_incline_walk"];

/** Resolve the facility equipment an exercise would use, or null if the room can't support it. */
export function resolveEquipment(exercise: Exercise, available: Map<string, Equipment>): Equipment[] | null {
  const required: Equipment[] = [];
  for (const id of exercise.equipmentIds) {
    const eq = available.get(id);
    if (!eq) return null;
    required.push(eq);
  }
  if (exercise.anyOfEquipmentIds?.length) {
    const options = exercise.anyOfEquipmentIds
      .map((id) => available.get(id))
      .filter((e): e is Equipment => Boolean(e));
    if (options.length === 0) return null;
    required.push(...options);
  }
  return required;
}

export function isExerciseAllowedForLevel(exercise: Exercise, level: Level): boolean {
  return LEVEL_PREFERENCE[level].includes(exercise.difficulty);
}

export function generateWorkout(
  request: WorkoutRequest,
  facility: { equipment: Equipment[]; exercises: Exercise[] },
): Workout {
  const { goal, level, duration } = request;
  const template = templates[goal];

  // 1. The room: only equipment that exists here AND is currently available.
  const available = new Map(
    facility.equipment.filter((e) => e.status === "available").map((e) => [e.id, e]),
  );
  const excludedEquipment = facility.equipment.filter((e) => e.status !== "available");

  // 2. Eligible exercises: supported by the room and appropriate for the level.
  const eligible = facility.exercises
    .map((exercise) => ({ exercise, equipment: resolveEquipment(exercise, available) }))
    .filter(
      (x): x is ExerciseOption =>
        x.equipment !== null && isExerciseAllowedForLevel(x.exercise, level),
    );

  const byCategory = (category: MovementCategory) =>
    eligible.filter((x) => x.exercise.movementCategory === category);

  const usedExerciseIds = new Set<string>();
  const usedPrimaryEquipment = new Set<string>();

  /** Pick for a slot: preferred difficulty first; within a tier, favor equipment not yet used. */
  function pick(category: MovementCategory) {
    const candidates = byCategory(category).filter((x) => !usedExerciseIds.has(x.exercise.id));
    for (const difficulty of LEVEL_PREFERENCE[level]) {
      const tier = candidates.filter((x) => x.exercise.difficulty === difficulty);
      if (tier.length === 0) continue;
      return tier.find((x) => !usedPrimaryEquipment.has(x.equipment[0].id)) ?? tier[0];
    }
    return undefined;
  }

  // 3. Warm-up: first available easy cardio option.
  let warmup: WorkoutItem | null = null;
  for (const id of WARMUP_ORDER) {
    const found = eligible.find((x) => x.exercise.id === id);
    if (found) {
      warmup = { ...found, kind: "cardio", minutes: WARMUP_MINUTES, alternatives: [] };
      break;
    }
  }

  // 4. Fill strength slots in template order until the session is full.
  const items: WorkoutItem[] = [];
  const target = template.strengthCount[duration];
  const rx = template.prescription[level];
  for (const slot of template.slots) {
    if (items.length >= target) break;
    const chosen = pick(slot);
    if (!chosen) continue; // room can't support this slot — move to the next one
    usedExerciseIds.add(chosen.exercise.id);
    usedPrimaryEquipment.add(chosen.equipment[0].id);
    const accessory = ACCESSORY_CATEGORIES.includes(slot);
    items.push({
      ...chosen,
      kind: "strength",
      sets: rx.sets,
      reps: accessory ? template.accessoryReps : rx.reps,
      rest: rx.rest,
      alternatives: [],
    });
  }

  // 5. Optional conditioning finisher (different machine from the warm-up when possible).
  if (template.finisherMinutes) {
    const cardio = byCategory("cardio");
    const warmupEq = warmup?.equipment[0]?.id;
    const ordered = [...LEVEL_PREFERENCE[level]].flatMap((d) =>
      cardio.filter((x) => x.exercise.difficulty === d),
    );
    const finisher = ordered.find((x) => x.equipment[0].id !== warmupEq) ?? ordered[0];
    if (finisher) {
      usedExerciseIds.add(finisher.exercise.id);
      items.push({
        ...finisher,
        kind: "cardio",
        minutes: template.finisherMinutes[duration],
        alternatives: [],
      });
    }
  }

  // 6. Swap options: other eligible exercises for the same slot, not already in the workout.
  for (const item of items) {
    item.alternatives = byCategory(item.exercise.movementCategory)
      .filter((x) => !usedExerciseIds.has(x.exercise.id))
      .slice(0, 2);
  }

  return {
    request,
    warmup,
    items,
    excludedEquipment,
    availableEquipmentCount: available.size,
  };
}
