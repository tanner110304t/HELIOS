"use client";

import Link from "next/link";
import { useResident } from "@/lib/demo/client";
import { planTitle, steps, workoutHref } from "@/lib/demo/resident";
import { buttonClass } from "@/components/ui/Button";

/** "Pick up where you left off" — only when this device has an unfinished plan. */
export function ResumeBanner({ facilityId, facilitySlug }: { facilityId: string; facilitySlug: string }) {
  const { state, hydrated } = useResident(facilityId);
  const plan = state.active;
  if (!hydrated || !plan || plan.completedAt || plan.facilityId !== facilityId) return null;
  const all = steps(plan);
  const finished = all.filter((s) => plan.done.includes(s) || plan.skipped.includes(s)).length;
  return (
    <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-paper">
      <div className="min-w-0">
        <p className="text-[13px] text-paper/65">Pick up where you left off</p>
        <p className="truncate text-[15px] font-semibold">
          {planTitle(plan.request)} · {finished} of {all.length} done
        </p>
      </div>
      <Link href={workoutHref(facilitySlug, plan.request)} className={buttonClass("sun", "md", "shrink-0")}>
        Resume
      </Link>
    </div>
  );
}
