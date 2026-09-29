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
  /** Why it's out of service (shown to residents). */
  statusReason?: string;
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
  /**
   * How a set is prescribed. Default "reps".
   * "each-side": reps per arm/leg/side. "carry": a timed walk, not reps.
   */
  format?: "reps" | "each-side" | "carry";
};

export type IssueCategory =
  | "not-working"
  | "damaged"
  | "adjustment"
  | "noise"
  | "other";

/** Reported → Acknowledged → Resolved. Separate from whether the machine is in service. */
export type IssueStatus = "open" | "acknowledged" | "resolved";

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
  acknowledgedAt?: string;
  resolvedAt?: string;
  /** Short note from the property team that residents can see on the machine page. */
  update?: string;
};

export type Goal = "muscle" | "strength" | "general";
export type Level = Difficulty;
export type Duration = 20 | 30 | 45 | 60 | 75 | 90;

/** Body areas a resident can ask a plan to focus on. None selected = full body. */
export type FocusArea = "chest" | "back" | "shoulders" | "arms" | "legs" | "core";
