"use client";

import { useFacilityState } from "@/lib/demo/client";
import { isUnresolved } from "@/lib/demo/state";
import type { Equipment } from "@/types/domain";

/** Reports captured with machine context (seeded + filed in this browser). */
export function ServiceReportCount({ facilityId, equipment }: { facilityId: string; equipment: Equipment[] }) {
  const { issues } = useFacilityState(facilityId, equipment);
  const open = issues.filter(isUnresolved).length;
  return (
    <>
      <p className="tabular mt-3 text-[28px] font-semibold leading-none tracking-[-0.03em]">{issues.length}</p>
      <p className="mt-2 text-sm text-ink-3">equipment reports captured with machine context</p>
      <p className="mt-0.5 text-xs text-muted">{open} unresolved · includes reports filed in this browser</p>
    </>
  );
}
