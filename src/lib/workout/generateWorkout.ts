import type {
  Difficulty,
  Duration,
  Equipment,
  Exercise,
  FocusArea,
  Goal,
  Level,
  MovementCategory,
} from "@/types/domain";
import { ACCESSORY_CATEGORIES, MIN_SETS, focusCategories, templates } from "./templates";
import { formatOf, formatRest, strengthSeconds, warmupMinutes } from "./timeModel";

/**
 * Helios demo workout engine.
 *
 *   Goal + Experience + Duration + Facility Equipment
 *     → Workout Template        (templates.ts: ordered movement slots)
 *     → Eligible Exercises      (only what this room's AVAILABLE equipment supports)
 *     → Fit to time budget      (timeModel.ts: fewer sets / exercises, never less rest)
 *     → Demo Workout            (deterministic: same inputs, same workout)
 *
 * No randomness, no AI. The room constrains the result.
 */

export type WorkoutRequest = {
  goal: Goal;
  level: Level;
  duration: Duration;
  /** Body areas to focus on. Empty or missing = full body. */
  focus?: FocusArea[];
};

/** An exercise paired with the facility equipment it would use. */
export type ExerciseOption = {
  exercise: Exercise;
  /** The facility equipment this exercise will use. */
  equipment: Equipment[];
};

export type WorkoutItem = ExerciseOption & {
  kind: "strength" | "cardio";
  sets?: number;
  /** Display text for one set, e.g. "8–12 reps", "10 reps each side", "30–40 sec walk". */
  reps?: string;
  restSeconds?: number;
  rest?: string;
  minutes?: number;
  /** Estimated time for this item, from timeModel.ts. */
  estimatedSeconds: number;
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
  /** Estimated total, rounded to the minute. Always ≤ the requested length when a plan exists. */
  estimatedMinutes: number;
  /**
   * True when the room doesn't have enough suitable exercises for the chosen
   * focus/level to fill most of the time. The UI says so rather than padding.
   */
  shortOfTime: boolean;
};

/** Movement slots for a request: the goal's order, narrowed to the focus areas if any. */
export function slotOrder(goal: Goal, focus: FocusArea[] = []): MovementCategory[] {
  const base = templates[goal].slots;
  if (focus.length === 0) return base;
  const wanted = new Set(focus.flatMap((f) => focusCategories[f]));
  return [...base.filter((c) => wanted.has(c)), ...[...wanted].filter((c) => !base.includes(c))];
}

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

  const budgetSeconds = duration * 60;

  // 3. Warm-up: first available easy cardio option (shorter in a 20-minute session).
  let warmup: WorkoutItem | null = null;
  for (const id of WARMUP_ORDER) {
    const found = eligible.find((x) => x.exercise.id === id);
    if (found) {
      const minutes = warmupMinutes(duration);
      warmup = { ...found, kind: "cardio", minutes, estimatedSeconds: minutes * 60, alternatives: [] };
      break;
    }
  }

  // 4. Candidate strength exercises: walk the slots (narrowed to the focus areas),
  //    going round again with new exercises for longer sessions, up to the template maximum.
  const slots = slotOrder(goal, request.focus);
  const maxCount = template.strengthCount[duration];
  const candidates: { option: ExerciseOption; accessory: boolean }[] = [];
  let addedThisPass = true;
  while (candidates.length < maxCount && addedThisPass) {
    addedThisPass = false;
    for (const slot of slots) {
      if (candidates.length >= maxCount) break;
      const chosen = pick(slot);
      if (!chosen) continue; // room can't support this slot (or has run out) — move on
      usedExerciseIds.add(chosen.exercise.id);
      usedPrimaryEquipment.add(chosen.equipment[0].id);
      candidates.push({ option: chosen, accessory: ACCESSORY_CATEGORIES.includes(slot) });
      addedThisPass = true;
    }
  }

  // 5. Optional conditioning finisher (different machine from the warm-up when possible).
  let finisher: WorkoutItem | null = null;
  if (template.finisherMinutes) {
    const cardio = byCategory("cardio");
    const warmupEq = warmup?.equipment[0]?.id;
    const ordered = [...LEVEL_PREFERENCE[level]].flatMap((d) =>
      cardio.filter((x) => x.exercise.difficulty === d),
    );
    const found = ordered.find((x) => x.equipment[0].id !== warmupEq) ?? ordered[0];
    if (found) {
      const minutes = template.finisherMinutes[duration];
      finisher = { ...found, kind: "cardio", minutes, estimatedSeconds: minutes * 60, alternatives: [] };
    }
  }

  // 6. Fit strength work into what's left. Rest is never cut; sets and exercise count are.
  const rx = template.prescription[level];
  const strengthBudget =
    budgetSeconds - (warmup?.estimatedSeconds ?? 0) - (finisher?.estimatedSeconds ?? 0);
  const fit = fitStrength(
    candidates.map((c) => c.option.exercise),
    rx.sets,
    rx.restSeconds,
    strengthBudget,
    template.prefer,
  );
  const chosen = candidates.slice(0, fit.count);
  // Exercises that didn't fit are free to appear as swap options.
  for (const dropped of candidates.slice(fit.count)) usedExerciseIds.delete(dropped.option.exercise.id);

  const items: WorkoutItem[] = chosen.map(({ option, accessory }) => ({
    ...option,
    kind: "strength",
    sets: fit.sets,
    reps: repsText(option.exercise, accessory ? template.accessoryReps : rx.reps),
    restSeconds: rx.restSeconds,
    rest: formatRest(rx.restSeconds),
    estimatedSeconds: strengthSeconds(option.exercise, fit.sets, rx.restSeconds),
    alternatives: [],
  }));
  if (finisher && items.length > 0) {
    usedExerciseIds.add(finisher.exercise.id);
    items.push(finisher);
  }

  // 7. Swap options: other eligible exercises for the same slot, not already in the workout.
  for (const item of items) {
    item.alternatives = byCategory(item.exercise.movementCategory)
      .filter((x) => !usedExerciseIds.has(x.exercise.id))
      .slice(0, 2);
  }

  return {
    request,
    warmup: items.length > 0 ? warmup : null,
    items,
    excludedEquipment,
    availableEquipmentCount: available.size,
    estimatedMinutes: items.length > 0 ? estimateMinutes(warmup, items) : 0,
    shortOfTime: items.length > 0 && estimateMinutes(warmup, items) < duration * 0.75,
  };
}

/** Total estimated minutes for a plan (used again on the client after swaps). */
export function estimateMinutes(warmup: WorkoutItem | null, items: WorkoutItem[]): number {
  const seconds = (warmup?.estimatedSeconds ?? 0) + items.reduce((a, i) => a + i.estimatedSeconds, 0);
  return Math.round(seconds / 60);
}

/** Re-estimate one strength item after its exercise changes (e.g. a swap to a one-arm movement). */
export function withExercise(item: WorkoutItem, option: ExerciseOption, baseReps: string): WorkoutItem {
  if (item.kind !== "strength" || item.sets === undefined || item.restSeconds === undefined) {
    return { ...item, ...option };
  }
  return {
    ...item,
    ...option,
    reps: repsText(option.exercise, baseReps),
    estimatedSeconds: strengthSeconds(option.exercise, item.sets, item.restSeconds),
  };
}

/** "8–12" → "8–12 reps" / "8–12 reps each side" / "30–40 sec walk". */
export function repsText(exercise: Exercise, reps: string): string {
  switch (formatOf(exercise)) {
    case "carry":
      return "30–40 sec walk";
    case "each-side":
      return `${reps} reps each side`;
    default:
      return `${reps} reps`;
  }
}

/** Strip the unit back off, so a swapped exercise can be re-described. */
export function baseReps(text: string | undefined): string {
  return (text ?? "").replace(/ reps( each side)?$/, "").replace(/^30–40 sec walk$/, "10");
}

/**
 * Choose how many of the candidate exercises to keep, and how many sets each,
 * so the estimate fits the budget. Maximises total working sets; ties go to
 * the template's preference. Sets stay between MIN_SETS and the target.
 */
export function fitStrength(
  exercises: Exercise[],
  targetSets: number,
  restSeconds: number,
  budgetSeconds: number,
  prefer: "sets" | "exercises",
): { count: number; sets: number } {
  const minSets = Math.min(MIN_SETS, targetSets);
  let best = { count: 0, sets: targetSets, score: -1 };
  for (let count = 1; count <= exercises.length; count++) {
    for (let sets = targetSets; sets >= minSets; sets--) {
      const total = exercises
        .slice(0, count)
        .reduce((a, ex) => a + strengthSeconds(ex, sets, restSeconds), 0);
      if (total > budgetSeconds) continue;
      const score = count * sets;
      const better =
        score > best.score ||
        (score === best.score && (prefer === "sets" ? sets > best.sets : count > best.count));
      if (better) best = { count, sets, score };
    }
  }
  if (!best.count) return { count: 0, sets: targetSets };

  // Don't leave a session mostly empty: if every candidate is already in and the plan
  // uses under 80% of the time, add sets (up to 4) while they still fit.
  const total = (sets: number) =>
    exercises.slice(0, best.count).reduce((a, ex) => a + strengthSeconds(ex, sets, restSeconds), 0);
  const maxSets = Math.max(targetSets, 4);
  let sets = best.sets;
  while (
    best.count === exercises.length &&
    sets < maxSets &&
    total(sets) < budgetSeconds * 0.8 &&
    total(sets + 1) <= budgetSeconds
  ) {
    sets += 1;
  }
  return { count: best.count, sets };
}
