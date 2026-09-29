import type { IssueReport } from "@/types/domain";

/**
 * Combine pre-seeded demo reports with live ones (from the shared store and
 * from this browser), de-duplicated by id, with resolutions applied,
 * newest first.
 */
export function mergeIssues(
  seeds: IssueReport[],
  live: IssueReport[][],
  resolvedIds: Iterable<string>,
): IssueReport[] {
  const resolved = new Set(resolvedIds);
  const byId = new Map<string, IssueReport>();
  for (const r of [...seeds, ...live.flat()]) if (!byId.has(r.id)) byId.set(r.id, r);
  return [...byId.values()]
    .map((r) => (resolved.has(r.id) ? { ...r, status: "resolved" as const } : r))
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
}

export function openIssueCountByEquipment(issues: IssueReport[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const i of issues) {
    if (i.status === "open") counts.set(i.equipmentId, (counts.get(i.equipmentId) ?? 0) + 1);
  }
  return counts;
}
