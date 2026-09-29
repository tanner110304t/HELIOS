"use client";

import { useState } from "react";
import { feedbackReasonLabels, type ActivePlan, type FeedbackAnswer, type FeedbackReason } from "@/lib/demo/resident";
import { cn } from "@/lib/cn";

const answers: { value: Exclude<FeedbackAnswer, "skip">; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "somewhat", label: "Somewhat" },
  { value: "no", label: "No" },
];

/**
 * One optional, anonymous question after a completed plan. No names, no
 * health details, no free text. It measures usefulness among people who
 * answer — not how every resident feels.
 */
export function FeedbackPrompt({
  plan,
  onAnswer,
}: {
  plan: ActivePlan;
  onAnswer: (answer: FeedbackAnswer, reasons: FeedbackReason[]) => void;
}) {
  const [pending, setPending] = useState<"somewhat" | "no" | null>(null);
  const [reasons, setReasons] = useState<FeedbackReason[]>([]);

  if (plan.feedback) {
    return (
      <p className="mt-4 rounded-xl bg-paper/10 px-3.5 py-2.5 text-[13px] text-paper/80">
        {plan.feedback.answer === "skip" ? "No problem." : "Thanks — that helps the property team see what's working."}
      </p>
    );
  }

  return (
    <fieldset className="mt-4 rounded-xl bg-paper/10 p-3.5">
      <legend className="float-left w-full text-[15px] font-semibold">Did this plan help you use the gym today?</legend>
      <p className="clear-both pt-0.5 text-xs text-paper/60">Optional and anonymous.</p>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {answers.map((a) => (
          <button
            key={a.value}
            type="button"
            aria-pressed={pending === a.value}
            onClick={() => (a.value === "yes" ? onAnswer("yes", []) : setPending(a.value))}
            className={cn(
              "h-10 rounded-lg text-sm font-medium ring-1 ring-inset ring-paper/25",
              pending === a.value ? "bg-paper text-ink" : "hover:bg-paper/10",
            )}
          >
            {a.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onAnswer("skip", [])}
          className="h-10 rounded-lg text-sm text-paper/60 hover:text-paper"
        >
          Skip
        </button>
      </div>
      {pending && (
        <div className="mt-3">
          <p className="text-[13px] text-paper/80">What got in the way? (optional, pick any)</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(feedbackReasonLabels) as FeedbackReason[]).map((r) => {
              const on = reasons.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setReasons(on ? reasons.filter((x) => x !== r) : [...reasons, r])}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] ring-1 ring-inset ring-paper/25",
                    on ? "bg-sun-glow text-ink ring-sun-glow" : "hover:bg-paper/10",
                  )}
                >
                  {feedbackReasonLabels[r]}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onAnswer(pending, reasons)}
            className="mt-3 h-10 w-full rounded-lg bg-paper text-sm font-semibold text-ink"
          >
            Send
          </button>
        </div>
      )}
    </fieldset>
  );
}
