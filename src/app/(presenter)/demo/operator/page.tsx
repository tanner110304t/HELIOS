import { OperatorDashboard } from "@/components/operator/OperatorDashboard";
import {
  analyticsWindowLabel,
  durationMix,
  equipmentPageViews,
  getAnalyticsSummary,
  goalMix,
  sampleBusyAlternatives,
  sampleFeedback,
  weeklyEngagement,
} from "@/data/demoAnalytics";
import { DEMO_FACILITY_SLUG, getEquipment, getFacilityBySlug } from "@/data/repository";

export const metadata = { title: "Operator dashboard" };

export default function OperatorPage() {
  const facility = getFacilityBySlug(DEMO_FACILITY_SLUG)!;
  return (
    <OperatorDashboard
      facility={facility}
      equipment={getEquipment(facility.id)}
      analytics={{
        windowLabel: analyticsWindowLabel,
        summary: getAnalyticsSummary(),
        weekly: weeklyEngagement,
        durationMix,
        goalMix,
        pageViews: equipmentPageViews,
        feedback: sampleFeedback,
        busyByMachine: sampleBusyAlternatives,
      }}
    />
  );
}
