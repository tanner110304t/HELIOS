import { describe, expect, it } from "vitest";
import { demoEquipment } from "@/data/demoEquipment";
import { getSeedIssues } from "@/data/demoIssues";
import { getAnalyticsSummary, sampleBusyAlternatives, sampleFeedback } from "@/data/demoAnalytics";
import { EMPTY_STATE, sessionSummary, withEvent } from "@/lib/demo/state";
import { headlineMeasures, pctText, ratio, recommendations } from "./insights";

describe("headline measures", () => {
  it("derive every percentage from the counts shown", () => {
    const s = getAnalyticsSummary();
    const m = headlineMeasures({
      generated: s.workoutsGenerated,
      completed: s.workoutsCompleted,
      devices: s.uniqueDevices,
      repeatDevices: s.repeatDevices,
      feedback: sampleFeedback,
    });
    expect(m.completion).toEqual({ num: 148, den: 236, pct: 63 });
    expect(m.repeat).toEqual({ num: 57, den: 118, pct: 48 });
    expect(m.helpful).toEqual({ num: 38, den: 61, pct: 62 });
    expect(m.responseRate.pct).toBe(41);
    // Sample reasons can't exceed the people who could give them.
    const notYes = sampleFeedback.answers.somewhat + sampleFeedback.answers.no;
    for (const n of Object.values(sampleFeedback.reasons)) expect(n).toBeLessThanOrEqual(notYes);
  });

  it("shows 'No data yet' instead of 0% or NaN when nothing has been measured", () => {
    expect(pctText(ratio(0, 0))).toBe("No data yet");
    expect(ratio(0, 0).pct).toBeNull();
  });
});

describe("recommendations", () => {
  const base = {
    feedback: sampleFeedback,
    busyByMachine: sampleBusyAlternatives,
    equipment: demoEquipment,
    now: Date.now(),
    timeAgo: () => "2 hours ago",
  };

  it("names signal, implication and action; labels sample vs live", () => {
    const recs = recommendations({ ...base, issues: getSeedIssues() });
    expect(recs.length).toBeGreaterThanOrEqual(2);
    expect(recs.length).toBeLessThanOrEqual(3);
    expect(recs[0]).toMatchObject({ source: "live" });
    expect(recs[0].signal).toContain("Treadmill #2");
    expect(recs.some((r) => r.source === "sample" && r.signal.includes("Smith Machine"))).toBe(true);
    for (const r of recs) expect(r.signal && r.implication && r.action).toBeTruthy();
  });

  it("drops the live recommendation once every report is acknowledged", () => {
    const acked = getSeedIssues().map((i) => ({ ...i, status: i.status === "open" ? ("acknowledged" as const) : i.status }));
    expect(recommendations({ ...base, issues: acked }).every((r) => r.source === "sample")).toBe(true);
  });
});

describe("demo session counts", () => {
  it("count completion and feedback once per plan", () => {
    let s = EMPTY_STATE;
    const ev = (type: "plan_started" | "plan_completed" | "feedback_submitted", id: string, answer?: "yes" | "no") =>
      ({ id, type, at: "2026-09-28T18:00:00Z", planId: "plan_1", answer });
    s = withEvent(s, ev("plan_started", "e1"));
    s = withEvent(s, ev("plan_completed", "e2"));
    s = withEvent(s, ev("plan_completed", "e3")); // re-complete after an undo
    s = withEvent(s, ev("feedback_submitted", "e4", "no"));
    s = withEvent(s, ev("feedback_submitted", "e5", "yes")); // changed answer
    const sum = sessionSummary(s);
    expect(sum.plansStarted).toBe(1);
    expect(sum.plansCompleted).toBe(1);
    expect(sum.feedback).toEqual({ yes: 1, somewhat: 0, no: 0 });
  });
});
