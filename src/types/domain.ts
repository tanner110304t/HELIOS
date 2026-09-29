/**
 * Helios demo domain types.
 *
 * Deliberately small. These describe what the demo needs to render, not the
 * future production schema. A real backend should be able to return these same
 * shapes from src/data/repository.ts without the UI changing.
 */

export type Facility = {
  id: string;
  slug: string;
  /** Resident-facing name, e.g. "Solstice Lofts Fitness Center" */
  name: string;
  /** Property the facility belongs to, e.g. "Solstice Lofts" */
  propertyName: string;
  propertyType: "multifamily";
  city: string;
  unitCount: number;
  /** Dealer that installed the physical room (fictional in the demo). */
  installedBy: string;
  installedOn: string;
};

/** Visual family used for the equipment glyph. */
export type EquipmentKind =
  | "selectorized"
  | "plate-loaded"
  | "cable"
  | "free-weight"
  | "bench"
  | "treadmill"
  | "elliptical"
  | "bike";

export type EquipmentZone = "Strength" | "Cables" | "Free Weights" | "Cardio";

export type MovementCategory =
  | "horizontal-push"
  | "vertical-push"
  | "horizontal-pull"
  | "vertical-pull"
  | "knee-dominant"
  | "hip-hinge"
  | "shoulder-isolation"
  | "arms"
  | "core"
  | "cardio";

export type EquipmentStatus = "available" | "unavailable";

export type Equipment = {
  id: string;
  slug: string;
  name: string;
  /** Short functional label shown to residents, e.g. "Vertical Pull" */
  category: string;
  zone: EquipmentZone;
  kind: EquipmentKind;
  quantity: number;
  /** Singular name for one unit, when `name` is plural or numbered (e.g. "Elliptical"). */
  unitName?: string;
  status: EquipmentStatus;
  /** Where it sits in the room — the context a technician needs. */
  location: string;
  assetTag: string;
  trains: string[];
  setup: string[];
};

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Exercise = {
  id: string;
  name: string;
  /** Every piece listed must be present and available for the exercise to be eligible. */
  equipmentIds: string[];
  /** At least one of these must be available (interchangeable units, e.g. two treadmills). */
  anyOfEquipmentIds?: string[];
  movementCategory: MovementCategory;
  difficulty: Difficulty;
  instruction: string;
};

export type IssueCategory =
  | "not-working"
  | "damaged"
  | "adjustment"
  | "noise"
  | "other";

export type IssueStatus = "open" | "resolved";

export type IssueReport = {
  id: string;
  facilityId: string;
  equipmentId: string;
  category: IssueCategory;
  description?: string;
  status: IssueStatus;
  /** ISO timestamp */
  reportedAt: string;
  /** "seed" = pre-loaded demo data, "live" = submitted during this demo */
  source: "seed" | "live";
};

export type Goal = "muscle" | "strength" | "general";
export type Level = Difficulty;
export type Duration = 20 | 30 | 45;
