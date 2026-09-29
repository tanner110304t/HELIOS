import { notFound } from "next/navigation";
import { HistoryList } from "@/components/resident/History";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { getFacilityBySlug } from "@/data/repository";

export const metadata = { title: "My history" };

export default async function HistoryPage({ params }: PageProps<"/g/[facility]/history">) {
  const { facility: slug } = await params;
  const facility = getFacilityBySlug(slug);
  if (!facility) notFound();
  return (
    <>
      <ResidentHeader facilityName={facility.propertyName} back={{ href: `/g/${facility.slug}`, label: "Home" }} />
      <ResidentMain>
        <div className="pt-2">
          <p className="eyebrow">{facility.name}</p>
          <h1 className="mt-1.5 text-[26px] font-semibold leading-[1.15] tracking-[-0.025em]">My history</h1>
          <p className="mt-1.5 text-sm text-muted">
            Weights and reps you logged. Saved on this phone only — no account, and the property team can&apos;t see it.
          </p>
        </div>
        <HistoryList facilityId={facility.id} facilitySlug={facility.slug} />
      </ResidentMain>
      <ResidentFooter />
    </>
  );
}
