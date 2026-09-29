"use client";

import { feedbackReasonLabels, type FeedbackReason } from "@/lib/demo/resident";
import type { SessionSummary } from "@/lib/demo/state";
import { pctText, type Ratio, type Recommendation } from "@/lib/insights";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";
import type { Equipment, IssueReport } from "@/types/domain";
import { Badge, DemoDataBadge } from "@/components/ui/Badge";
import { IconAlert, IconArrowRight } from "@/components/ui/icons";

/** Live counts from THIS browser, kept visibly separate from the fictional sample period. */
export function SessionStrip({ session }: { session: SessionSummary }) {
  const fb = session.feedback.yes + session.feedback.somewhat + session.feedback.no;
  const items = [
    ["Plans started", session.plansStarted],
    ["Plans completed", session.plansCompleted],
    ["Feedback", fb ? `${fb} (${session.feedback.yes} yes)` : 0],
    ["Busy-machine swaps", session.busyAlternatives],
    ["Reports filed", session.reportsFiled],
    ["Acknowledged", session.reportsAcknowledged],
  ] as const;
  return (
    <section aria-labelledby="session" className="mt-6 rounded-2xl bg-ink px-5 py-4 text-paper">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="session" className="text-sm font-semibold">
          This demo session
        </h2>
        <p className="text-xs text-paper/60">Live · what happened in this browser only, not the sample data below</p>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-6">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] text-paper/60">{label}</dt>
            <dd className="tabular mt-0.5 text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function NeedsAttention({
  issues,
  equipment,
  hydrated,
  now,
}: {
  issues: IssueReport[];
  equipment: Equipment[];
  hydrated: boolean;
  now: number;
}) {
  const unresolved = issues.filter((i) => i.status !== "resolved");
  const waiting = unresolved.filter((i) => i.status === "open").sort((a, b) => a.reportedAt.localeCompare(b.reportedAt));
  const oldest = waiting[0];
  const out = equipment.filter((e) => e.status !== "available");
  const nameOf = (id: string) => equipment.find((e) => e.id === id)?.name ?? id;
  const affected = new Set(unresolved.map((i) => i.equipmentId)).size;

  return (
    <section aria-labelledby="attention" className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="attention" className="text-lg font-semibold tracking-[-0.01em]">
          Needs attention
        </h2>
        <Badge>Live · sample reports + this session</Badge>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <a href="#issues-section" className="group rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line shadow-card hover:ring-line-strong">
          <p className="text-[13px] text-muted">Unresolved reports</p>
          <p className={cn("tabular mt-1 text-[28px] font-semibold leading-none", unresolved.length > 0 && "text-warn")}>
            {unresolved.length}
          </p>
          <p className="mt-2 text-xs text-muted">
            {affected} machine{affected === 1 ? "" : "s"} affected · {waiting.length} not yet acknowledged
          </p>
        </a>
        <a href="#issues-section" className="rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line shadow-card hover:ring-line-strong">
          <p className="text-[13px] text-muted">Oldest unacknowledged</p>
          {oldest ? (
            <>
              <p className="mt-1 text-[17px] font-semibold">{nameOf(oldest.equipmentId)}</p>
              <p className="mt-1 text-xs text-muted">{hydrated ? `Waiting ${timeAgo(oldest.reportedAt, now).replace(" ago", "")}` : " "}</p>
            </>
          ) : (
            <p className="mt-1 text-[17px] font-semibold text-ok">None</p>
          )}
        </a>
        <a href="#inventory-section" className="rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line shadow-card hover:ring-line-strong">
          <p className="text-[13px] text-muted">Out of service</p>
          <p className="tabular mt-1 text-[28px] font-semibold leading-none">{out.length}</p>
          <p className="mt-2 truncate text-xs text-muted">{out.length ? out.map((e) => e.name).join(", ") : "Everything in service"}</p>
        </a>
      </div>
    </section>
  );
}

function Measure({ label, value, detail, note }: { label: string; value: string | number; detail: string; note?: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line shadow-card">
      <p className="text-[13px] leading-snug text-muted">{label}</p>
      <p className="tabular mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em]">{value}</p>
      <p className="mt-2 text-xs text-ink-3">{detail}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function UsefulMeasures({
  completion,
  repeat,
  helpful,
  responseRate,
  windowLabel,
  unresolved,
}: {
  completion: Ratio;
  repeat: Ratio;
  helpful: Ratio;
  responseRate: Ratio;
  windowLabel: string;
  unresolved: number;
}) {
  return (
    <section aria-labelledby="useful" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="useful" className="text-lg font-semibold tracking-[-0.01em]">
          Is the digital gym useful?
        </h2>
        <div className="flex items-center gap-2">
          <DemoDataBadge />
          <Badge>{windowLabel}</Badge>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted">
        Helios activity only — not gym visits, occupancy, or how every resident feels.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Measure
          label="Plans completed"
          value={pctText(completion)}
          detail={`${completion.num} of ${completion.den} plans`}
          note="Self-reported check-offs"
        />
        <Measure
          label="Came back on another day"
          value={pctText(repeat)}
          detail={`${repeat.num} of ${repeat.den} devices`}
          note="Devices, not people"
        />
        <Measure
          label="Said the plan helped"
          value={pctText(helpful)}
          detail={`${helpful.num} of ${helpful.den} who answered`}
          note={`${pctText(responseRate)} of completed plans answered`}
        />
        <Measure label="Open equipment concerns" value={unresolved} detail="Unresolved reports (live)" />
      </div>
    </section>
  );
}

export function StuckReasons({
  reasons,
  notYes,
  busyByMachine,
  equipment,
}: {
  reasons: Record<FeedbackReason, number>;
  notYes: number;
  busyByMachine: { equipmentId: string; count: number }[];
  equipment: Equipment[];
}) {
  const rows = (Object.entries(reasons) as [FeedbackReason, number][]).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  const busyMax = Math.max(1, ...busyByMachine.map((b) => b.count));
  const nameOf = (id: string) => equipment.find((e) => e.id === id)?.name ?? id;
  return (
    <section aria-labelledby="stuck" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="stuck" className="text-lg font-semibold tracking-[-0.01em]">
          Where residents get stuck
        </h2>
        <DemoDataBadge />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
          <p className="text-sm font-medium">Why a plan didn&apos;t fully help</p>
          <p className="text-xs text-muted">From {notYes} residents who answered &ldquo;somewhat&rdquo; or &ldquo;no&rdquo; (could pick more than one)</p>
          <ul className="mt-3 space-y-2.5">
            {rows.map(([r, n]) => (
              <li key={r}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink-3">{feedbackReasonLabels[r]}</span>
                  <span className="tabular font-medium">{n}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
                  <div className="h-full rounded-full bg-series-1" style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
          <p className="text-sm font-medium">Busy machines residents worked around</p>
          <p className="text-xs text-muted">Times someone marked a machine busy and picked an alternative</p>
          <ul className="mt-3 space-y-2.5">
            {busyByMachine.map((b) => (
              <li key={b.equipmentId}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink-3">{nameOf(b.equipmentId)}</span>
                  <span className="tabular font-medium">{b.count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
                  <div className="h-full rounded-full bg-series-2" style={{ width: `${(b.count / busyMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Shows interruptions handled in Helios, not how long anyone waited.</p>
        </div>
      </div>
    </section>
  );
}

export function NextSteps({ recs }: { recs: Recommendation[] }) {
  if (recs.length === 0) return null;
  return (
    <section aria-labelledby="next" className="mt-10">
      <h2 id="next" className="text-lg font-semibold tracking-[-0.01em]">
        What to do next
      </h2>
      <p className="mt-1 text-sm text-muted">Simple rules applied to the numbers above — suggestions, not conclusions.</p>
      <ol className="mt-3 grid gap-3 lg:grid-cols-3">
        {recs.map((r, i) => (
          <li key={i} className="flex flex-col rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
              {r.source === "live" ? (
                <Badge tone="warn">
                  <IconAlert className="size-3.5" /> Live
                </Badge>
              ) : (
                <Badge tone="sun">Sample insight</Badge>
              )}
            </div>
            <p className="mt-3 text-[15px] font-semibold leading-snug">{r.signal}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{r.implication}</p>
            <p className="mt-auto flex gap-1.5 pt-3 text-[13px] font-medium text-ink">
              <IconArrowRight className="mt-0.5 size-4 shrink-0 text-sun" />
              {r.action}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const definitions: [string, string, string][] = [
  ["Helios sessions", "A resident opening Helios (one browser, one visit)", "Not gym visits or QR scans"],
  ["Plans completed", "Plans with every step checked off ÷ plans started, same period", "Self-reported; not verified exercise"],
  ["Came back on another day", "Devices active on 2+ days ÷ devices active", "Devices, not residents or households"],
  ["Said the plan helped", "“Yes” ÷ all Yes/Somewhat/No answers (skips excluded)", "Only people who answered; small samples aren't definitive"],
  ["Open equipment concerns", "Reports not yet resolved", "Not an uptime figure"],
  ["Busy-machine swaps", "Alternative chosen after tapping “machine is busy”", "Not a measure of wait time or a “saved” workout"],
];

export function MetricDefinitions() {
  return (
    <details className="mt-8 rounded-2xl bg-surface px-5 py-4 ring-1 ring-inset ring-line">
      <summary className="cursor-pointer text-sm font-medium">How these numbers are defined</summary>
      <table className="mt-3 w-full text-left text-[13px]">
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="py-1.5 pr-4 font-medium">Measure</th>
            <th scope="col" className="py-1.5 pr-4 font-medium">Definition</th>
            <th scope="col" className="py-1.5 font-medium">What it doesn&apos;t mean</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {definitions.map(([m, d, n]) => (
            <tr key={m}>
              <th scope="row" className="py-2 pr-4 align-top font-medium">{m}</th>
              <td className="py-2 pr-4 align-top text-ink-3">{d}</td>
              <td className="py-2 align-top text-muted">{n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
