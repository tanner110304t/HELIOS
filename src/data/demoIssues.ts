import type { IssueCategory, IssueReport } from "@/types/domain";

export const issueCategoryLabels: Record<IssueCategory, string> = {
  "not-working": "Machine not working",
  damaged: "Damaged",
  adjustment: "Adjustment problem",
  noise: "Unusual noise",
  other: "Other",
};

export const issueCategories = Object.keys(issueCategoryLabels) as IssueCategory[];

type SeedIssue = Omit<IssueReport, "reportedAt" | "source" | "acknowledgedAt" | "resolvedAt"> & {
  /** Relative ages so the demo always reads "2 hours ago", whatever day it is shown. */
  minutesAgo: number;
  acknowledgedMinutesAgo?: number;
  resolvedMinutesAgo?: number;
};

/** Pre-loaded demo reports. Fictional. */
const seedIssues: SeedIssue[] = [
  {
    id: "rpt_seed_1042",
    facilityId: "fac_solstice_lofts",
    equipmentId: "eq_treadmill_2",
    category: "noise",
    description: "Grinding sound from the belt once it gets above about 6 mph.",
    status: "open",
    minutesAgo: 125,
  },
  {
    id: "rpt_seed_1038",
    facilityId: "fac_solstice_lofts",
    equipmentId: "eq_leg_extension",
    category: "adjustment",
    description: "Seat pin won't lock in the lower positions.",
    status: "acknowledged",
    minutesAgo: 60 * 26,
    acknowledgedMinutesAgo: 60 * 24,
    update: "A replacement part is on order. Out of service until it's fixed.",
  },
  {
    id: "rpt_seed_1027",
    facilityId: "fac_solstice_lofts",
    equipmentId: "eq_seated_row",
    category: "damaged",
    description: "Grip on the row handle is torn.",
    status: "resolved",
    minutesAgo: 60 * 24 * 6,
    acknowledgedMinutesAgo: 60 * 24 * 6 - 90,
    resolvedMinutesAgo: 60 * 24 * 4,
    update: "New handle grip fitted.",
  },
];

export function getSeedIssues(now: number = Date.now()): IssueReport[] {
  const at = (min?: number) => (min === undefined ? undefined : new Date(now - min * 60_000).toISOString());
  return seedIssues.map(({ minutesAgo, acknowledgedMinutesAgo, resolvedMinutesAgo, ...issue }) => ({
    ...issue,
    reportedAt: at(minutesAgo)!,
    acknowledgedAt: at(acknowledgedMinutesAgo),
    resolvedAt: at(resolvedMinutesAgo),
    source: "seed",
  }));
}
