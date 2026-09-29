import type { Duration, FocusArea, Goal, Level, MovementCategory } from "@/types/domain";

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

export const durations: Duration[] = [20, 30, 45, 60, 75, 90];

export const focusLabels: Record<FocusArea, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  legs: "Legs & glutes",
  core: "Core",
};

export const focusAreas = Object.keys(focusLabels) as FocusArea[];

/** Which movement slots train each focus area. */
export const focusCategories: Record<FocusArea, MovementCategory[]> = {
  chest: ["horizontal-push"],
  back: ["vertical-pull", "horizontal-pull"],
  shoulders: ["vertical-push", "shoulder-isolation"],
  arms: ["arms"],
  legs: ["knee-dominant", "hip-hinge"],
  core: ["core"],
};

/** Target prescription; the engine may use fewer sets to fit the chosen length. */
export type Prescription = { sets: number; reps: string; restSeconds: number };

type Template = {
  /** Strength slots in priority order. Longer sessions cycle through them again with new exercises. */
  slots: MovementCategory[];
  /** Most strength exercises per session length (fewer if they won't fit). */
  strengthCount: Record<Duration, number>;
  /** When a plan must shrink: keep sets (fewer exercises) or keep exercises (fewer sets). */
  prefer: "sets" | "exercises";
  /** Optional conditioning block at the end (minutes per session length). */
  finisherMinutes?: Record<Duration, number>;
  prescription: Record<Level, Prescription>;
  /** Isolation / core work uses lighter rep targets. */
  accessoryReps: string;
};

/** Never prescribe fewer than this many sets per exercise. */
export const MIN_SETS = 2;

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
      "vertical-push",
      "core",
    ],
    strengthCount: { 20: 4, 30: 5, 45: 7, 60: 8, 75: 9, 90: 10 },
    prefer: "exercises",
    prescription: {
      beginner: { sets: 2, reps: "10–12", restSeconds: 60 },
      intermediate: { sets: 3, reps: "8–12", restSeconds: 75 },
      advanced: { sets: 4, reps: "8–12", restSeconds: 90 },
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
    strengthCount: { 20: 3, 30: 4, 45: 5, 60: 6, 75: 7, 90: 8 },
    prefer: "sets",
    prescription: {
      beginner: { sets: 3, reps: "8", restSeconds: 90 },
      intermediate: { sets: 4, reps: "5–6", restSeconds: 120 },
      advanced: { sets: 5, reps: "3–5", restSeconds: 150 },
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
    strengthCount: { 20: 3, 30: 4, 45: 5, 60: 6, 75: 7, 90: 8 },
    prefer: "exercises",
    finisherMinutes: { 20: 4, 30: 6, 45: 8, 60: 10, 75: 12, 90: 15 },
    prescription: {
      beginner: { sets: 2, reps: "12", restSeconds: 45 },
      intermediate: { sets: 3, reps: "12", restSeconds: 45 },
      advanced: { sets: 3, reps: "12–15", restSeconds: 30 },
    },
    accessoryReps: "12",
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
  return durations.includes(v as Duration);
}
export function isFocusArea(v: unknown): v is FocusArea {
  return focusAreas.includes(v as FocusArea);
}
