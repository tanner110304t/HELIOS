import {
  isExerciseAllowedForLevel,
  resolveEquipment,
  withExercise,
  baseReps,
  type ExerciseOption,
  type Workout,
  type WorkoutItem,
  type WorkoutRequest,
} from "@/lib/workout/generateWorkout";
import { goalLabels, isDuration, isFocusArea, isGoal, isLevel } from "@/lib/workout/templates";
import type { Equipment, Exercise } from "@/types/domain";

/**
 * A resident's own workout data — kept ON THIS DEVICE ONLY (no login).
 *   - the active plan: selections, swaps, progress, busy machines, set logs
 *   - history: logged sets from past sessions, for "last time" and My history
 * Operators never see any of this. Pure functions here; storage in ./client.ts.
 */

export const RESIDENT_VERSION = 1;
const MAX_HISTORY = 40;

/** One logged set. Weight in pounds; reps (or seconds, for a carry). */
export type SetLog = { weight?: number; reps?: number };

export type PlanItem = WorkoutItem & {
  /** Stable id for this position in the plan (survives swaps and reordering). */
  slot: string;
};

export type FeedbackAnswer = "yes" | "somewhat" | "no" | "skip";
export type FeedbackReason = "machine-busy" | "unclear-guidance" | "time-mismatch" | "not-suitable";

export const feedbackReasonLabels: Record<FeedbackReason, string> = {
  "machine-busy": "A machine was busy",
  "unclear-guidance": "Guidance wasn't clear",
  "time-mismatch": "Time didn't match",
  "not-suitable": "Plan wasn't right for me",
};

export type ActivePlan = {
  id: string;
  facilityId: string;
  request: WorkoutRequest;
  createdAt: string;
  shortOfTime: boolean;
  excludedEquipmentNames: string[];
  warmup: WorkoutItem | null;
  items: PlanItem[];
  /** Step keys that are checked off: "warmup" or an item slot. */
  done: string[];
  skipped: string[];
  /** Equipment the resident said was busy this session. */
  busy: string[];
  /** Logged sets by item slot. */
  logs: Record<string, SetLog[]>;
  completedAt?: string;
  feedback?: { answer: FeedbackAnswer; reasons: FeedbackReason[]; at: string };
};

export type HistoryExercise = {
  exerciseId: string;
  name: string;
  equipmentId: string;
  equipmentName: string;
  sets: SetLog[];
};

export type HistoryEntry = {
  planId: string;
  at: string;
  title: string;
  completed: boolean;
  exercises: HistoryExercise[];
};

export type ResidentState = {
  version: typeof RESIDENT_VERSION;
  active: ActivePlan | null;
  history: HistoryEntry[];
};

export const EMPTY_RESIDENT: ResidentState = Object.freeze({
  version: RESIDENT_VERSION,
  active: null,
  history: [],
}) as ResidentState;

// ── identity ────────────────────────────────────────────────────────────────

/** Same settings → same key, so a reload resumes instead of starting over. */
export function requestKey(r: WorkoutRequest): string {
  return [r.goal, r.level, r.duration, [...(r.focus ?? [])].sort().join("+")].join("|");
}

export function planTitle(r: WorkoutRequest): string {
  return `${r.duration}-min ${goalLabels[r.goal]}`;
}

export function newActivePlan(workout: Workout, facilityId: string, id: string, at: string): ActivePlan {
  return {
    id,
    facilityId,
    request: workout.request,
    createdAt: at,
    shortOfTime: workout.shortOfTime,
    excludedEquipmentNames: workout.excludedEquipment.map((e) => e.name),
    warmup: workout.warmup,
    items: workout.items.map((item, i) => ({ ...item, slot: `s${i + 1}` })),
    done: [],
    skipped: [],
    busy: [],
    logs: {},
  };
}

// ── progress ────────────────────────────────────────────────────────────────

export function steps(plan: ActivePlan): string[] {
  return [...(plan.warmup ? ["warmup"] : []), ...plan.items.map((i) => i.slot)];
}

/** Complete = every step either done or skipped, with at least one exercise actually done. */
export function isComplete(plan: ActivePlan): boolean {
  const all = steps(plan);
  if (plan.items.length === 0) return false;
  const doneItems = plan.items.filter((i) => plan.done.includes(i.slot));
  return doneItems.length > 0 && all.every((s) => plan.done.includes(s) || plan.skipped.includes(s));
}

const toggle = (list: string[], key: string) =>
  list.includes(key) ? list.filter((k) => k !== key) : [...list, key];

export function toggleDone(plan: ActivePlan, key: string, at: string): ActivePlan {
  const next = { ...plan, done: toggle(plan.done, key), skipped: plan.skipped.filter((k) => k !== key) };
  // Completion is recorded once; un-checking afterwards clears it (and re-completing records it again).
  return { ...next, completedAt: isComplete(next) ? (plan.completedAt ?? at) : undefined };
}

export function skipItem(plan: ActivePlan, slot: string, at: string): ActivePlan {
  const next = { ...plan, skipped: toggle(plan.skipped, slot), done: plan.done.filter((k) => k !== slot) };
  return { ...next, completedAt: isComplete(next) ? (plan.completedAt ?? at) : undefined };
}

export function moveToEnd(plan: ActivePlan, slot: string): ActivePlan {
  const item = plan.items.find((i) => i.slot === slot);
  if (!item) return plan;
  return { ...plan, items: [...plan.items.filter((i) => i.slot !== slot), item] };
}

/** Replace the exercise in a slot. Its check-off and logged sets belonged to the old exercise, so they're cleared. */
export function swapItem(plan: ActivePlan, slot: string, option: ExerciseOption): ActivePlan {
  const items = plan.items.map((i) => (i.slot === slot ? { ...withExercise(i, option, baseReps(i.reps)), slot } : i));
  const logs = { ...plan.logs };
  delete logs[slot];
  return {
    ...plan,
    items,
    logs,
    done: plan.done.filter((k) => k !== slot),
    skipped: plan.skipped.filter((k) => k !== slot),
    completedAt: undefined,
  };
}

export function setBusy(plan: ActivePlan, equipmentId: string, busy: boolean): ActivePlan {
  const has = plan.busy.includes(equipmentId);
  if (busy === has) return plan;
  return { ...plan, busy: busy ? [...plan.busy, equipmentId] : plan.busy.filter((id) => id !== equipmentId) };
}

export function logSet(plan: ActivePlan, slot: string, index: number, patch: SetLog): ActivePlan {
  const sets = [...(plan.logs[slot] ?? [])];
  while (sets.length <= index) sets.push({});
  sets[index] = clean({ ...sets[index], ...patch });
  return { ...plan, logs: { ...plan.logs, [slot]: sets } };
}

function clean(s: SetLog): SetLog {
  const out: SetLog = {};
  if (typeof s.weight === "number" && Number.isFinite(s.weight) && s.weight >= 0 && s.weight <= 2000) {
    out.weight = Math.round(s.weight * 10) / 10;
  }
  if (typeof s.reps === "number" && Number.isFinite(s.reps) && s.reps >= 0 && s.reps <= 500) {
    out.reps = Math.round(s.reps);
  }
  return out;
}

const hasData = (s: SetLog) => s.weight !== undefined || s.reps !== undefined;

// ── alternatives ────────────────────────────────────────────────────────────

/**
 * Other exercises for this slot that the room can support right now:
 * same movement, suitable for the level, all equipment in service, not
 * already in the plan — and never using a machine the resident marked busy.
 */
export function optionsFor(
  item: WorkoutItem,
  ctx: { exercises: Exercise[]; equipment: Equipment[]; level: WorkoutRequest["level"]; busy: string[]; selectedIds: Set<string> },
  limit = 3,
): ExerciseOption[] {
  const available = new Map(
    ctx.equipment.filter((e) => e.status === "available" && !ctx.busy.includes(e.id)).map((e) => [e.id, e]),
  );
  const out: ExerciseOption[] = [];
  for (const exercise of ctx.exercises) {
    if (out.length >= limit) break;
    if (exercise.movementCategory !== item.exercise.movementCategory) continue;
    if (exercise.id === item.exercise.id || ctx.selectedIds.has(exercise.id)) continue;
    if (!isExerciseAllowedForLevel(exercise, ctx.level)) continue;
    const equipment = resolveEquipment(exercise, available);
    if (equipment) out.push({ exercise, equipment });
  }
  return out;
}

/** The machine a "busy" tap refers to: the first piece the exercise requires. */
export function primaryEquipmentId(item: WorkoutItem): string | undefined {
  return item.exercise.equipmentIds[0];
}

// ── history ─────────────────────────────────────────────────────────────────

/** Turn a plan's logged sets into a history entry (null if nothing was logged). */
export function toHistoryEntry(plan: ActivePlan, at: string): HistoryEntry | null {
  const exercises: HistoryExercise[] = [];
  for (const item of plan.items) {
    const sets = (plan.logs[item.slot] ?? []).filter(hasData);
    if (sets.length === 0) continue;
    const eq = item.equipment[0];
    exercises.push({
      exerciseId: item.exercise.id,
      name: item.exercise.name,
      equipmentId: eq?.id ?? "",
      equipmentName: eq?.name ?? "",
      sets,
    });
  }
  if (exercises.length === 0) return null;
  return { planId: plan.id, at: plan.completedAt ?? at, title: planTitle(plan.request), completed: !!plan.completedAt, exercises };
}

/** Save (or update) the active plan's logs into history. Idempotent per plan id. */
export function archive(state: ResidentState, at: string): ResidentState {
  if (!state.active) return state;
  const entry = toHistoryEntry(state.active, at);
  const rest = state.history.filter((h) => h.planId !== state.active!.id);
  return { ...state, history: entry ? [entry, ...rest].slice(0, MAX_HISTORY) : rest };
}

/** Most recent logged sets for an exercise, from past sessions (not the current one). */
export function lastTime(state: ResidentState, exerciseId: string, excludePlanId?: string) {
  for (const h of state.history) {
    if (h.planId === excludePlanId) continue;
    const ex = h.exercises.find((e) => e.exerciseId === exerciseId);
    if (ex) return { at: h.at, sets: ex.sets };
  }
  return null;
}

export function historyForEquipment(state: ResidentState, equipmentId: string) {
  return state.history.flatMap((h) =>
    h.exercises.filter((e) => e.equipmentId === equipmentId).map((e) => ({ at: h.at, ...e })),
  );
}

/** "70 lb × 10" for the heaviest logged set. */
export function bestSetText(sets: SetLog[], unit: "reps" | "sec" = "reps"): string | null {
  const withWeight = sets.filter((s) => s.weight !== undefined);
  const best = withWeight.length
    ? withWeight.reduce((a, b) => ((b.weight ?? 0) > (a.weight ?? 0) ? b : a))
    : sets.find((s) => s.reps !== undefined);
  if (!best) return null;
  const w = best.weight !== undefined ? `${best.weight} lb` : "";
  const r = best.reps !== undefined ? `${best.reps}${unit === "sec" ? " sec" : ""}` : "";
  return [w, r].filter(Boolean).join(" × ");
}

// ── validation ──────────────────────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function parseSets(v: unknown): SetLog[] {
  return Array.isArray(v) ? v.map((s) => (isObj(s) ? clean(s as SetLog) : {})) : [];
}

function validRequest(v: unknown): WorkoutRequest | null {
  if (!isObj(v) || !isGoal(v.goal) || !isLevel(v.level) || !isDuration(v.duration)) return null;
  return { goal: v.goal, level: v.level, duration: v.duration, focus: strList(v.focus).filter(isFocusArea) };
}

function validItem(v: unknown): v is PlanItem {
  return (
    isObj(v) &&
    typeof v.slot === "string" &&
    isObj(v.exercise) &&
    typeof (v.exercise as Exercise).id === "string" &&
    Array.isArray(v.equipment) &&
    (v.equipment as unknown[]).every((e) => isObj(e) && typeof (e as Equipment).id === "string")
  );
}

/** Read stored resident data defensively; anything malformed is dropped. */
export function parseResident(raw: string | null): ResidentState {
  if (!raw) return EMPTY_RESIDENT;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_RESIDENT;
  }
  if (!isObj(data) || data.version !== RESIDENT_VERSION) return EMPTY_RESIDENT;

  let active: ActivePlan | null = null;
  const a = data.active;
  const request = isObj(a) ? validRequest(a.request) : null;
  if (isObj(a) && request && typeof a.id === "string" && Array.isArray(a.items) && a.items.every(validItem)) {
    const logs: Record<string, SetLog[]> = {};
    if (isObj(a.logs)) for (const [k, v] of Object.entries(a.logs)) logs[k] = parseSets(v);
    const fb = isObj(a.feedback) ? a.feedback : null;
    active = {
      id: a.id,
      facilityId: String(a.facilityId ?? ""),
      request,
      createdAt: String(a.createdAt ?? ""),
      shortOfTime: a.shortOfTime === true,
      excludedEquipmentNames: strList(a.excludedEquipmentNames),
      warmup: a.warmup && validItem({ ...(a.warmup as object), slot: "warmup" }) ? (a.warmup as WorkoutItem) : null,
      items: a.items as PlanItem[],
      done: strList(a.done),
      skipped: strList(a.skipped),
      busy: strList(a.busy),
      logs,
      completedAt: typeof a.completedAt === "string" ? a.completedAt : undefined,
      feedback:
        fb && ["yes", "somewhat", "no", "skip"].includes(fb.answer as string)
          ? {
              answer: fb.answer as FeedbackAnswer,
              reasons: strList(fb.reasons).filter((r): r is FeedbackReason => r in feedbackReasonLabels),
              at: String(fb.at ?? ""),
            }
          : undefined,
    };
  }

  const history: HistoryEntry[] = (Array.isArray(data.history) ? data.history : [])
    .filter((h): h is Record<string, unknown> => isObj(h) && typeof h.planId === "string" && Array.isArray(h.exercises))
    .map((h) => ({
      planId: h.planId as string,
      at: String(h.at ?? ""),
      title: String(h.title ?? "Workout"),
      completed: h.completed === true,
      exercises: (h.exercises as unknown[])
        .filter((e): e is Record<string, unknown> => isObj(e) && typeof e.exerciseId === "string")
        .map((e) => ({
          exerciseId: e.exerciseId as string,
          name: String(e.name ?? ""),
          equipmentId: String(e.equipmentId ?? ""),
          equipmentName: String(e.equipmentName ?? ""),
          sets: parseSets(e.sets).filter(hasData),
        })),
    }))
    .slice(0, MAX_HISTORY);

  return { version: RESIDENT_VERSION, active, history };
}

/** Link to the workout page for a request (used by Resume and quick start). */
export function workoutHref(facilitySlug: string, r: WorkoutRequest): string {
  const q = new URLSearchParams({ goal: r.goal, level: r.level, time: String(r.duration) });
  for (const f of r.focus ?? []) q.append("focus", f);
  return `/g/${facilitySlug}/workout?${q.toString()}`;
}
