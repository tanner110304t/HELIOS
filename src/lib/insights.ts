import type { Equipment, IssueReport } from "@/types/domain";
import { feedbackReasonLabels, type FeedbackReason } from "@/lib/demo/resident";

/**
 * Headline measures and "what to do next" for the operator dashboard.
 * Every percentage comes from counts shown next to it. Recommendations are
 * plain rules over those counts — no AI, no claims about cause.
 */

export type Ratio = { num: number; den: number; pct: number | null };
export const ratio = (num: number, den: number): Ratio => ({
  num,
  den,
  pct: den > 0 ? Math.round((num / den) * 100) : null,
});
export const pctText = (r: Ratio) => (r.pct === null ? "No data yet" : `${r.pct}%`);

export type Feedback = {
  answers: { yes: number; somewhat: number; no: number };
  reasons: Record<FeedbackReason, number>;
};

export function headlineMeasures(input: {
  generated: number;
  completed: number;
  devices: number;
  repeatDevices: number;
  feedback: Feedback;
}) {
  const responses = input.feedback.answers.yes + input.feedback.answers.somewhat + input.feedback.answers.no;
  return {
    completion: ratio(input.completed, input.generated),
    repeat: ratio(input.repeatDevices, input.devices),
    helpful: ratio(input.feedback.answers.yes, responses),
    responseRate: ratio(responses, input.completed),
  };
}

export type Recommendation = {
  signal: string;
  implication: string;
  action: string;
  source: "sample" | "live";
};

export function recommendations(input: {
  feedback: Feedback;
  busyByMachine: { equipmentId: string; count: number }[];
  equipment: Equipment[];
  issues: IssueReport[];
  now: number;
  timeAgo: (iso: string) => string;
}): Recommendation[] {
  const out: Recommendation[] = [];
  const name = (id: string) => input.equipment.find((e) => e.id === id)?.name ?? id;
  const notYes = input.feedback.answers.somewhat + input.feedback.answers.no;

  // 1. Live: the oldest report nobody has acknowledged yet.
  const waiting = input.issues
    .filter((i) => i.status === "open")
    .sort((a, b) => a.reportedAt.localeCompare(b.reportedAt))[0];
  if (waiting) {
    out.push({
      source: "live",
      signal: `${name(waiting.equipmentId)} report is waiting ${input.timeAgo(waiting.reportedAt).replace(" ago", "")} without acknowledgement.`,
      implication: "Residents who check that machine can't tell anyone is on it.",
      action: "Acknowledge it (add a short update), and copy the service brief if it needs a technician.",
    });
  }

  // 2. Sample: the most common reason a plan didn't fully help.
  const [topReason, topCount] = (Object.entries(input.feedback.reasons) as [FeedbackReason, number][])
    .sort((a, b) => b[1] - a[1])[0] ?? [];
  if (topReason && topCount > 0 && notYes > 0) {
    if (topReason === "machine-busy") {
      const top = [...input.busyByMachine].sort((a, b) => b.count - a.count)[0];
      out.push({
        source: "sample",
        signal: `"${feedbackReasonLabels[topReason]}" was the most common reason (${topCount} of ${notYes} who said somewhat or no)${top ? `, and ${name(top.equipmentId)} had the most busy-machine swaps (${top.count})` : ""}.`,
        implication: "A popular machine may be a bottleneck at busy times. This doesn't show how long people waited.",
        action: `Check ${top ? name(top.equipmentId) : "that machine"} at peak hours. If it's consistently busy, raise it in the next equipment review.`,
      });
    } else {
      out.push({
        source: "sample",
        signal: `"${feedbackReasonLabels[topReason]}" was the most common reason (${topCount} of ${notYes} who said somewhat or no).`,
        implication: "Something about the plans or guidance isn't landing for some residents.",
        action: "Ask a few residents which part, then adjust the guidance or plan settings.",
      });
    }
  }

  // 3. Sample: guidance clarity, if it's a meaningful share.
  const unclear = input.feedback.reasons["unclear-guidance"];
  if (topReason !== "unclear-guidance" && notYes > 0 && unclear / notYes >= 0.2) {
    out.push({
      source: "sample",
      signal: `${unclear} of ${notYes} said guidance wasn't clear.`,
      implication: "Setup instructions may need work. Feedback doesn't say which machines.",
      action: "Review setup guidance with the dealer, starting with machines residents open most, and ask which were confusing.",
    });
  }

  return out.slice(0, 3);
}
