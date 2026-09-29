"use client";

import Link from "next/link";
import { useFacilityState } from "@/lib/demo/client";
import { isUnresolved } from "@/lib/demo/state";
import type { Equipment, EquipmentZone } from "@/types/domain";
import { EquipmentStatusBadge } from "@/components/ui/Badge";
import { EquipmentTile } from "./EquipmentGlyph";

const zones: EquipmentZone[] = ["Strength", "Cables", "Free Weights", "Cardio"];

/** Equipment grouped by zone, with the same service status the property team sets. */
export function EquipmentList({
  facilityId,
  facilitySlug,
  equipment: seedEquipment,
  reportMode,
}: {
  facilityId: string;
  facilitySlug: string;
  equipment: Equipment[];
  reportMode: boolean;
}) {
  const { equipment, issues } = useFacilityState(facilityId, seedEquipment);
  const reported = new Set(issues.filter(isUnresolved).map((i) => i.equipmentId));

  return (
    <>
      {zones.map((zone) => {
        const items = equipment.filter((e) => e.zone === zone);
        if (items.length === 0) return null;
        return (
          <section key={zone} className="mt-7" aria-labelledby={`zone-${zone}`}>
            <h2 id={`zone-${zone}`} className="eyebrow mb-2.5">
              {zone}
            </h2>
            <ul className="space-y-2">
              {items.map((e) => (
                <li key={e.id}>
                  <Link
                    href={reportMode ? `/g/${facilitySlug}/report/${e.slug}` : `/g/${facilitySlug}/equipment/${e.slug}`}
                    className="flex items-center gap-3.5 rounded-2xl bg-surface p-3 ring-1 ring-inset ring-line shadow-card transition hover:ring-line-strong"
                  >
                    <EquipmentTile kind={e.kind} className="size-14" dimmed={e.status !== "available"} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium leading-snug">
                        {e.name}
                        {e.quantity > 1 && <span className="font-normal text-muted"> ×{e.quantity}</span>}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-muted">{e.category}</span>
                      <span className="mt-1.5 block">
                        <EquipmentStatusBadge status={e.status} attention={reported.has(e.id)} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
