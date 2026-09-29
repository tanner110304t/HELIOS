import { OperatorDashboard } from "@/components/operator/OperatorDashboard";
import {
  analyticsWindowLabel,
  durationMix,
  equipmentPageViews,
  getAnalyticsSummary,
  goalMix,
  weeklyEngagement,
} from "@/data/demoAnalytics";
import { requestTime } from "@/lib/time";
import { DEMO_FACILITY_SLUG, getEquipment, getFacilityBySlug, getSeedIssuesForFacility } from "@/data/repository";

export const metadata = { title: "Operator dashboard" };
// Seeded report times are relative to "now", so render per request.
export const dynamic = "force-dynamic";

export default function OperatorPage() {
  const facility = getFacilityBySlug(DEMO_FACILITY_SLUG)!;
  const now = requestTime();
  return (
    <OperatorDashboard
      facility={facility}
      equipment={getEquipment(facility.id)}
      seedIssues={getSeedIssuesForFacility(facility.id, now)}
      now={now}
      analytics={{
        windowLabel: analyticsWindowLabel,
        summary: getAnalyticsSummary(),
        weekly: weeklyEngagement,
        durationMix,
        goalMix,
        pageViews: equipmentPageViews,
      }}
    />
  );
}
