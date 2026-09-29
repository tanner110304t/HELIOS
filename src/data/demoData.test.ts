import { describe, expect, it } from "vitest";
import { equipmentPageViews, getAnalyticsSummary, durationMix, goalMix } from "@/data/demoAnalytics";
import { demoEquipment } from "@/data/demoEquipment";
import { demoExercises } from "@/data/demoExercises";
import { getSeedIssues } from "@/data/demoIssues";

describe("demo data consistency", () => {
  it("has page-view numbers for every piece of equipment and nothing else", () => {
    expect(Object.keys(equipmentPageViews).sort()).toEqual(demoEquipment.map((e) => e.id).sort());
  });

  it("keeps metrics internally consistent and restrained", () => {
    const s = getAnalyticsSummary();
    expect(s.workoutsCompleted).toBeLessThanOrEqual(s.workoutsGenerated);
    expect(s.workoutsGenerated).toBeLessThanOrEqual(s.heliosVisits);
    expect(s.repeatDevices).toBeLessThanOrEqual(s.uniqueDevices);
    expect(s.uniqueDevices).toBeLessThan(284); // fewer devices than apartments
    expect(durationMix.reduce((a, b) => a + b.share, 0)).toBe(100);
    expect(goalMix.reduce((a, b) => a + b.share, 0)).toBe(100);
  });

  it("references only real equipment from exercises and issues", () => {
    const ids = new Set(demoEquipment.map((e) => e.id));
    for (const ex of demoExercises) {
      for (const id of [...ex.equipmentIds, ...(ex.anyOfEquipmentIds ?? [])]) {
        expect(ids.has(id), `${ex.id} → ${id}`).toBe(true);
      }
    }
    for (const issue of getSeedIssues()) expect(ids.has(issue.equipmentId)).toBe(true);
  });

  it("has unique equipment slugs", () => {
    const slugs = demoEquipment.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
