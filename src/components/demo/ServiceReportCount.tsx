"use client";

import { useFacilityIssues } from "@/lib/issues/client";
import type { IssueReport } from "@/types/domain";

/** Live count of reports that arrived with machine context (seeded + submitted in demos). */
export function ServiceReportCount({ facilityId, seeds }: { facilityId: string; seeds: IssueReport[] }) {
  const { issues } = useFacilityIssues(facilityId, seeds);
  const open = issues.filter((i) => i.status === "open").length;
  return (
    <>
      <p className="tabular mt-3 text-[28px] font-semibold leading-none tracking-[-0.03em]">{issues.length}</p>
      <p className="mt-2 text-sm text-ink-3">equipment reports routed with machine context</p>
      <p className="mt-0.5 text-xs text-muted">{open} open · includes reports sent during this demo</p>
    </>
  );
}
