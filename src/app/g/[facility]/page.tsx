import Link from "next/link";
import { notFound } from "next/navigation";
import { ChoiceGroup } from "@/components/resident/ChoiceGroup";
import { ServiceSummary } from "@/components/resident/ServiceSummary";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { buttonClass } from "@/components/ui/Button";
import { IconArrowRight, IconGrid, IconWrench } from "@/components/ui/icons";
import { getEquipment, getFacilityBySlug } from "@/data/repository";
import { durations, focusAreas, focusLabels, goalLabels, levelLabels } from "@/lib/workout/templates";

/** Screen 1 — what a resident sees right after scanning the QR code in the room. */
export default async function FacilityWelcome({ params }: PageProps<"/g/[facility]">) {
  const { facility: slug } = await params;
  const facility = getFacilityBySlug(slug);
  if (!facility) notFound();
  const equipment = getEquipment(facility.id);

  return (
    <>
      <ResidentHeader facilityName={facility.propertyName} />
      <ResidentMain>
        <div className="pt-4">
          <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.025em]">{facility.name}</h1>
          <ServiceSummary facilityId={facility.id} equipment={equipment} />
        </div>

        <form action={`/g/${facility.slug}/workout`} method="get" className="mt-3">
          <ChoiceGroup
            legend="What do you want to do today?"
            name="goal"
            columns={1}
            required
            options={[
              { value: "muscle", label: goalLabels.muscle, hint: "Size & shape" },
              { value: "strength", label: goalLabels.strength, hint: "Heavier, fewer reps" },
              { value: "general", label: goalLabels.general, hint: "Strength + cardio" },
            ]}
          />
          <ChoiceGroup
            legend="Focus on"
            hint="Optional · leave blank for full body"
            name="focus"
            multiple
            options={focusAreas.map((f) => ({ value: f, label: focusLabels[f] }))}
          />
          <ChoiceGroup
            legend="Experience"
            name="level"
            defaultValue="beginner"
            options={(["beginner", "intermediate", "advanced"] as const).map((l) => ({
              value: l,
              label: levelLabels[l],
            }))}
          />
          <ChoiceGroup
            legend="How much time do you have?"
            name="time"
            defaultValue="30"
            options={durations.map((d) => ({ value: String(d), label: `${d} min` }))}
          />

          <button type="submit" className={buttonClass("primary", "lg", "mt-8 w-full text-base")}>
            Build My Workout
            <IconArrowRight className="size-4.5" />
          </button>
          <p className="mt-3 text-center text-xs text-muted">No account or email needed.</p>
        </form>

        <div className="mt-8 grid grid-cols-2 gap-2">
          <Link
            href={`/g/${facility.slug}/equipment`}
            className="flex min-h-14 items-center gap-2.5 rounded-2xl bg-surface px-4 text-sm font-medium ring-1 ring-inset ring-line hover:ring-line-strong"
          >
            <IconGrid className="size-5 text-muted" />
            Equipment
          </Link>
          <Link
            href={`/g/${facility.slug}/equipment?report=1`}
            className="flex min-h-14 items-center gap-2.5 rounded-2xl bg-surface px-4 text-sm font-medium ring-1 ring-inset ring-line hover:ring-line-strong"
          >
            <IconWrench className="size-5 text-muted" />
            Report a problem
          </Link>
        </div>
      </ResidentMain>
      <ResidentFooter />
    </>
  );
}
