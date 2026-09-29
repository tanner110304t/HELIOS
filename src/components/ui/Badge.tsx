import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { EquipmentStatus, IssueStatus } from "@/types/domain";
import { IconAlert, IconCheck, IconPause } from "./icons";

type Tone = "neutral" | "sun" | "ok" | "warn" | "down" | "dark";

const tones: Record<Tone, string> = {
  neutral: "bg-paper-2 text-ink-3 ring-line",
  sun: "bg-sun-soft text-sun-ink ring-sun/25",
  ok: "bg-ok-soft text-ok ring-ok/20",
  warn: "bg-warn-soft text-warn ring-warn/20",
  down: "bg-down-soft text-down ring-down/20",
  dark: "bg-ink text-paper ring-ink",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Always visible on fictional numbers. */
export function DemoDataBadge({ className }: { className?: string }) {
  return (
    <Badge tone="sun" className={cn("font-mono uppercase tracking-wider text-[10px]", className)}>
      <span className="size-1.5 rounded-full bg-sun" aria-hidden />
      Demo Data
    </Badge>
  );
}

/** Equipment availability — icon + text, never color alone. */
export function EquipmentStatusBadge({
  status,
  attention = false,
}: {
  status: EquipmentStatus;
  attention?: boolean;
}) {
  if (status === "unavailable")
    return (
      <Badge tone="down">
        <IconPause className="size-3.5" /> Temporarily Unavailable
      </Badge>
    );
  if (attention)
    return (
      <Badge tone="warn">
        <IconAlert className="size-3.5" /> Available · Issue reported
      </Badge>
    );
  return (
    <Badge tone="ok">
      <IconCheck className="size-3.5" /> Available
    </Badge>
  );
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return status === "open" ? (
    <Badge tone="warn">
      <span className="size-1.5 rounded-full bg-warn" aria-hidden /> Open
    </Badge>
  ) : (
    <Badge tone="neutral">
      <IconCheck className="size-3.5" /> Resolved
    </Badge>
  );
}
