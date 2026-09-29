"use client";

import { useEffect, useState } from "react";
import type { WeeklyEngagement } from "@/data/demoAnalytics";
import { useFacilityIssues } from "@/lib/issues/client";
import { openIssueCountByEquipment } from "@/lib/issues/merge";
import { goalLabels } from "@/lib/workout/templates";
import type { Duration, Equipment, Facility, Goal, IssueReport } from "@/types/domain";
import { Badge, DemoDataBadge } from "@/components/ui/Badge";
import { EngagementChart, ShareBars } from "./Charts";
import { InventoryTable } from "./InventoryTable";
import { IssuesPanel } from "./IssuesPanel";

export type AnalyticsProps = {
  windowLabel: string;
  summary: {
    heliosVisits: number;
    workoutsGenerated: number;
    workoutsCompleted: number;
    completionRate: number;
    uniqueDevices: number;
    repeatDevices: number;
    equipmentPageViews: number;
  };
  weekly: WeeklyEngagement[];
  durationMix: { duration: Duration; share: number }[];
  goalMix: { goal: Goal; share: number }[];
  pageViews: Record<string, number>;
};

function Kpi({ label, value, note, tone }: { label: string; value: number | string; note?: string; tone?: "warn" }) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line shadow-card">
      <p className="text-[13px] leading-snug text-muted">{label}</p>
      <p className={`tabular mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] ${tone === "warn" ? "text-warn" : ""}`}>
        {value}
      </p>
      {note && <p className="mt-2 text-xs text-faint">{note}</p>}
    </div>
  );
}

export function OperatorDashboard({
  facility,
  equipment,
  seedIssues,
  now: serverNow,
  analytics,
}: {
  facility: Facility;
  equipment: Equipment[];
  seedIssues: IssueReport[];
  now: number;
  analytics: AnalyticsProps;
}) {
  const { issues, resolve, reset } = useFacilityIssues(facility.id, seedIssues);
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const openCounts = openIssueCountByEquipment(issues);
  const openIssues = issues.filter((i) => i.status === "open").length;
  const s = analytics.summary;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Operator dashboard</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.03em]">{facility.propertyName}</h1>
          <p className="mt-1 text-sm text-muted">
            {facility.name} · {facility.unitCount} units · {facility.city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DemoDataBadge />
          <Badge>{analytics.windowLabel}</Badge>
        </div>
      </div>

      <p className="mt-5 rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-3 ring-1 ring-inset ring-line">
        <span className="font-semibold text-ink">Helios engagement only — not total facility utilization.</span>{" "}
        These figures count residents using Helios (QR sessions, workouts, machine pages). They don&apos;t measure gym
        visits or occupancy.
      </p>

      {/* KPIs */}
      <section aria-label="Helios engagement summary" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Helios visits" value={s.heliosVisits} note="QR sessions opened" />
        <Kpi label="Workouts generated" value={s.workoutsGenerated} />
        <Kpi label="Helios workouts completed" value={s.workoutsCompleted} note={`${s.completionRate}% of generated`} />
        <Kpi label="Repeat Helios devices" value={s.repeatDevices} note={`of ${s.uniqueDevices} devices, 2+ days`} />
        <Kpi label="Equipment-page views" value={s.equipmentPageViews} />
        <Kpi
          label="Open equipment issues"
          value={openIssues}
          note={openIssues ? "Needs attention" : "All clear"}
          tone={openIssues ? "warn" : undefined}
        />
      </section>

      {/* Issues — the live moment of the demo */}
      <IssuesPanel
        issues={issues}
        equipment={equipment}
        facility={facility}
        now={now}
        onResolve={resolve}
        onReset={reset}
      />

      {/* Engagement */}
      <section aria-labelledby="engagement" className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 id="engagement" className="text-lg font-semibold tracking-[-0.01em]">
            Helios engagement
          </h2>
          <DemoDataBadge />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
            <p className="text-sm font-medium">Workouts per week</p>
            <p className="text-xs text-muted">Generated in Helios vs. checked off as completed</p>
            <EngagementChart weeks={analytics.weekly} />
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
              <p className="text-sm font-medium">Popular goals</p>
              <ShareBars rows={analytics.goalMix.map((g) => ({ label: goalLabels[g.goal], share: g.share }))} />
            </div>
            <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
              <p className="text-sm font-medium">Selected workout length</p>
              <ShareBars rows={analytics.durationMix.map((d) => ({ label: `${d.duration} min`, share: d.share }))} />
            </div>
          </div>
        </div>
      </section>

      {/* Inventory */}
      <InventoryTable equipment={equipment} pageViews={analytics.pageViews} openCounts={openCounts} />
    </main>
  );
}
