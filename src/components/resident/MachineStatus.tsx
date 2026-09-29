"use client";

import { issueCategoryLabels } from "@/data/demoIssues";
import { useFacilityState } from "@/lib/demo/client";
import { currentIssueFor, isUnresolved, issueStatusLabels } from "@/lib/demo/state";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";
import type { Equipment } from "@/types/domain";
import { EquipmentStatusBadge } from "@/components/ui/Badge";
import { EquipmentTile } from "./EquipmentGlyph";

const RECENT_FIX_MS = 7 * 24 * 60 * 60_000;

function useMachine(facilityId: string, equipment: Equipment[], equipmentId: string) {
  const state = useFacilityState(facilityId, equipment);
  const eq = state.equipment.find((e) => e.id === equipmentId)!;
  const issue = currentIssueFor(state.issues, equipmentId);
  return { ...state, eq, issue };
}

/** Glyph + status badge for the machine page header. */
export function MachineHeaderStatus({
  facilityId,
  equipment,
  equipmentId,
  children,
}: {
  facilityId: string;
  equipment: Equipment[];
  equipmentId: string;
  children: React.ReactNode;
}) {
  const { eq, issue } = useMachine(facilityId, equipment, equipmentId);
  return (
    <div className="flex items-start gap-4 pt-2">
      <EquipmentTile kind={eq.kind} className="size-20 rounded-2xl" dimmed={eq.status !== "available"} />
      <div className="min-w-0 pt-1">
        {children}
        <div className="mt-2">
          <EquipmentStatusBadge status={eq.status} attention={!!issue && isUnresolved(issue)} />
        </div>
      </div>
    </div>
  );
}

/**
 * What a resident needs to know before using the machine: is it in service,
 * and what happened to the last problem someone reported.
 */
export function MachineNotice({
  facilityId,
  equipment,
  equipmentId,
}: {
  facilityId: string;
  equipment: Equipment[];
  equipmentId: string;
}) {
  const { eq, issue, hydrated, now } = useMachine(facilityId, equipment, equipmentId);
  const out = eq.status !== "available";
  const showIssue =
    issue && (isUnresolved(issue) || (hydrated && issue.resolvedAt && now - Date.parse(issue.resolvedAt) < RECENT_FIX_MS));

  if (!out && !showIssue) return null;
  return (
    <div className="mt-4 space-y-2" aria-live="polite">
      {out && (
        <p className="rounded-xl bg-down-soft px-3.5 py-3 text-[13px] leading-relaxed text-down">
          <span className="font-semibold">Out of service.</span> {eq.statusReason ? `${eq.statusReason.replace(/\.?$/, ".")} ` : ""}
          Helios is leaving it out of new workouts until the property team returns it to service.
        </p>
      )}
      {showIssue && issue && (
        <div
          className={cn(
            "rounded-xl px-3.5 py-3 text-[13px] leading-relaxed",
            issue.status === "resolved" ? "bg-ok-soft text-ok" : "bg-paper-2 text-ink-3",
          )}
        >
          <p>
            <span className="font-semibold">
              {issue.status === "resolved" ? "Fixed" : `Problem reported · ${issueStatusLabels[issue.status]}`}
            </span>
            {" — "}
            {issueCategoryLabels[issue.category].toLowerCase()}
            {hydrated && (
              <span className="text-muted">
                {" · "}
                {issue.status === "resolved" && issue.resolvedAt
                  ? `resolved ${timeAgo(issue.resolvedAt, now).toLowerCase()}`
                  : issue.status === "acknowledged" && issue.acknowledgedAt
                    ? `acknowledged ${timeAgo(issue.acknowledgedAt, now).toLowerCase()}`
                    : `reported ${timeAgo(issue.reportedAt, now).toLowerCase()}`}
              </span>
            )}
          </p>
          {issue.update && <p className="mt-1">Property team: &ldquo;{issue.update}&rdquo;</p>}
          {issue.status === "open" && (
            <p className="mt-1 text-muted">You can still add details with Report a Problem below.</p>
          )}
        </div>
      )}
    </div>
  );
}
