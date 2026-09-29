import { notFound } from "next/navigation";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { WorkoutView } from "@/components/resident/WorkoutView";
import { getEquipment, getExercises, getFacilityBySlug } from "@/data/repository";
import { generateWorkout } from "@/lib/workout/generateWorkout";
import { isDuration, isGoal, isLevel } from "@/lib/workout/templates";

export const metadata = { title: "Your workout" };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function WorkoutPage({ params, searchParams }: PageProps<"/g/[facility]/workout">) {
  const { facility: slug } = await params;
  const facility = getFacilityBySlug(slug);
  if (!facility) notFound();

  // Tolerate missing / odd params (e.g. someone opens the URL directly).
  const sp = await searchParams;
  const goalRaw = first(sp.goal);
  const levelRaw = first(sp.level);
  const timeRaw = Number(first(sp.time));
  const request = {
    goal: isGoal(goalRaw) ? goalRaw : "general",
    level: isLevel(levelRaw) ? levelRaw : "beginner",
    duration: isDuration(timeRaw) ? timeRaw : 30,
  } as const;

  const workout = generateWorkout(request, {
    equipment: getEquipment(facility.id),
    exercises: getExercises(),
  });

  return (
    <>
      <ResidentHeader facilityName={facility.propertyName} back={{ href: `/g/${facility.slug}`, label: "Change" }} />
      <ResidentMain>
        <WorkoutView
          key={`${request.goal}-${request.level}-${request.duration}`}
          workout={workout}
          facilityName={facility.name}
          facilitySlug={facility.slug}
          totalEquipment={getEquipment(facility.id).length}
        />
      </ResidentMain>
      <ResidentFooter />
    </>
  );
}
