import { notFound } from "next/navigation";
import { ResidentFooter, ResidentHeader, ResidentMain } from "@/components/resident/ResidentChrome";
import { WorkoutClient } from "@/components/resident/WorkoutClient";
import { getEquipment, getExercises, getFacilityBySlug } from "@/data/repository";
import type { WorkoutRequest } from "@/lib/workout/generateWorkout";
import { focusAreas, isDuration, isFocusArea, isGoal, isLevel } from "@/lib/workout/templates";

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
  // focus can arrive as ?focus=chest&focus=back (form) or ?focus=chest,back (hand-typed).
  const focusRaw = [sp.focus ?? []].flat().flatMap((v) => v.split(","));
  const focus = focusAreas.filter((f) => focusRaw.some((v) => v === f && isFocusArea(v)));
  const request: WorkoutRequest = {
    goal: isGoal(goalRaw) ? goalRaw : "general",
    level: isLevel(levelRaw) ? levelRaw : "beginner",
    duration: isDuration(timeRaw) ? timeRaw : 30,
    focus,
  };

  return (
    <>
      <ResidentHeader facilityName={facility.propertyName} back={{ href: `/g/${facility.slug}`, label: "Change" }} />
      <ResidentMain>
        <WorkoutClient
          key={`${request.goal}-${request.level}-${request.duration}-${focus.join("+")}`}
          request={request}
          facilityId={facility.id}
          facilityName={facility.name}
          facilitySlug={facility.slug}
          equipment={getEquipment(facility.id)}
          exercises={getExercises()}
        />
      </ResidentMain>
      <ResidentFooter />
    </>
  );
}
