import Link from "next/link";
import { notFound } from "next/navigation";
import { ChoiceGroup } from "@/components/resident/ChoiceGroup";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { buttonClass } from "@/components/ui/Button";
import { IconArrowRight, IconGrid, IconWrench } from "@/components/ui/icons";
import { getEquipment, getFacilityBySlug } from "@/data/repository";
import { durations, goalLabels, levelLabels } from "@/lib/workout/templates";

/** Screen 1 — what a resident sees right after scanning the QR code in the room. */
export default async function FacilityWelcome({ params }: PageProps<"/g/[facility]">) {
  const { facility: slug } = await params;
  const facility = getFacilityBySlug(slug);
  if (!facility) notFound();
  const equipment = getEquipment(facility.id);
  const available = equipment.filter((e) => e.status === "available").length;

  return (
    <>
      <ResidentHeader facilityName={facility.propertyName} />
      <ResidentMain>
        <div className="pt-4">
          <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.025em]">{facility.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <span className="inline-block size-1.5 rounded-full bg-ok" aria-hidden />
            {available} of {equipment.length} pieces of equipment available now
          </p>
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
