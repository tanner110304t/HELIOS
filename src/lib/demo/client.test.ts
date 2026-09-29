import { beforeEach, describe, expect, it } from "vitest";
import { buildIssueReport, resetDemo, setServiceStatus, submitIssueReport } from "./client";
import { parseState } from "./state";

function fakeWindow(opts: { failWrites?: boolean } = {}) {
  const data = new Map<string, string>();
  const localStorage = {
    get length() {
      return data.size;
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (opts.failWrites) throw new Error("QuotaExceededError");
      data.set(k, v);
    },
    removeItem: (k: string) => void data.delete(k),
  };
  (globalThis as unknown as { window: unknown }).window = {
    localStorage,
    dispatchEvent: () => true,
  };
  return data;
}

const KEY = "helios-demo:v1:fac_solstice_lofts";
const input = { facilityId: "fac_solstice_lofts", equipmentId: "eq_lat_pulldown", category: "noise" as const };

describe("demo storage in the browser", () => {
  beforeEach(() => void fakeWindow());

  it("keeps the facility and machine context the page supplied", () => {
    const report = buildIssueReport({ ...input, description: "  Cable squeaks  " });
    expect(report).toMatchObject({ facilityId: "fac_solstice_lofts", equipmentId: "eq_lat_pulldown", status: "open", description: "Cable squeaks" });
  });

  it("reports a failed save instead of claiming success", () => {
    fakeWindow({ failWrites: true });
    expect(submitIssueReport(input).saved).toBe(false);
    expect(setServiceStatus("fac_solstice_lofts", "eq_leg_press", "unavailable")).toBe(false);
  });

  it("saves reports and service changes to one versioned record", () => {
    const data = fakeWindow();
    expect(submitIssueReport(input).saved).toBe(true);
    expect(setServiceStatus("fac_solstice_lofts", "eq_lat_pulldown", "unavailable", "Cable frayed")).toBe(true);
    const state = parseState(data.get(KEY)!);
    expect(state.reports).toHaveLength(1);
    expect(state.service.eq_lat_pulldown.status).toBe("unavailable");
  });

  it("recovers from corrupted saved data", () => {
    const data = fakeWindow();
    data.set(KEY, "{not json");
    expect(submitIssueReport(input).saved).toBe(true);
    expect(parseState(data.get(KEY)!).reports).toHaveLength(1);
  });

  it("reset clears every Helios demo key and nothing else", () => {
    const data = fakeWindow();
    submitIssueReport(input);
    data.set("helios-demo:reports", "[]"); // older-format key
    data.set("someone-else", "keep me");
    expect(resetDemo()).toBe(true);
    expect([...data.keys()]).toEqual(["someone-else"]);
  });
});
