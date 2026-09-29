import { notFound } from "next/navigation";
import { ReportForm } from "@/components/resident/ReportForm";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { getEquipment, getEquipmentBySlug, getFacilityBySlug, listFacilities } from "@/data/repository";

export const dynamicParams = false;
export const metadata = { title: "Report a problem" };

export function generateStaticParams() {
  return listFacilities().flatMap((f) =>
    getEquipment(f.id).map((e) => ({ facility: f.slug, equipment: e.slug })),
  );
}

export default async function ReportPage({ params }: PageProps<"/g/[facility]/report/[equipment]">) {
  const { facility: fSlug, equipment: eSlug } = await params;
  const facility = getFacilityBySlug(fSlug);
  if (!facility) notFound();
  const eq = getEquipmentBySlug(facility.id, eSlug);
  if (!eq) notFound();

  return (
    <>
      <ResidentHeader
        facilityName={facility.propertyName}
        back={{ href: `/g/${facility.slug}/equipment/${eq.slug}`, label: eq.name }}
      />
      <ResidentMain>
        <ReportForm facility={facility} equipment={eq} />
      </ResidentMain>
      <ResidentFooter />
    </>
  );
}
