import { describe, expect, it } from "vitest";
import {
  DEMO_FACILITY_SLUG,
  getEquipment,
  getEquipmentBySlug,
  getFacilityBySlug,
} from "@/data/repository";
import { buildIssueReport, reportReference } from "./client";

describe("issue report flow", () => {
  it("keeps the facility and machine context the page supplied", () => {
    const facility = getFacilityBySlug(DEMO_FACILITY_SLUG)!;
    const machine = getEquipmentBySlug(facility.id, "lat-pulldown")!;
    const report = buildIssueReport({
      facilityId: facility.id,
      equipmentId: machine.id,
      category: "noise",
      description: "  Cable squeaks  ",
    });
    expect(report.facilityId).toBe("fac_solstice_lofts");
    expect(report.equipmentId).toBe("eq_lat_pulldown");
    expect(report.status).toBe("open");
    expect(report.description).toBe("Cable squeaks");
    expect(reportReference(report.id)).toMatch(/^HX-[A-Z0-9]{4}$/);
  });

  it("every machine page / report page URL resolves to real equipment", () => {
    const facility = getFacilityBySlug(DEMO_FACILITY_SLUG)!;
    for (const e of getEquipment(facility.id)) {
      expect(getEquipmentBySlug(facility.id, e.slug)?.id).toBe(e.id);
    }
    expect(getFacilityBySlug("not-a-real-gym")).toBeUndefined();
  });
});
