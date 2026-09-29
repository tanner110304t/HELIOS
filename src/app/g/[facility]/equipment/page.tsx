import { notFound } from "next/navigation";
import { EquipmentList } from "@/components/resident/EquipmentList";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { getEquipment, getFacilityBySlug } from "@/data/repository";

export const metadata = { title: "Equipment" };

export default async function EquipmentDirectory({
  params,
  searchParams,
}: PageProps<"/g/[facility]/equipment">) {
  const { facility: slug } = await params;
  const facility = getFacilityBySlug(slug);
  if (!facility) notFound();
  const reportMode = (await searchParams).report === "1";
  const equipment = getEquipment(facility.id);

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
              : `${equipment.length} equipment entries (${equipment.reduce((a, e) => a + e.quantity, 0)} units). Tap one for setup and exercises.`}
          </p>
          {!reportMode && (
            <p className="mt-1 text-[13px] text-muted">
              &ldquo;In service&rdquo; means it&apos;s working, not whether someone is using it right now.
            </p>
          )}
        </div>

        <EquipmentList
          facilityId={facility.id}
          facilitySlug={facility.slug}
          equipment={equipment}
          reportMode={reportMode}
        />
      </ResidentMain>
      <ResidentFooter />
    </>
  );
}
