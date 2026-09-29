import { describe, expect, it } from "vitest";
import { getSeedIssues } from "@/data/demoIssues";
import type { IssueReport } from "@/types/domain";
import { mergeIssues, openIssueCountByEquipment } from "./merge";

const live = (id: string, minutesAgo = 0): IssueReport => ({
  id,
  facilityId: "fac_solstice_lofts",
  equipmentId: "eq_lat_pulldown",
  category: "noise",
  status: "open",
  reportedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  source: "live",
});

describe("mergeIssues", () => {
  it("shows a live report once even if both the server and this browser have it", () => {
    const report = live("rpt_abc123");
    const merged = mergeIssues(getSeedIssues(), [[report], [report]], []);
    expect(merged.filter((r) => r.id === "rpt_abc123")).toHaveLength(1);
    expect(merged[0].id).toBe("rpt_abc123"); // newest first
  });

  it("applies resolutions and updates open counts", () => {
    const merged = mergeIssues(getSeedIssues(), [[live("rpt_abc123")]], ["rpt_seed_1042"]);
    expect(merged.find((r) => r.id === "rpt_seed_1042")?.status).toBe("resolved");
    const counts = openIssueCountByEquipment(merged);
    expect(counts.get("eq_treadmill_2")).toBeUndefined();
    expect(counts.get("eq_lat_pulldown")).toBe(1);
  });
});
