import type { IssueCategory, IssueReport } from "@/types/domain";

export const issueCategoryLabels: Record<IssueCategory, string> = {
  "not-working": "Machine not working",
  damaged: "Damaged",
  adjustment: "Adjustment problem",
  noise: "Unusual noise",
  other: "Other",
};

export const issueCategories = Object.keys(issueCategoryLabels) as IssueCategory[];

type SeedIssue = Omit<IssueReport, "reportedAt" | "source"> & {
  /** Relative age so the demo always reads "2 hours ago", whatever day it is shown. */
  minutesAgo: number;
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
    status: "open",
    minutesAgo: 60 * 26,
  },
  {
    id: "rpt_seed_1027",
    facilityId: "fac_solstice_lofts",
    equipmentId: "eq_seated_row",
    category: "damaged",
    description: "Grip on the row handle is torn.",
    status: "resolved",
    minutesAgo: 60 * 24 * 6,
  },
];

export function getSeedIssues(now: number = Date.now()): IssueReport[] {
  return seedIssues.map(({ minutesAgo, ...issue }) => ({
    ...issue,
    reportedAt: new Date(now - minutesAgo * 60_000).toISOString(),
    source: "seed",
  }));
}
