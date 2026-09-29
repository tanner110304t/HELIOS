"use client";

import { useState } from "react";
import { issueCategoryLabels } from "@/data/demoIssues";
import { setIssueStatus, setServiceStatus } from "@/lib/demo/client";
import {
  MAX_UPDATE_LENGTH,
  issueStatusLabels,
  isUnresolved,
  reportReference,
  returnToServiceWarning,
  serviceBrief,
} from "@/lib/demo/state";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";
import type { Equipment, Facility, IssueReport } from "@/types/domain";
import { Badge, IssueStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconCheck, IconPause } from "@/components/ui/icons";
import { EquipmentTile } from "@/components/resident/EquipmentGlyph";
import { CopyText } from "@/components/demo/CopyText";

export function IssuesPanel({
  issues,
  equipment,
  facility,
  now,
  hydrated,
}: {
  issues: IssueReport[];
  equipment: Equipment[];
  facility: Facility;
  now: number;
  hydrated: boolean;
}) {
  const [showResolved, setShowResolved] = useState(false);
  const byId = new Map(equipment.map((e) => [e.id, e]));
  const active = issues.filter(isUnresolved);
  const resolved = issues.filter((i) => !isUnresolved(i));

  return (
    <section id="issues-section" aria-labelledby="issues" className="mt-10 scroll-mt-14">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="issues" className="text-lg font-semibold tracking-[-0.01em]">
          Equipment issues
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-ok motion-safe:animate-pulse" aria-hidden />
          Updates live in this browser
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Residents tap the machine, so each report arrives with the facility, machine and location. Acknowledge it,
        decide whether the machine should stay in service, and residents see the status on that machine&apos;s page.
      </p>

      <ul className="mt-4 grid gap-3 lg:grid-cols-2" aria-live="polite">
        {active.length === 0 && (
          <li className="rounded-2xl bg-surface p-5 text-sm text-muted ring-1 ring-inset ring-line lg:col-span-2">
            No unresolved reports.
          </li>
        )}
        {active.map((issue) => {
          const eq = byId.get(issue.equipmentId);
          return eq ? (
            <IssueCard
              key={issue.id}
              issue={issue}
              eq={eq}
              facility={facility}
              issues={issues}
              now={now}
              hydrated={hydrated}
            />
          ) : null;
        })}
      </ul>

      {resolved.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            aria-expanded={showResolved}
            className="text-sm font-medium text-muted hover:text-ink"
          >
            {showResolved ? "Hide" : "Show"} {resolved.length} resolved
          </button>
          {showResolved && (
            <ul className="mt-3 grid gap-3 lg:grid-cols-2">
              {resolved.map((issue) => {
                const eq = byId.get(issue.equipmentId);
                return eq ? (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    eq={eq}
                    facility={facility}
                    issues={issues}
                    now={now}
                    hydrated={hydrated}
                  />
                ) : null;
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function Steps({ issue, now, hydrated }: { issue: IssueReport; now: number; hydrated: boolean }) {
  const steps = [
    { label: issueStatusLabels.open, at: issue.reportedAt, done: true },
    { label: issueStatusLabels.acknowledged, at: issue.acknowledgedAt, done: issue.status !== "open" },
    { label: issueStatusLabels.resolved, at: issue.resolvedAt, done: issue.status === "resolved" },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2 px-4 pb-3" aria-label="Report progress">
      {steps.map((s) => (
        <li key={s.label} className="min-w-0">
          <div className={cn("h-1 rounded-full", s.done ? "bg-sun" : "bg-paper-2")} aria-hidden />
          <p className={cn("mt-1.5 text-xs font-medium", s.done ? "text-ink" : "text-muted")}>
            {s.done ? "✓ " : ""}
            {s.label}
          </p>
          <p className="text-[11px] text-muted">{s.done && s.at && hydrated ? timeAgo(s.at, now) : " "}</p>
        </li>
      ))}
    </ol>
  );
}

function IssueCard({
  issue,
  eq,
  facility,
  issues,
  now,
  hydrated,
}: {
  issue: IssueReport;
  eq: Equipment;
  facility: Facility;
  issues: IssueReport[];
  now: number;
  hydrated: boolean;
}) {
  const [note, setNote] = useState("");
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fresh =
    hydrated && issue.source === "live" && issue.status === "open" && now - Date.parse(issue.reportedAt) < 15 * 60_000;
  const outOfService = eq.status !== "available";
  const noteId = `note-${issue.id}`;

  const act = (ok: boolean) => {
    setError(ok ? null : "This browser couldn't save that change.");
    if (ok) setNote("");
  };
  const returnWarning = returnToServiceWarning(issues, eq.id);

  const onReturn = () => {
    if (returnWarning && !confirmReturn) {
      setConfirmReturn(true);
      return;
    }
    setConfirmReturn(false);
    act(setServiceStatus(facility.id, eq.id, "available"));
  };

  return (
    <li
      className={cn(
        "flex flex-col rounded-2xl bg-surface ring-1 ring-inset shadow-card",
        fresh ? "ring-sun/60" : "ring-line",
      )}
    >
      <div className="flex items-start gap-3.5 p-4 pb-3">
        <EquipmentTile kind={eq.kind} className="size-12" dimmed={outOfService} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold">{eq.name}</h3>
            {fresh && <Badge tone="sun">New</Badge>}
          </div>
          <p className="mt-0.5 text-sm font-medium text-ink-3">{issueCategoryLabels[issue.category]}</p>
          <p className="mt-0.5 text-xs text-muted">
            {hydrated ? `Reported ${timeAgo(issue.reportedAt, now).toLowerCase()} · ` : ""}
            {reportReference(issue.id)}
          </p>
        </div>
        <IssueStatusBadge status={issue.status} />
      </div>

      <Steps issue={issue} now={now} hydrated={hydrated} />

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-line px-4 py-3 text-[13px]">
        <dt className="text-muted">Facility</dt>
        <dd>{facility.name}</dd>
        <dt className="text-muted">Equipment</dt>
        <dd>
          {eq.name}
          {eq.quantity > 1 && <span className="text-muted"> (group of {eq.quantity})</span>}{" "}
          <span className="font-mono text-[12px] text-muted">· {eq.assetTag}</span>
        </dd>
        <dt className="text-muted">Location</dt>
        <dd>{eq.location}</dd>
        <dt className="text-muted">Resident note</dt>
        <dd className={issue.description ? "" : "text-muted"}>{issue.description ?? "None"}</dd>
        <dt className="text-muted">Machine</dt>
        <dd className={outOfService ? "font-medium text-down" : ""}>
          {outOfService ? `Out of service${eq.statusReason ? ` — ${eq.statusReason}` : ""}` : "In service"}
        </dd>
        {issue.update && (
          <>
            <dt className="text-muted">Residents see</dt>
            <dd>&ldquo;{issue.update}&rdquo;</dd>
          </>
        )}
      </dl>

      <div className="mt-auto space-y-2.5 border-t border-line px-4 py-3">
        {isUnresolved(issue) && (
          <div>
            <label htmlFor={noteId} className="text-xs font-medium text-ink-3">
              Update for residents <span className="font-normal text-muted">(optional, shown on the machine page)</span>
            </label>
            <input
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={MAX_UPDATE_LENGTH}
              placeholder="e.g. Technician visit booked for Thursday"
              className="mt-1 block h-9 w-full rounded-lg bg-paper px-3 text-[13px] ring-1 ring-inset ring-line placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-sun"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {issue.status === "open" && (
            <Button
              variant="primary"
              className="h-9 px-3 text-[13px]"
              onClick={() => act(setIssueStatus(facility.id, issue, "acknowledged", note))}
            >
              Acknowledge
            </Button>
          )}
          {isUnresolved(issue) && (
            <Button
              variant="secondary"
              className="h-9 px-3 text-[13px]"
              onClick={() => act(setIssueStatus(facility.id, issue, "resolved", note))}
            >
              <IconCheck className="size-4" /> Mark resolved
            </Button>
          )}
          {!outOfService && isUnresolved(issue) && (
            <Button
              variant="secondary"
              className="h-9 px-3 text-[13px]"
              title={eq.quantity > 1 ? `Takes all ${eq.quantity} units out of Helios plans` : undefined}
              onClick={() =>
                act(setServiceStatus(facility.id, eq.id, "unavailable", `${issueCategoryLabels[issue.category]} reported`))
              }
            >
              <IconPause className="size-4" />
              {eq.quantity > 1 ? `Take all ${eq.quantity} out of service` : "Take out of service"}
            </Button>
          )}
          {outOfService && (
            <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={onReturn}>
              {confirmReturn ? "Return anyway" : "Return to service"}
            </Button>
          )}
          <CopyText text={serviceBrief(facility, eq, issue)} label="Copy service brief" />
        </div>
        {confirmReturn && returnWarning && (
          <p className="text-xs text-warn" role="alert">
            {returnWarning} Return it to service anyway?
          </p>
        )}
        {error && (
          <p className="text-xs text-down" role="alert">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
