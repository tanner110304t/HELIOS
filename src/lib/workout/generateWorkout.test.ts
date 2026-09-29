import { describe, expect, it } from "vitest";
import { demoEquipment } from "@/data/demoEquipment";
import { demoExercises } from "@/data/demoExercises";
import type { Duration, Equipment, Goal, Level } from "@/types/domain";
import { generateWorkout } from "./generateWorkout";

const goals: Goal[] = ["muscle", "strength", "general"];
const levels: Level[] = ["beginner", "intermediate", "advanced"];
const durations: Duration[] = [20, 30, 45];

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

  it("returns more exercises for longer sessions", () => {
    for (const goal of goals) {
      for (const level of levels) {
        const counts = durations.map(
          (duration) => generateWorkout({ goal, level, duration }, room).items.length,
        );
        expect(counts[0]).toBeLessThan(counts[1]);
        expect(counts[1]).toBeLessThan(counts[2]);
      }
    }
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
