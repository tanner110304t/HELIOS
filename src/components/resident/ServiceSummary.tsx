"use client";

import { useFacilityState } from "@/lib/demo/client";
import type { Equipment } from "@/types/domain";

/** One line on the welcome screen: what's out of service right now, per the property team. */
export function ServiceSummary({ facilityId, equipment: seed }: { facilityId: string; equipment: Equipment[] }) {
  const { equipment } = useFacilityState(facilityId, seed);
  const out = equipment.filter((e) => e.status !== "available").map((e) => e.name);
  return (
    <p className="mt-2 flex items-start gap-2 text-sm text-muted">
      <span className={`mt-1.5 inline-block size-1.5 shrink-0 rounded-full ${out.length ? "bg-warn" : "bg-ok"}`} aria-hidden />
      {out.length === 0
        ? "All equipment is marked in service."
        : `${out.join(", ")} ${out.length === 1 ? "is" : "are"} marked out of service. Everything else is in service.`}
    </p>
  );
}
