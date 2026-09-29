import { describe, expect, it } from "vitest";
import { demoEquipment } from "@/data/demoEquipment";
import { demoExercises } from "@/data/demoExercises";
import { demoFacility } from "@/data/demoFacility";
import { getSeedIssues } from "@/data/demoIssues";
import { DEMO_FACILITY_SLUG, getEquipment, getEquipmentBySlug, getFacilityBySlug } from "@/data/repository";
import { generateWorkout } from "@/lib/workout/generateWorkout";
import type { IssueReport } from "@/types/domain";
import {
  EMPTY_STATE,
  currentIssueFor,
  effectiveEquipment,
  effectiveIssues,
  parseState,
  returnToServiceWarning,
  serviceBrief,
  unresolvedFor,
  withIssueStatus,
  withReport,
  withService,
} from "./state";

const T = "2026-09-28T18:00:00.000Z";
const seeds = getSeedIssues(Date.parse(T));
const live = (id: string, equipmentId = "eq_lat_pulldown", minutesAgo = 5): IssueReport => ({
  id,
  facilityId: demoFacility.id,
  equipmentId,
  category: "noise",
  status: "open",
  reportedAt: new Date(Date.parse(T) - minutesAgo * 60_000).toISOString(),
  source: "live",
});

describe("issue lifecycle", () => {
  it("moves Reported → Acknowledged → Resolved with timestamps and a resident update", () => {
    let s = withReport(EMPTY_STATE, live("rpt_abc123"));
    let issue = effectiveIssues(seeds, s).find((i) => i.id === "rpt_abc123")!;
    expect(issue.status).toBe("open");

    s = withIssueStatus(s, issue, "acknowledged", "2026-09-28T18:10:00.000Z", "Checking it today.");
    issue = effectiveIssues(seeds, s).find((i) => i.id === "rpt_abc123")!;
    expect(issue).toMatchObject({ status: "acknowledged", acknowledgedAt: "2026-09-28T18:10:00.000Z", update: "Checking it today." });

    s = withIssueStatus(s, issue, "resolved", "2026-09-28T19:00:00.000Z");
    issue = effectiveIssues(seeds, s).find((i) => i.id === "rpt_abc123")!;
    expect(issue.status).toBe("resolved");
    expect(issue.acknowledgedAt).toBe("2026-09-28T18:10:00.000Z"); // kept
    expect(issue.resolvedAt).toBe("2026-09-28T19:00:00.000Z");
    expect(issue.update).toBe("Checking it today."); // kept unless replaced
  });

  it("works on seeded reports too, and a report never changes the machine's service status", () => {
    const treadmill = seeds.find((i) => i.equipmentId === "eq_treadmill_2")!;
    const s = withIssueStatus(EMPTY_STATE, treadmill, "resolved", T);
    expect(effectiveIssues(seeds, s).find((i) => i.id === treadmill.id)!.status).toBe("resolved");
    const eq = effectiveEquipment(demoEquipment, s).find((e) => e.id === "eq_treadmill_2")!;
    expect(eq.status).toBe("available");
  });

  it("tracks several reports on one machine, and warns before returning it to service", () => {
    let s = withReport(EMPTY_STATE, live("rpt_one111", "eq_leg_press", 10));
    s = withReport(s, live("rpt_two222", "eq_leg_press", 2));
    s = withService(s, "eq_leg_press", "unavailable", T, "Cable frayed");
    let issues = effectiveIssues(seeds, s);
    expect(unresolvedFor(issues, "eq_leg_press")).toHaveLength(2);
    expect(currentIssueFor(issues, "eq_leg_press")!.id).toBe("rpt_two222"); // newest unresolved

    s = withIssueStatus(s, issues.find((i) => i.id === "rpt_two222")!, "resolved", T);
    issues = effectiveIssues(seeds, s);
    expect(returnToServiceWarning(issues, "eq_leg_press")).toBe("1 unresolved report on this machine.");
    // Resolving didn't put it back in service.
    expect(effectiveEquipment(demoEquipment, s).find((e) => e.id === "eq_leg_press")!.status).toBe("unavailable");

    s = withIssueStatus(s, issues.find((i) => i.id === "rpt_one111")!, "resolved", T);
    expect(returnToServiceWarning(effectiveIssues(seeds, s), "eq_leg_press")).toBeNull();
  });
});

describe("service status", () => {
  it("drives what residents see AND what new workouts may use", () => {
    const s = withService(EMPTY_STATE, "eq_lat_pulldown", "unavailable", T, "Cable frayed");
    const equipment = effectiveEquipment(demoEquipment, s);
    const pulldown = equipment.find((e) => e.id === "eq_lat_pulldown")!;
    expect(pulldown).toMatchObject({ status: "unavailable", statusReason: "Cable frayed" });

    const w = generateWorkout({ goal: "muscle", level: "beginner", duration: 45 }, { equipment, exercises: demoExercises });
    const used = w.items.flatMap((i) => [...i.equipment, ...i.alternatives.flatMap((a) => a.equipment)]);
    expect(used.map((e) => e.id)).not.toContain("eq_lat_pulldown");
  });

  it("can return a seeded out-of-service machine to service", () => {
    const s = withService(EMPTY_STATE, "eq_leg_extension", "available", T);
    const eq = effectiveEquipment(demoEquipment, s).find((e) => e.id === "eq_leg_extension")!;
    expect(eq.status).toBe("available");
    expect(eq.statusReason).toBeUndefined();
  });
});

describe("stored data", () => {
  it("ignores corrupt, old-version or wrong-shape data instead of trusting it", () => {
    expect(parseState("{not json")).toBe(EMPTY_STATE);
    expect(parseState(JSON.stringify({ version: 0, reports: [] }))).toBe(EMPTY_STATE);
    const mixed = parseState(
      JSON.stringify({
        version: 1,
        reports: [live("rpt_good01"), { id: 5 }, { ...live("rpt_badcat"), category: "hack" }],
        issueChanges: { rpt_x: { status: "exploded" }, rpt_y: { status: "resolved", resolvedAt: T } },
        service: { eq_a: { status: "broken", changedAt: T }, eq_b: { status: "unavailable", changedAt: T } },
      }),
    );
    expect(mixed.reports.map((r) => r.id)).toEqual(["rpt_good01"]);
    expect(Object.keys(mixed.issueChanges)).toEqual(["rpt_y"]);
    expect(Object.keys(mixed.service)).toEqual(["eq_b"]);
  });
});

describe("service brief", () => {
  it("carries facility, machine, location, issue, time, reference and status", () => {
    const eq = demoEquipment.find((e) => e.id === "eq_treadmill_2")!;
    const issue = seeds.find((i) => i.equipmentId === eq.id)!;
    const brief = serviceBrief(demoFacility, eq, issue);
    for (const part of ["Solstice Lofts Fitness Center", "Treadmill #2", "SL-FC-013", "Cardio row", "Unusual noise", "HX-1042", "Reported"]) {
      expect(brief).toContain(part);
    }
  });
});

describe("routing", () => {
  it("every machine page / report page URL resolves to real equipment", () => {
    const facility = getFacilityBySlug(DEMO_FACILITY_SLUG)!;
    for (const e of getEquipment(facility.id)) {
      expect(getEquipmentBySlug(facility.id, e.slug)?.id).toBe(e.id);
    }
    expect(getFacilityBySlug("not-a-real-gym")).toBeUndefined();
  });
});
