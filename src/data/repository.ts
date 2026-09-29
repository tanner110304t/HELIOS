/**
 * The single seam between the UI and demo data.
 *
 * Every page reads facility data through these functions. Replacing the
 * static imports below with database / API calls (and making these async) is
 * the path to a real backend — components don't import demo files directly.
 */
import type { Equipment, Exercise, Facility } from "@/types/domain";
import { demoFacility } from "./demoFacility";
import { demoEquipment } from "./demoEquipment";
import { demoExercises } from "./demoExercises";

const facilities: Facility[] = [demoFacility];
const equipmentByFacility: Record<string, Equipment[]> = {
  [demoFacility.id]: demoEquipment,
};

export function listFacilities(): Facility[] {
  return facilities;
}

export function getFacilityBySlug(slug: string): Facility | undefined {
  return facilities.find((f) => f.slug === slug);
}

export function getFacilityById(id: string): Facility | undefined {
  return facilities.find((f) => f.id === id);
}

export function getEquipment(facilityId: string): Equipment[] {
  return equipmentByFacility[facilityId] ?? [];
}

export function getEquipmentBySlug(facilityId: string, slug: string): Equipment | undefined {
  return getEquipment(facilityId).find((e) => e.slug === slug);
}

export function getEquipmentById(facilityId: string, id: string): Equipment | undefined {
  return getEquipment(facilityId).find((e) => e.id === id);
}

export function getExercises(): Exercise[] {
  return demoExercises;
}

/** Exercises a given piece of equipment supports (required or interchangeable). */
export function getExercisesForEquipment(equipmentId: string): Exercise[] {
  return demoExercises.filter(
    (ex) =>
      ex.equipmentIds.includes(equipmentId) ||
      (ex.anyOfEquipmentIds?.includes(equipmentId) ?? false),
  );
}

/** Demo shortcut: the one facility this build shows. */
export const DEMO_FACILITY_SLUG = demoFacility.slug;
