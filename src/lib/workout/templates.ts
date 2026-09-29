import type { Duration, Goal, Level, MovementCategory } from "@/types/domain";

/**
 * Workout templates: the ordered movement slots each goal fills, how many
 * exercises fit each session length, and the set/rep prescription.
 *
 * Intentionally simple. The point is that the SAME template produces a
 * different workout in a different room, because slots are filled only from
 * that room's available equipment.
 */

export const goalLabels: Record<Goal, string> = {
  muscle: "Build Muscle",
  strength: "Get Stronger",
  general: "General Fitness",
};

export const levelLabels: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const durations: Duration[] = [20, 30, 45];

export type Prescription = { sets: number; reps: string; rest: string };

type Template = {
  /** Strength slots in priority order; the first N are used. */
  slots: MovementCategory[];
  /** Number of strength exercises per session length. */
  strengthCount: Record<Duration, number>;
  /** Optional conditioning block at the end (minutes per session length). */
  finisherMinutes?: Record<Duration, number>;
  prescription: Record<Level, Prescription>;
  /** Isolation / core work uses lighter rep targets. */
  accessoryReps: string;
};

export const WARMUP_MINUTES = 5;

export const templates: Record<Goal, Template> = {
  muscle: {
    slots: [
      "horizontal-push",
      "vertical-pull",
      "knee-dominant",
      "horizontal-pull",
      "shoulder-isolation",
      "hip-hinge",
      "arms",
    ],
    strengthCount: { 20: 4, 30: 5, 45: 7 },
    prescription: {
      beginner: { sets: 2, reps: "10–12", rest: "60 sec" },
      intermediate: { sets: 3, reps: "8–12", rest: "75 sec" },
      advanced: { sets: 4, reps: "8–12", rest: "90 sec" },
    },
    accessoryReps: "12–15",
  },
  strength: {
    slots: [
      "knee-dominant",
      "horizontal-push",
      "hip-hinge",
      "vertical-pull",
      "vertical-push",
      "horizontal-pull",
    ],
    strengthCount: { 20: 3, 30: 4, 45: 5 },
    prescription: {
      beginner: { sets: 3, reps: "8", rest: "90 sec" },
      intermediate: { sets: 4, reps: "5–6", rest: "2 min" },
      advanced: { sets: 5, reps: "3–5", rest: "2–3 min" },
    },
    accessoryReps: "8–10",
  },
  general: {
    slots: [
      "knee-dominant",
      "horizontal-pull",
      "horizontal-push",
      "core",
      "hip-hinge",
      "vertical-push",
    ],
    strengthCount: { 20: 3, 30: 4, 45: 5 },
    finisherMinutes: { 20: 5, 30: 6, 45: 8 },
    prescription: {
      beginner: { sets: 2, reps: "12", rest: "45 sec" },
      intermediate: { sets: 3, reps: "12", rest: "45 sec" },
      advanced: { sets: 3, reps: "12–15", rest: "30 sec" },
    },
    accessoryReps: "10 each side",
  },
};

export const ACCESSORY_CATEGORIES: MovementCategory[] = [
  "shoulder-isolation",
  "arms",
  "core",
];

export function isGoal(v: unknown): v is Goal {
  return v === "muscle" || v === "strength" || v === "general";
}
export function isLevel(v: unknown): v is Level {
  return v === "beginner" || v === "intermediate" || v === "advanced";
}
export function isDuration(v: unknown): v is Duration {
  return v === 20 || v === 30 || v === 45;
}
