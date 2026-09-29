import type { Duration, Goal } from "@/types/domain";

/**
 * DEMO DATA — fictional Helios engagement for one 284-unit property, last 30 days.
 *
 * These count only activity inside Helios (QR sessions, workouts built and
 * checked off, machine pages opened). They say nothing about total gym
 * visits, occupancy, or resident outcomes. Totals are derived from the
 * weekly/per-item series below so the numbers always agree with each other.
 */

export const analyticsWindowLabel = "Last 30 days";

export type WeeklyEngagement = {
  label: string;
  heliosVisits: number;
  workoutsGenerated: number;
  workoutsCompleted: number;
};

export const weeklyEngagement: WeeklyEngagement[] = [
  { label: "Aug 31", heliosVisits: 86, workoutsGenerated: 48, workoutsCompleted: 29 },
  { label: "Sep 7", heliosVisits: 97, workoutsGenerated: 55, workoutsCompleted: 35 },
  { label: "Sep 14", heliosVisits: 108, workoutsGenerated: 61, workoutsCompleted: 38 },
  { label: "Sep 21", heliosVisits: 121, workoutsGenerated: 72, workoutsCompleted: 46 },
];

export const deviceStats = {
  /** Distinct browsers that opened Helios (anonymous; no login). */
  uniqueDevices: 118,
  /** Of those, how many came back on 2+ separate days. */
  repeatDevices: 57,
};

/** Share of generated workouts by selected length (percent, sums to 100). */
export const durationMix: { duration: Duration; share: number }[] = [
  { duration: 20, share: 31 },
  { duration: 30, share: 46 },
  { duration: 45, share: 23 },
];

/** Share of generated workouts by selected goal (percent, sums to 100). */
export const goalMix: { goal: Goal; share: number }[] = [
  { goal: "general", share: 44 },
  { goal: "muscle", share: 38 },
  { goal: "strength", share: 18 },
];

/** Helios machine-page views per equipment item. */
export const equipmentPageViews: Record<string, number> = {
  eq_smith: 31,
  eq_lat_pulldown: 38,
  eq_seated_row: 27,
  eq_functional_trainer: 29,
  eq_leg_press: 34,
  eq_leg_curl: 14,
  eq_leg_extension: 19,
  eq_chest_press: 26,
  eq_shoulder_press: 17,
  eq_benches: 22,
  eq_dumbbells: 42,
  eq_treadmill_1: 12,
  eq_treadmill_2: 9,
  eq_ellipticals: 11,
  eq_bikes: 13,
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function getAnalyticsSummary() {
  const heliosVisits = sum(weeklyEngagement.map((w) => w.heliosVisits));
  const workoutsGenerated = sum(weeklyEngagement.map((w) => w.workoutsGenerated));
  const workoutsCompleted = sum(weeklyEngagement.map((w) => w.workoutsCompleted));
  return {
    heliosVisits,
    workoutsGenerated,
    workoutsCompleted,
    completionRate: Math.round((workoutsCompleted / workoutsGenerated) * 100),
    uniqueDevices: deviceStats.uniqueDevices,
    repeatDevices: deviceStats.repeatDevices,
    equipmentPageViews: sum(Object.values(equipmentPageViews)),
  };
}
