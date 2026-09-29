import { describe, expect, it } from "vitest";
import { demoEquipment } from "@/data/demoEquipment";
import { demoExercises } from "@/data/demoExercises";
import type { Duration, Equipment, Goal, Level } from "@/types/domain";
import { generateWorkout, repsText } from "./generateWorkout";
import { durations as allDurations, focusAreas, focusCategories, templates } from "./templates";
import { strengthSeconds } from "./timeModel";

const goals: Goal[] = ["muscle", "strength", "general"];
const levels: Level[] = ["beginner", "intermediate", "advanced"];
const durations: Duration[] = allDurations;

const room = { equipment: demoEquipment, exercises: demoExercises };

const allCombos = goals.flatMap((goal) =>
  levels.flatMap((level) => durations.map((duration) => ({ goal, level, duration }))),
);

function allUsedEquipment(workout: ReturnType<typeof generateWorkout>): Equipment[] {
  return [
    ...(workout.warmup?.equipment ?? []),
    ...workout.items.flatMap((i) => [...i.equipment, ...i.alternatives.flatMap((a) => a.equipment)]),
  ];
}

describe("generateWorkout", () => {
  it("excludes unavailable equipment (Leg Extension is down in the demo room)", () => {
    const legExtension = demoEquipment.find((e) => e.id === "eq_leg_extension")!;
    expect(legExtension.status).toBe("unavailable");

    for (const request of allCombos) {
      const workout = generateWorkout(request, room);
      const ids = allUsedEquipment(workout).map((e) => e.id);
      expect(ids).not.toContain("eq_leg_extension");
      expect(workout.excludedEquipment.map((e) => e.id)).toContain("eq_leg_extension");
    }
  });

  it("drops an exercise as soon as its machine goes unavailable", () => {
    const request = { goal: "muscle", level: "beginner", duration: 30 } as const;
    const before = generateWorkout(request, room);
    expect(before.items.map((i) => i.exercise.id)).toContain("ex_lat_pulldown");

    const pulldownDown = demoEquipment.map((e) =>
      e.id === "eq_lat_pulldown" ? { ...e, status: "unavailable" as const } : e,
    );
    const after = generateWorkout(request, { equipment: pulldownDown, exercises: demoExercises });
    const ids = allUsedEquipment(after).map((e) => e.id);
    expect(ids).not.toContain("eq_lat_pulldown");
  });

  it("fits every goal/level/length combination inside its time budget", () => {
    for (const request of allCombos) {
      const w = generateWorkout(request, room);
      expect(w.items.length).toBeGreaterThan(0);
      // The estimate is the documented arithmetic, not a separate guess.
      const seconds =
        (w.warmup?.estimatedSeconds ?? 0) + w.items.reduce((a, i) => a + i.estimatedSeconds, 0);
      expect(w.estimatedMinutes).toBe(Math.round(seconds / 60));
      expect(seconds).toBeLessThanOrEqual(request.duration * 60);
      for (const item of w.items.filter((i) => i.kind === "strength")) {
        const rest = templates[request.goal].prescription[request.level].restSeconds;
        expect(item.restSeconds).toBe(rest); // rest is never cut to make time
        expect(item.estimatedSeconds).toBe(strengthSeconds(item.exercise, item.sets!, rest));
        expect(item.sets!).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("gives longer sessions more total work", () => {
    for (const goal of goals) {
      for (const level of levels) {
        const work = durations.map((duration) =>
          generateWorkout({ goal, level, duration }, room)
            .items.filter((i) => i.kind === "strength")
            .reduce((a, i) => a + i.sets!, 0),
        );
        expect(work[0]).toBeLessThan(work[1]);
        expect(work[1]).toBeLessThan(work[2]);
      }
    }
  });

  it("keeps a focused plan to the chosen body areas", () => {
    for (const area of focusAreas) {
      for (const level of levels) {
        const w = generateWorkout({ goal: "muscle", level, duration: 45, focus: [area] }, room);
        const strength = w.items.filter((i) => i.kind === "strength");
        expect(strength.length).toBeGreaterThan(0);
        for (const item of strength) {
          expect(focusCategories[area]).toContain(item.exercise.movementCategory);
          for (const alt of item.alternatives) {
            expect(focusCategories[area]).toContain(alt.exercise.movementCategory);
          }
        }
        expect(w.estimatedMinutes).toBeLessThanOrEqual(45);
      }
    }
  });

  it("says when a narrow focus can't fill a long session instead of padding it", () => {
    const w = generateWorkout({ goal: "muscle", level: "beginner", duration: 90, focus: ["core"] }, room);
    expect(w.shortOfTime).toBe(true);
    expect(w.estimatedMinutes).toBeLessThan(90 * 0.75);
    const full = generateWorkout({ goal: "muscle", level: "intermediate", duration: 90 }, room);
    expect(full.shortOfTime).toBe(false);
  });

  it("describes one-sided and carry exercises correctly", () => {
    const w = generateWorkout({ goal: "muscle", level: "intermediate", duration: 30 }, room);
    const row = w.items.find((i) => i.exercise.id === "ex_one_arm_db_row");
    expect(row?.reps).toBe("8–12 reps each side");
    const carry = demoExercises.find((e) => e.id === "ex_farmer_carry")!;
    expect(repsText(carry, "12")).toBe("30–40 sec walk");
  });

  it("returns an honest empty plan when the room can't support one", () => {
    const allDown = demoEquipment.map((e) => ({ ...e, status: "unavailable" as const }));
    const w = generateWorkout(
      { goal: "muscle", level: "beginner", duration: 30 },
      { equipment: allDown, exercises: demoExercises },
    );
    expect(w.items).toHaveLength(0);
    expect(w.warmup).toBeNull();
    expect(w.estimatedMinutes).toBe(0);
  });

  it("only uses equipment that is in this room and available", () => {
    const availableIds = new Set(
      demoEquipment.filter((e) => e.status === "available").map((e) => e.id),
    );
    for (const request of allCombos) {
      const workout = generateWorkout(request, room);
      expect(workout.items.length).toBeGreaterThan(0);
      for (const eq of allUsedEquipment(workout)) {
        expect(availableIds.has(eq.id)).toBe(true);
      }
    }
  });

  it("never gives beginners intermediate or advanced exercises", () => {
    for (const goal of goals) {
      for (const duration of durations) {
        const workout = generateWorkout({ goal, level: "beginner", duration }, room);
        const options = [
          ...workout.items,
          ...workout.items.flatMap((i) => i.alternatives),
          ...(workout.warmup ? [workout.warmup] : []),
        ];
        for (const o of options) expect(o.exercise.difficulty).toBe("beginner");
      }
    }
  });

  it("builds a different workout in a smaller room from the same template", () => {
    const request = { goal: "muscle", level: "intermediate", duration: 30 } as const;
    const full = generateWorkout(request, room);
    const smallRoom = demoEquipment.filter((e) =>
      ["eq_dumbbells", "eq_benches", "eq_bikes"].includes(e.id),
    );
    const small = generateWorkout(request, { equipment: smallRoom, exercises: demoExercises });
    for (const item of small.items) {
      for (const eq of item.equipment) {
        expect(["eq_dumbbells", "eq_benches", "eq_bikes"]).toContain(eq.id);
      }
    }
    expect(small.items.map((i) => i.exercise.id)).not.toEqual(full.items.map((i) => i.exercise.id));
  });

  it("is deterministic and never repeats an exercise", () => {
    for (const request of allCombos) {
      const a = generateWorkout(request, room);
      const b = generateWorkout(request, room);
      expect(a.items.map((i) => i.exercise.id)).toEqual(b.items.map((i) => i.exercise.id));
      const ids = a.items.map((i) => i.exercise.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const item of a.items) {
        for (const alt of item.alternatives) expect(ids).not.toContain(alt.exercise.id);
      }
    }
  });
});
