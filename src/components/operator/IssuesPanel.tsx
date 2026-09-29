"use client";

import { useState } from "react";
import { issueCategoryLabels } from "@/data/demoIssues";
import { reportReference } from "@/lib/issues/client";
import { timeAgo } from "@/lib/time";
import type { Equipment, Facility, IssueReport } from "@/types/domain";
import { Badge, IssueStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconCheck, IconRefresh } from "@/components/ui/icons";
import { EquipmentTile } from "@/components/resident/EquipmentGlyph";

export function IssuesPanel({
  issues,
  equipment,
  facility,
  now,
  onResolve,
  onReset,
}: {
  issues: IssueReport[];
  equipment: Equipment[];
  facility: Facility;
  now: number;
  onResolve: (id: string) => void;
  onReset: () => void;
}) {
  const [showResolved, setShowResolved] = useState(false);
  const byId = new Map(equipment.map((e) => [e.id, e]));
  const open = issues.filter((i) => i.status === "open");
  const resolved = issues.filter((i) => i.status === "resolved");
  const hasLive = issues.some((i) => i.source === "live");

  return (
    <section aria-labelledby="issues" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 id="issues" className="text-lg font-semibold tracking-[-0.01em]">
            Equipment issues
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-ok motion-safe:animate-pulse" aria-hidden />
            Updates live on this laptop
          </span>
        </div>
        {hasLive && (
          <Button variant="ghost" onClick={onReset} className="h-8 px-2.5 text-xs text-muted">
            <IconRefresh className="size-3.5" /> Reset demo reports
          </Button>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">
        Residents tap the machine. Helios already knows which facility, which machine, and where it sits.
      </p>

      <ul className="mt-4 grid gap-3 md:grid-cols-2" aria-live="polite">
        {open.length === 0 && (
          <li className="rounded-2xl bg-surface p-5 text-sm text-muted ring-1 ring-inset ring-line md:col-span-2">
            No open issues.
          </li>
        )}
        {open.map((issue) => (
          <IssueCard key={issue.id} issue={issue} eq={byId.get(issue.equipmentId)} facility={facility} now={now}>
            <Button variant="secondary" onClick={() => onResolve(issue.id)} className="h-9 px-3 text-[13px]">
              <IconCheck className="size-4" /> Mark resolved
            </Button>
          </IssueCard>
        ))}
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
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {resolved.map((issue) => (
                <IssueCard key={issue.id} issue={issue} eq={byId.get(issue.equipmentId)} facility={facility} now={now} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function IssueCard({
  issue,
  eq,
  facility,
  now,
  children,
}: {
  issue: IssueReport;
  eq?: Equipment;
  facility: Facility;
  now: number;
  children?: React.ReactNode;
}) {
  const fresh = issue.source === "live" && now - new Date(issue.reportedAt).getTime() < 15 * 60_000;
  return (
    <li
      className={`rounded-2xl bg-surface ring-1 ring-inset shadow-card ${
        fresh ? "ring-sun/60" : "ring-line"
      } ${issue.status === "resolved" ? "opacity-75" : ""}`}
    >
      <div className="flex items-start gap-3.5 p-4">
        {eq && <EquipmentTile kind={eq.kind} className="size-12" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold">{eq?.name ?? issue.equipmentId}</h3>
            {fresh && <Badge tone="sun">New</Badge>}
          </div>
          <p className="mt-0.5 text-sm font-medium text-ink-3">{issueCategoryLabels[issue.category]}</p>
          <p className="mt-0.5 text-xs text-muted">
            Reported {timeAgo(issue.reportedAt, now).toLowerCase()} · {reportReference(issue.id)}
          </p>
        </div>
        <IssueStatusBadge status={issue.status} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-line px-4 py-3 text-[13px]">
        <dt className="text-muted">Facility</dt>
        <dd>{facility.name}</dd>
        {eq && (
          <>
            <dt className="text-muted">Equipment</dt>
            <dd>
              {eq.name} <span className="font-mono text-[12px] text-muted">· {eq.assetTag}</span>
            </dd>
            <dt className="text-muted">Location</dt>
            <dd>{eq.location}</dd>
          </>
        )}
        <dt className="text-muted">Resident note</dt>
        <dd className={issue.description ? "" : "text-faint"}>{issue.description ?? "None"}</dd>
      </dl>
      {children && <div className="flex justify-end border-t border-line px-4 py-2.5">{children}</div>}
    </li>
  );
}
