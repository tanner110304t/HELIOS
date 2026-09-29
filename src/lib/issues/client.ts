"use client";

import { useCallback, useEffect, useState } from "react";
import type { IssueCategory, IssueReport } from "@/types/domain";
import { mergeIssues } from "./merge";

/**
 * Demo issue reports — browser only, no backend.
 *
 * Reports are saved to this browser's localStorage. The operator dashboard
 * reads the same storage, so a report filed on this laptop (including inside
 * the phone frame on /demo/resident) appears on the dashboard right away.
 * A report filed on a different device stays on that device.
 *
 * In a real pilot this file is where calls to a database (e.g. Postgres) go.
 */

const LOCAL_REPORTS = "helios-demo:reports";
const LOCAL_RESOLVED = "helios-demo:resolved";

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / storage blocked — the confirmation still shows
  }
}

function newReportId() {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `rpt_${rand.slice(0, 12).toLowerCase()}`;
}

/** Short human reference shown to the resident, derived from the id. */
export function reportReference(id: string) {
  return `HX-${id.replace(/^rpt_(seed_)?/, "").slice(0, 4).toUpperCase()}`;
}

/** Build the report record. Equipment + facility context come from the page, never from the resident. */
export function buildIssueReport(input: {
  facilityId: string;
  equipmentId: string;
  category: IssueCategory;
  description?: string;
}): IssueReport {
  return {
    id: newReportId(),
    facilityId: input.facilityId,
    equipmentId: input.equipmentId,
    category: input.category,
    description: input.description?.trim().slice(0, 280) || undefined,
    status: "open",
    reportedAt: new Date().toISOString(),
    source: "live",
  };
}

export function submitIssueReport(input: Parameters<typeof buildIssueReport>[0]): IssueReport {
  const report = buildIssueReport(input);
  writeLocal(LOCAL_REPORTS, [report, ...readLocal<IssueReport[]>(LOCAL_REPORTS, [])].slice(0, 50));
  return report;
}

export function useFacilityIssues(facilityId: string, seeds: IssueReport[]) {
  const [local, setLocal] = useState<{ reports: IssueReport[]; resolvedIds: string[] }>({
    reports: [],
    resolvedIds: [],
  });

  const refresh = useCallback(() => {
    setLocal({
      reports: readLocal<IssueReport[]>(LOCAL_REPORTS, []).filter((r) => r.facilityId === facilityId),
      resolvedIds: readLocal<string[]>(LOCAL_RESOLVED, []),
    });
  }, [facilityId]);

  useEffect(() => {
    // Load once, then stay in sync with other tabs/frames on this browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_REPORTS || e.key === LOCAL_RESOLVED) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const issues = mergeIssues(seeds, [local.reports], local.resolvedIds);

  const resolve = useCallback(
    (id: string) => {
      writeLocal(LOCAL_RESOLVED, [...new Set([...readLocal<string[]>(LOCAL_RESOLVED, []), id])]);
      refresh();
    },
    [refresh],
  );

  const reset = useCallback(() => {
    writeLocal(LOCAL_REPORTS, []);
    writeLocal(LOCAL_RESOLVED, []);
    refresh();
  }, [refresh]);

  return { issues, resolve, reset };
}
