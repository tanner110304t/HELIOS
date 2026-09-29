"use client";

import Link from "next/link";
import { useState } from "react";
import { issueCategories, issueCategoryLabels } from "@/data/demoIssues";
import { cn } from "@/lib/cn";
import { submitIssueReport } from "@/lib/demo/client";
import { reportReference } from "@/lib/demo/state";
import type { Equipment, Facility, IssueCategory } from "@/types/domain";
import { buttonClass } from "@/components/ui/Button";
import { IconBuilding, IconCheck, IconPin, IconTag } from "@/components/ui/icons";
import { EquipmentTile } from "./EquipmentGlyph";

const MAX = 280;

export function ReportForm({ facility, equipment }: { facility: Facility; equipment: Equipment }) {
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [reference, setReference] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || state === "sending" || state === "sent") return;
    setState("sending");
    const { report, saved } = submitIssueReport({
      facilityId: facility.id,
      equipmentId: equipment.id,
      category,
      description,
    });
    if (!saved) {
      setState("failed");
      return;
    }
    setReference(reportReference(report.id));
    setState("sent");
  }

  const context = (
    <div className="rounded-2xl bg-surface ring-1 ring-inset ring-line shadow-card">
      <div className="flex items-center gap-3 p-3.5">
        <EquipmentTile kind={equipment.kind} className="size-12" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-snug">{equipment.name}</p>
          <p className="text-[13px] text-muted">{equipment.category}</p>
        </div>
      </div>
      <dl className="grid gap-1.5 border-t border-line px-3.5 py-3 text-[13px]">
        <div className="flex items-center gap-2">
          <IconBuilding className="size-4 shrink-0 text-faint" />
          <dt className="sr-only">Facility</dt>
          <dd>{facility.name}</dd>
        </div>
        <div className="flex items-center gap-2">
          <IconPin className="size-4 shrink-0 text-faint" />
          <dt className="sr-only">Location</dt>
          <dd>{equipment.location}</dd>
        </div>
        <div className="flex items-center gap-2">
          <IconTag className="size-4 shrink-0 text-faint" />
          <dt className="sr-only">Asset tag</dt>
          <dd className="font-mono text-[12px]">{equipment.assetTag}</dd>
        </div>
      </dl>
    </div>
  );

  if (state === "sent") {
    return (
      <div className="pt-6" aria-live="polite">
        <span className="grid size-14 place-items-center rounded-full bg-ok-soft text-ok">
          <IconCheck className="size-7" />
        </span>
        <h1 className="mt-5 text-[24px] font-semibold leading-[1.2] tracking-[-0.025em]">
          Thanks — your report includes the exact machine and where it is.
        </h1>
        <p className="mt-2 text-sm text-muted">
          Reference <span className="font-mono text-ink-3">{reference}</span> ·{" "}
          {category && issueCategoryLabels[category]}
        </p>
        <p className="mt-2 text-sm text-ink-3">
          Its status shows on the{" "}
          <Link href={`/g/${facility.slug}/equipment/${equipment.slug}`} className="font-medium text-sun-ink underline underline-offset-2">
            {equipment.name} page
          </Link>{" "}
          as the property team works on it.
        </p>
        <p className="mt-3 rounded-xl bg-paper-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-3">
          <span className="font-semibold">Demo:</span> this report is saved in this browser only. No message was sent
          to property staff.
        </p>
        <div className="mt-6">{context}</div>
        <div className="mt-6 grid gap-2">
          <Link href={`/g/${facility.slug}`} className={buttonClass("primary", "lg", "w-full")}>
            Back to workouts
          </Link>
          <Link href={`/g/${facility.slug}/equipment`} className={buttonClass("secondary", "lg", "w-full")}>
            Equipment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="pt-2">
      {state === "failed" && (
        <p role="alert" className="mb-5 rounded-xl bg-down-soft px-3.5 py-3 text-[13px] leading-relaxed text-down">
          <span className="font-semibold">Your report wasn&apos;t saved.</span> This browser blocked saving (private
          browsing can do this). Try again, or tell the front desk about the problem.
        </p>
      )}
      <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.025em]">Report a Problem</h1>
      <p className="mt-1.5 text-sm text-muted">We&apos;ll attach these details for you.</p>

      <div className="mt-5">{context}</div>

      <fieldset className="mt-7">
        <legend className="mb-2.5 text-[15px] font-semibold">What&apos;s wrong?</legend>
        <div className="grid gap-2">
          {issueCategories.map((c) => (
            <label
              key={c}
              className={cn(
                "flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl bg-surface px-4 ring-1 ring-inset ring-line transition",
                "hover:ring-line-strong has-checked:bg-ink has-checked:text-paper has-checked:ring-ink",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sun",
              )}
            >
              <input
                type="radio"
                name="category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "grid size-5 place-items-center rounded-full ring-1 ring-inset",
                  category === c ? "bg-sun ring-sun" : "ring-line-strong",
                )}
              >
                {category === c && <span className="size-2 rounded-full bg-white" />}
              </span>
              <span className="text-[15px] font-medium">{issueCategoryLabels[c]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="description" className="text-[15px] font-semibold">
          Anything else? <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Makes a grinding sound above 6 mph"
          className="mt-2 block w-full resize-none rounded-2xl bg-surface px-4 py-3 text-[15px] ring-1 ring-inset ring-line placeholder:text-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-sun"
        />
        <p className="mt-1 text-right text-[11px] text-faint tabular">
          {description.length}/{MAX}
        </p>
      </div>

      <button
        type="submit"
        disabled={!category || state === "sending"}
        className={buttonClass("primary", "lg", "mt-4 w-full text-base")}
      >
        {state === "sending" ? "Sending…" : "Send Report"}
      </button>
      {!category && <p className="mt-2 text-center text-xs text-muted">Choose what&apos;s wrong to continue.</p>}
    </form>
  );
}
