import { cn } from "@/lib/cn";
import type { EquipmentKind } from "@/types/domain";

/**
 * Original, abstract equipment glyphs (no manufacturer imagery).
 * 48px grid, drawn with currentColor so they sit on any surface.
 */
const paths: Record<EquipmentKind, React.ReactNode> = {
  selectorized: (
    <>
      <rect x="8" y="6" width="9" height="34" rx="1.5" />
      <path d="M10.5 26h4M10.5 29h4M10.5 32h4M10.5 35h4" />
      <path d="M12.5 6V4M17 9h14l4 5" />
      <path d="M26 30h12M30 30v10M26 40h14M33 18v12" />
      <rect x="31" y="14" width="5" height="10" rx="2" />
    </>
  ),
  "plate-loaded": (
    <>
      <path d="M10 4v38M38 4v38M6 42h36" />
      <path d="M4 18h40" />
      <rect x="4" y="13" width="3.5" height="10" rx="1" />
      <rect x="40.5" y="13" width="3.5" height="10" rx="1" />
      <path d="M17 34h14M20 34v8M28 34v8" />
    </>
  ),
  cable: (
    <>
      <path d="M8 4v38M40 4v38M4 42h40" />
      <circle cx="8" cy="12" r="2.2" />
      <circle cx="40" cy="12" r="2.2" />
      <path d="M10 13l10 12M38 13L28 25" />
      <path d="M18 25h4M26 25h4" />
      <path d="M8 30h0M40 30h0" />
    </>
  ),
  "free-weight": (
    <>
      <rect x="6" y="16" width="5" height="16" rx="1.5" />
      <rect x="11" y="19" width="3" height="10" rx="1" />
      <rect x="37" y="16" width="5" height="16" rx="1.5" />
      <rect x="34" y="19" width="3" height="10" rx="1" />
      <path d="M14 24h20" />
    </>
  ),
  bench: (
    <>
      <path d="M6 30h18l14-14" strokeWidth="3.2" />
      <path d="M10 30v12M22 30v12M32 23l4 19M6 42h34" />
    </>
  ),
  treadmill: (
    <>
      <path d="M4 38h30l8-4" />
      <path d="M6 42h30" />
      <path d="M34 38l6-26h4" />
      <rect x="36" y="6" width="9" height="6" rx="1.5" />
      <path d="M8 38v4M30 38v4" />
    </>
  ),
  elliptical: (
    <>
      <ellipse cx="22" cy="34" rx="12" ry="5" />
      <path d="M34 34l4-24M38 10l4-4M38 10l-6-2" />
      <path d="M12 34l-4 8M32 34l4 8M6 42h34" />
      <rect x="36" y="14" width="7" height="5" rx="1.2" />
    </>
  ),
  bike: (
    <>
      <circle cx="30" cy="32" r="8" />
      <path d="M30 32l-12-12h-5M18 20l-4 22M30 32l6-20h5M8 42h34" />
      <rect x="34" y="6" width="8" height="5" rx="1.2" />
      <path d="M14 20h-3" />
    </>
  ),
};

export function EquipmentGlyph({ kind, className }: { kind: EquipmentKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {paths[kind]}
    </svg>
  );
}

export function EquipmentTile({
  kind,
  className,
  dimmed = false,
}: {
  kind: EquipmentKind;
  className?: string;
  dimmed?: boolean;
}) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-xl bg-paper-2 ring-1 ring-inset ring-line",
        dimmed ? "text-faint" : "text-ink-3",
        className,
      )}
    >
      <EquipmentGlyph kind={kind} className="size-[62%]" />
    </span>
  );
}
