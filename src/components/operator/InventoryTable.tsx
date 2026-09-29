import type { Equipment } from "@/types/domain";
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
      <IconCheck className="size-3.5" /> Available
    </Badge>
  );
}

export function InventoryTable({
  equipment,
  pageViews,
  openCounts,
}: {
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
            {equipment.length} mapped items · {units} units · the structured version of the room
          </p>
        </div>
        <DemoDataBadge />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-surface ring-1 ring-inset ring-line shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="px-4 py-3 font-medium">Equipment</th>
              <th scope="col" className="px-4 py-3 font-medium">Category</th>
              <th scope="col" className="px-4 py-3 font-medium">Location</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Helios views</th>
              <th scope="col" className="px-4 py-3 font-medium">Open issues</th>
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
                      <span className="text-faint">None</span>
                    )}
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
