import { describe, expect, it } from "vitest";
import { demoEquipment } from "@/data/demoEquipment";
import { demoExercises } from "@/data/demoExercises";
import { generateWorkout } from "@/lib/workout/generateWorkout";
import * as R from "./resident";

const room = { equipment: demoEquipment, exercises: demoExercises };
const T = "2026-09-28T18:00:00.000Z";
const workout = generateWorkout({ goal: "muscle", level: "intermediate", duration: 30 }, room);
const fresh = () => R.newActivePlan(workout, "fac_solstice_lofts", "plan_a", T);

describe("active plan", () => {
  it("resumes by settings, not by URL order", () => {
    expect(R.requestKey({ goal: "muscle", level: "beginner", duration: 30, focus: ["back", "chest"] })).toBe(
      R.requestKey({ goal: "muscle", level: "beginner", duration: 30, focus: ["chest", "back"] }),
    );
  });

  it("completes once every step is done or skipped, and un-checking undoes it", () => {
    let p = fresh();
    for (const key of R.steps(p).slice(0, -1)) p = R.toggleDone(p, key, T);
    expect(R.isComplete(p)).toBe(false);
    const last = R.steps(p).at(-1)!;
    p = R.skipItem(p, last, T);
    expect(R.isComplete(p)).toBe(true);
    expect(p.completedAt).toBe(T);
    p = R.toggleDone(p, "warmup", "2026-09-28T19:00:00.000Z");
    expect(R.isComplete(p)).toBe(false);
    expect(p.completedAt).toBeUndefined();
  });

  it("a plan with only skips is not 'complete'", () => {
    let p = fresh();
    for (const key of R.steps(p)) p = key === "warmup" ? R.toggleDone(p, key, T) : R.skipItem(p, key, T);
    expect(R.isComplete(p)).toBe(false);
  });

  it("swapping clears that slot's check-off and logged sets, and successive swaps never duplicate", () => {
    let p = fresh();
    const slot = p.items[0].slot;
    p = R.toggleDone(p, slot, T);
    p = R.logSet(p, slot, 0, { weight: 95, reps: 10 });
    const ctx = () => ({
      exercises: demoExercises,
      equipment: demoEquipment,
      level: p.request.level,
      busy: p.busy,
      selectedIds: new Set(p.items.filter((i) => i.slot !== slot).map((i) => i.exercise.id)),
    });
    const opts = R.optionsFor(p.items[0], ctx());
    p = R.swapItem(p, slot, opts[0]);
    expect(p.done).not.toContain(slot);
    expect(p.logs[slot]).toBeUndefined();
    for (let n = 0; n < 4; n++) {
      const o = R.optionsFor(p.items[0], ctx());
      if (o.length) p = R.swapItem(p, slot, o[0]);
      const ids = p.items.map((i) => i.exercise.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("'machine busy' options never use that machine, while 'try another' can", () => {
    const smithPlan = R.newActivePlan(
      generateWorkout({ goal: "muscle", level: "advanced", duration: 30 }, room),
      "fac_solstice_lofts",
      "plan_b",
      T,
    );
    const item = smithPlan.items.find((i) => i.exercise.equipmentIds[0] === "eq_smith")!;
    expect(item).toBeDefined();
    const base = { exercises: demoExercises, equipment: demoEquipment, level: "advanced" as const, selectedIds: new Set<string>() };
    const normal = R.optionsFor(item, { ...base, busy: [] });
    expect(normal.some((o) => o.equipment.some((e) => e.id === "eq_smith"))).toBe(true);
    const busy = R.optionsFor(item, { ...base, busy: ["eq_smith"] });
    expect(busy.length).toBeGreaterThan(0);
    for (const o of busy) expect(o.equipment.map((e) => e.id)).not.toContain("eq_smith");
  });

  it("offers nothing (so the UI can offer skip / do it later) when no alternative exists", () => {
    const onlySmith = demoEquipment.map((e) => (["eq_smith", "eq_benches"].includes(e.id) ? e : { ...e, status: "unavailable" as const }));
    const item = fresh().items.find((i) => i.exercise.equipmentIds[0] === "eq_smith")!;
    const o = R.optionsFor(item, { exercises: demoExercises, equipment: onlySmith, level: "intermediate", busy: ["eq_smith"], selectedIds: new Set() });
    expect(o).toHaveLength(0);
    const p = R.moveToEnd(fresh(), item.slot);
    expect(p.items.at(-1)!.slot).toBe(item.slot);
  });
});

describe("weight log and history", () => {
  it("ignores nonsense input and keeps sensible numbers", () => {
    let p = fresh();
    const slot = p.items[0].slot;
    p = R.logSet(p, slot, 1, { weight: 72.44, reps: 10 });
    p = R.logSet(p, slot, 2, { weight: -5, reps: Number.NaN });
    expect(p.logs[slot]).toEqual([{}, { weight: 72.4, reps: 10 }, {}]);
  });

  it("shows last time from earlier sessions only, and archives idempotently", () => {
    let s: R.ResidentState = { ...R.EMPTY_RESIDENT, active: fresh() };
    const slot = s.active!.items[0].slot;
    const exerciseId = s.active!.items[0].exercise.id;
    s = { ...s, active: R.logSet(s.active!, slot, 0, { weight: 95, reps: 8 }) };
    s = R.archive(s, T);
    s = R.archive(s, T); // twice → still one entry
    expect(s.history).toHaveLength(1);
    expect(R.lastTime(s, exerciseId, "plan_a")).toBeNull(); // current session isn't "last time"
    expect(R.lastTime(s, exerciseId, "plan_next")?.sets[0]).toEqual({ weight: 95, reps: 8 });
    const eqId = s.active!.items[0].equipment[0].id;
    expect(R.historyForEquipment(s, eqId)[0].name).toBe(s.active!.items[0].exercise.name);
    expect(R.bestSetText([{ weight: 90, reps: 10 }, { weight: 100, reps: 6 }])).toBe("100 lb × 6");
  });

  it("round-trips through storage and rejects corrupt data", () => {
    let s: R.ResidentState = { ...R.EMPTY_RESIDENT, active: R.logSet(fresh(), "s1", 0, { weight: 50, reps: 12 }) };
    s = R.archive(s, T);
    const back = R.parseResident(JSON.stringify(s));
    expect(back.active?.items).toHaveLength(s.active!.items.length);
    expect(back.history[0].exercises[0].sets[0]).toEqual({ weight: 50, reps: 12 });
    expect(R.parseResident("{oops")).toBe(R.EMPTY_RESIDENT);
    expect(R.parseResident(JSON.stringify({ version: 1, active: { id: "x", items: [{ nope: 1 }] }, history: "no" })).active).toBeNull();
  });
});
