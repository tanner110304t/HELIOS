import Link from "next/link";
import { notFound } from "next/navigation";
import { ChoiceGroup } from "@/components/resident/ChoiceGroup";
import { ResumeBanner } from "@/components/resident/ResumeBanner";
import { ServiceSummary } from "@/components/resident/ServiceSummary";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { buttonClass } from "@/components/ui/Button";
import { IconArrowRight, IconClock, IconGrid, IconWrench } from "@/components/ui/icons";
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

        <ResumeBanner facilityId={facility.id} facilitySlug={facility.slug} />

        {/* Quick start: no decisions needed. */}
        <Link
          href={`/g/${facility.slug}/workout?goal=general&level=beginner&time=30`}
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-sun px-5 py-4 text-white shadow-card transition hover:bg-sun-ink"
        >
          <span>
            <span className="block text-[17px] font-semibold">Help me get started</span>
            <span className="block text-[13px] text-white/85">A 30-minute beginner plan for this room</span>
          </span>
          <IconArrowRight className="size-5 shrink-0" />
        </Link>

        <nav aria-label="Other things you can do" className="mt-3 grid grid-cols-3 gap-2">
          {[
            { href: `/g/${facility.slug}/equipment`, label: "Learn a machine", icon: IconGrid },
            { href: `/g/${facility.slug}/equipment?report=1`, label: "Report a problem", icon: IconWrench },
            { href: `/g/${facility.slug}/history`, label: "My history", icon: IconClock },
          ].map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface px-2 text-center text-[13px] font-medium leading-tight ring-1 ring-inset ring-line hover:ring-line-strong"
            >
              <t.icon className="size-5 text-muted" />
              {t.label}
            </Link>
          ))}
        </nav>

        <h2 className="mt-9 text-[19px] font-semibold tracking-[-0.015em]">Or build your own</h2>
        <form action={`/g/${facility.slug}/workout`} method="get" className="-mt-3">
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

      </ResidentMain>
      <ResidentFooter />
    </>
  );
}
