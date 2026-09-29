"use client";

import { useEffect, useState } from "react";
import type { WeeklyEngagement } from "@/data/demoAnalytics";
import { useFacilityState } from "@/lib/demo/client";
import { isUnresolved } from "@/lib/demo/state";
import { headlineMeasures, recommendations, type Feedback } from "@/lib/insights";
import { timeAgo } from "@/lib/time";
import {
  MetricDefinitions,
  NeedsAttention,
  NextSteps,
  SessionStrip,
  StuckReasons,
  UsefulMeasures,
} from "./DecisionSections";
import { goalLabels } from "@/lib/workout/templates";
import type { Duration, Equipment, Facility, Goal } from "@/types/domain";
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
  feedback: Feedback;
  busyByMachine: { equipmentId: string; count: number }[];
};

export function OperatorDashboard({
  facility,
  equipment: seedEquipment,
  analytics,
}: {
  facility: Facility;
  equipment: Equipment[];
  analytics: AnalyticsProps;
}) {
  const { issues, equipment, hydrated, session, now: loadedAt } = useFacilityState(facility.id, seedEquipment);
  const [now, setNow] = useState(loadedAt);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const unresolved = issues.filter(isUnresolved);
  const openCounts = new Map<string, number>();
  for (const i of unresolved) openCounts.set(i.equipmentId, (openCounts.get(i.equipmentId) ?? 0) + 1);
  const openIssues = unresolved.length;
  const s = analytics.summary;
  const measures = headlineMeasures({
    generated: s.workoutsGenerated,
    completed: s.workoutsCompleted,
    devices: s.uniqueDevices,
    repeatDevices: s.repeatDevices,
    feedback: analytics.feedback,
  });
  const recs = recommendations({
    feedback: analytics.feedback,
    busyByMachine: analytics.busyByMachine,
    equipment,
    issues,
    now,
    timeAgo: (iso) => (hydrated ? timeAgo(iso, now).toLowerCase() : "a while ago"),
  });

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

      <SessionStrip session={session} />

      <NeedsAttention issues={issues} equipment={equipment} hydrated={hydrated} now={now} />

      <UsefulMeasures {...measures} windowLabel={analytics.windowLabel} unresolved={openIssues} />

      <StuckReasons
        reasons={analytics.feedback.reasons}
        notYes={analytics.feedback.answers.somewhat + analytics.feedback.answers.no}
        busyByMachine={analytics.busyByMachine}
        equipment={equipment}
      />

      <NextSteps recs={recs} />

      {/* Issues — the live moment of the demo */}
      <IssuesPanel
        issues={issues}
        equipment={equipment}
        facility={facility}
        now={now}
        hydrated={hydrated}
      />

      {/* Detail on demand */}
      <section aria-labelledby="engagement" className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 id="engagement" className="text-lg font-semibold tracking-[-0.01em]">
            Engagement detail
          </h2>
          <DemoDataBadge />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
            <p className="text-sm font-medium">
              Workouts per week <span className="font-normal text-muted">· {s.heliosVisits} Helios sessions in the period</span>
            </p>
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
      <InventoryTable
        facilityId={facility.id}
        equipment={equipment}
        issues={issues}
        pageViews={analytics.pageViews}
        openCounts={openCounts}
      />

      <MetricDefinitions />
    </main>
  );
}
