import Link from "next/link";
import { notFound } from "next/navigation";
import { MachineHistory } from "@/components/resident/History";
import { MachineHeaderStatus, MachineNotice } from "@/components/resident/MachineStatus";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { IconArrowRight, IconWrench } from "@/components/ui/icons";
import {
  getEquipment,
  getEquipmentBySlug,
  getExercises,
  getExercisesForEquipment,
  getFacilityBySlug,
  listFacilities,
} from "@/data/repository";
import { goalLabels, levelLabels } from "@/lib/workout/templates";
import { goalsUsingEquipment } from "@/lib/workout/usage";

export const dynamicParams = false;

export function generateStaticParams() {
  return listFacilities().flatMap((f) =>
    getEquipment(f.id).map((e) => ({ facility: f.slug, equipment: e.slug })),
  );
}

export async function generateMetadata({ params }: PageProps<"/g/[facility]/equipment/[equipment]">) {
  const { facility: fSlug, equipment: eSlug } = await params;
  const facility = getFacilityBySlug(fSlug);
  const eq = facility && getEquipmentBySlug(facility.id, eSlug);
  return { title: eq?.name ?? "Equipment" };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="eyebrow mb-2.5">{title}</h2>
      {children}
    </section>
  );
}

export default async function MachinePage({ params }: PageProps<"/g/[facility]/equipment/[equipment]">) {
  const { facility: fSlug, equipment: eSlug } = await params;
  const facility = getFacilityBySlug(fSlug);
  if (!facility) notFound();
  const eq = getEquipmentBySlug(facility.id, eSlug);
  if (!eq) notFound();

  const exercises = getExercisesForEquipment(eq.id);
  const usedBy = goalsUsingEquipment(eq.id, { equipment: getEquipment(facility.id), exercises: getExercises() });
  const roomEquipment = getEquipment(facility.id);

  return (
    <>
      <ResidentHeader
        facilityName={facility.propertyName}
        back={{ href: `/g/${facility.slug}/equipment`, label: "Equipment" }}
      />
      <ResidentMain>
        <MachineHeaderStatus facilityId={facility.id} equipment={roomEquipment} equipmentId={eq.id}>
          <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.025em]">{eq.name}</h1>
          <p className="mt-1 text-sm text-muted">{eq.category}</p>
        </MachineHeaderStatus>
        <MachineNotice facilityId={facility.id} equipment={roomEquipment} equipmentId={eq.id} />

        <MachineHistory facilityId={facility.id} equipmentId={eq.id} />

        <Section title="What it trains">
          <ul className="flex flex-wrap gap-1.5">
            {eq.trains.map((t) => (
              <li key={t}>
                <Badge>{t}</Badge>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Setup">
          <ol className="space-y-2.5">
            {eq.setup.map((step, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed">
                <span className="tabular mt-px grid size-6 shrink-0 place-items-center rounded-full bg-paper-2 font-mono text-[11px] text-ink-3 ring-1 ring-inset ring-line">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Section>

        {exercises.length > 0 && (
          <Section title="Exercises">
            <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface ring-1 ring-inset ring-line">
              {exercises.map((x) => (
                <li key={x.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] font-medium">{x.name}</span>
                    <span className="shrink-0 text-xs text-muted">{levelLabels[x.difficulty]}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{x.instruction}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {usedBy.length > 0 && (
          <Section title="In your workout">
            <div className="rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line">
              <p className="text-[14px] leading-relaxed">
                Helios can include this machine (when it&apos;s in service) when you choose:
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {usedBy.map((g) => (
                  <li key={g}>
                    <Badge tone="sun">{goalLabels[g]}</Badge>
                  </li>
                ))}
              </ul>
              <Link
                href={`/g/${facility.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sun-ink hover:underline"
              >
                Build a workout <IconArrowRight className="size-3.5" />
              </Link>
            </div>
          </Section>
        )}

        <div className="mt-8">
          <Link href={`/g/${facility.slug}/report/${eq.slug}`} className={buttonClass("secondary", "lg", "w-full")}>
            <IconWrench className="size-4.5" />
            Report a Problem
          </Link>
          <p className="mt-2 text-center font-mono text-[11px] text-faint">
            {eq.assetTag} · {eq.location}
          </p>
        </div>
      </ResidentMain>
      <ResidentFooter />
    </>
  );
}
