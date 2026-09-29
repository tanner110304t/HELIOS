import type { Equipment, Exercise, Goal, Level } from "@/types/domain";
import { generateWorkout } from "./generateWorkout";
import { durations } from "./templates";

const goals: Goal[] = ["muscle", "strength", "general"];
const levels: Level[] = ["beginner", "intermediate", "advanced"];

/**
 * Which goals would put this piece of equipment into a generated workout
 * (as a main pick or a swap option). Evaluated as if the machine were
 * available, so an out-of-service machine still shows where it normally fits.
 */
export function goalsUsingEquipment(
  equipmentId: string,
  room: { equipment: Equipment[]; exercises: Exercise[] },
): Goal[] {
  const asAvailable = room.equipment.map((e) =>
    e.id === equipmentId ? { ...e, status: "available" as const } : e,
  );
  return goals.filter((goal) =>
    levels.some((level) =>
      durations.some((duration) => {
        const w = generateWorkout({ goal, level, duration }, { ...room, equipment: asAvailable });
        const options = [
          ...(w.warmup ? [w.warmup] : []),
          ...w.items,
          ...w.items.flatMap((i) => i.alternatives),
        ];
        return options.some((o) => o.equipment.some((e) => e.id === equipmentId));
      }),
    ),
  );
}
