"use client";

import { useState } from "react";
import { setServiceStatus } from "@/lib/demo/client";
import { returnToServiceWarning } from "@/lib/demo/state";
import type { Equipment, IssueReport } from "@/types/domain";
import { Badge, DemoDataBadge } from "@/components/ui/Badge";
import { IconAlert, IconCheck, IconPause } from "@/components/ui/icons";
import { EquipmentTile } from "@/components/resident/EquipmentGlyph";

function StatusCell({ eq, open }: { eq: Equipment; open: number }) {
  if (eq.status === "unavailable")
    return (
      <Badge tone="down">
        <IconPause className="size-3.5" /> Out of service
      </Badge>
    );
  if (open > 0)
    return (
      <Badge tone="warn">
        <IconAlert className="size-3.5" /> Attention
      </Badge>
    );
  return (
    <Badge tone="ok">
      <IconCheck className="size-3.5" /> In service
    </Badge>
  );
}

/** Explicit service control. Returning a machine with unresolved reports needs a second click. */
function ServiceToggle({ facilityId, eq, issues }: { facilityId: string; eq: Equipment; issues: IssueReport[] }) {
  const [confirm, setConfirm] = useState(false);
  const [failed, setFailed] = useState(false);
  const warning = returnToServiceWarning(issues, eq.id);
  if (eq.status === "available") {
    return (
      <button
        type="button"
        onClick={() => setFailed(!setServiceStatus(facilityId, eq.id, "unavailable", "Marked out of service by the property team"))}
        className="rounded-md px-2 py-1 text-xs font-medium text-ink-3 ring-1 ring-inset ring-line hover:bg-paper-2"
        title={eq.quantity > 1 ? `Takes all ${eq.quantity} units out of Helios plans` : undefined}
      >
        {failed ? "Couldn't save" : "Take out"}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => {
          if (warning && !confirm) return setConfirm(true);
          setConfirm(false);
          setFailed(!setServiceStatus(facilityId, eq.id, "available"));
        }}
        className="rounded-md px-2 py-1 text-xs font-medium text-ink ring-1 ring-inset ring-line-strong hover:bg-paper-2"
      >
        {failed ? "Couldn't save" : confirm ? "Return anyway" : "Return to service"}
      </button>
      {confirm && warning && <span className="text-[11px] text-warn">{warning}</span>}
    </span>
  );
}

export function InventoryTable({
  facilityId,
  equipment,
  issues,
  pageViews,
  openCounts,
}: {
  facilityId: string;
  issues: IssueReport[];
  equipment: Equipment[];
  pageViews: Record<string, number>;
  openCounts: Map<string, number>;
}) {
  const units = equipment.reduce((a, e) => a + e.quantity, 0);
  return (
    <section aria-labelledby="inventory" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="inventory" className="text-lg font-semibold tracking-[-0.01em]">
            Digital equipment inventory
          </h2>
          <p className="mt-1 text-sm text-muted">
            {equipment.length} equipment entries · {units} units · the structured version of the room. Service changes
            here update resident pages and new workouts.
          </p>
        </div>
        <DemoDataBadge />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-surface ring-1 ring-inset ring-line shadow-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="px-4 py-3 font-medium">Equipment</th>
              <th scope="col" className="px-4 py-3 font-medium">Category</th>
              <th scope="col" className="px-4 py-3 font-medium">Location</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Helios views</th>
              <th scope="col" className="px-4 py-3 font-medium">Open reports</th>
              <th scope="col" className="px-4 py-3 font-medium">Service</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {equipment.map((e) => {
              const open = openCounts.get(e.id) ?? 0;
              return (
                <tr key={e.id} className="hover:bg-paper/60">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <EquipmentTile kind={e.kind} className="size-9 rounded-lg" />
                      <span>
                        <span className="block font-medium">
                          {e.name}
                          {e.quantity > 1 && <span className="font-normal text-muted"> ×{e.quantity}</span>}
                        </span>
                        <span className="block font-mono text-[11px] text-faint">{e.assetTag}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-ink-3">{e.category}</td>
                  <td className="px-4 py-2.5 text-ink-3">{e.location}</td>
                  <td className="px-4 py-2.5">
                    <StatusCell eq={e} open={open} />
                  </td>
                  <td className="tabular px-4 py-2.5 text-right">{pageViews[e.id] ?? 0}</td>
                  <td className="px-4 py-2.5">
                    {open > 0 ? (
                      <span className="font-medium text-warn">{open} open</span>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <ServiceToggle facilityId={facilityId} eq={e} issues={issues} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
