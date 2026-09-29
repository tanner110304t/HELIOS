import type { Duration, Exercise } from "@/types/domain";

/**
 * Simple, documented time estimates for demo plans.
 *
 * These are planning assumptions, not measurements. People move at different
 * speeds; the UI shows an *estimated* length.
 *
 *   strength exercise = sets × work time
 *                     + (sets − 1) × rest        ← no rest after the last set
 *                     + one transition           ← walk over, set up the machine
 *   cardio item       = its minutes
 */

/** Seconds of work in one set, by prescription format. */
export const WORK_SECONDS = {
  reps: 40,
  "each-side": 70, // both sides back to back
  carry: 40,
} as const;

/** Moving to the next station and setting it up. */
export const TRANSITION_SECONDS = 60;

/** Warm-up: shorter in a 20-minute session so there is time to train, longer in long sessions. */
export function warmupMinutes(duration: Duration): number {
  if (duration === 20) return 3;
  return duration >= 60 ? 8 : 5;
}

export function formatOf(exercise: Exercise): keyof typeof WORK_SECONDS {
  return exercise.format ?? "reps";
}

export function strengthSeconds(exercise: Exercise, sets: number, restSeconds: number): number {
  return sets * WORK_SECONDS[formatOf(exercise)] + (sets - 1) * restSeconds + TRANSITION_SECONDS;
}

export function formatRest(seconds: number): string {
  if (seconds < 120) return `${seconds} sec`;
  const min = seconds / 60;
  return Number.isInteger(min) ? `${min} min` : `${Math.floor(min)}½ min`;
}
