import Link from "next/link";
import { notFound } from "next/navigation";
import { EquipmentTile } from "@/components/resident/EquipmentGlyph";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { EquipmentStatusBadge } from "@/components/ui/Badge";
import { getEquipment, getEquipmentWithOpenReports, getFacilityBySlug } from "@/data/repository";
import type { EquipmentZone } from "@/types/domain";

export const metadata = { title: "Equipment" };

const zones: EquipmentZone[] = ["Strength", "Cables", "Free Weights", "Cardio"];

export default async function EquipmentDirectory({
  params,
  searchParams,
}: PageProps<"/g/[facility]/equipment">) {
  const { facility: slug } = await params;
  const facility = getFacilityBySlug(slug);
  if (!facility) notFound();
  const reportMode = (await searchParams).report === "1";
  const equipment = getEquipment(facility.id);
  const reported = getEquipmentWithOpenReports(facility.id);

  return (
    <>
      <ResidentHeader facilityName={facility.propertyName} back={{ href: `/g/${facility.slug}`, label: "Home" }} />
      <ResidentMain>
        <div className="pt-2">
          <p className="eyebrow">{facility.name}</p>
          <h1 className="mt-1.5 text-[26px] font-semibold leading-[1.15] tracking-[-0.025em]">
            {reportMode ? "Which equipment?" : "Equipment in this room"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {reportMode
              ? "Tap the machine that has a problem. We'll attach its details for you."
              : `${equipment.length} pieces mapped by Helios. Tap one for setup and exercises.`}
          </p>
        </div>

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
                      href={
                        reportMode
                          ? `/g/${facility.slug}/report/${e.slug}`
                          : `/g/${facility.slug}/equipment/${e.slug}`
                      }
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
      </ResidentMain>
      <ResidentFooter />
    </>
  );
}
