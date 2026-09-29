"use client";

import { useFacilityState } from "@/lib/demo/client";
import { isUnresolved, serviceBrief } from "@/lib/demo/state";
import type { Equipment, Facility } from "@/types/domain";
import { CopyText } from "./CopyText";

/** The same brief the property team copies from the operator dashboard, for the oldest unresolved report. */
export function DealerServiceBrief({ facility, equipment: seed }: { facility: Facility; equipment: Equipment[] }) {
  const { issues, equipment, hydrated } = useFacilityState(facility.id, seed);
  const issue = [...issues].filter(isUnresolved).sort((a, b) => a.reportedAt.localeCompare(b.reportedAt))[0];
  const eq = issue && equipment.find((e) => e.id === issue.equipmentId);
  if (!issue || !eq) {
    return <p className="text-sm text-muted">No unresolved reports right now. File one from the resident experience to see a brief.</p>;
  }
  const text = serviceBrief(facility, eq, issue);
  return (
    <div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-paper p-4 font-mono text-[12px] leading-relaxed text-ink-3 ring-1 ring-inset ring-line">
        {hydrated ? text : " "}
      </pre>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyText text={text} label="Copy service brief" />
        <span className="text-xs text-muted">Same brief the property team copies from its dashboard.</span>
      </div>
    </div>
  );
}
