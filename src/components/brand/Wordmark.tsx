import { cn } from "@/lib/cn";

/** Horizon mark: a low sun on a horizon line. Geometric, quiet, secondary to the wordmark. */
export function HeliosMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const line = tone === "dark" ? "var(--color-ink)" : "var(--color-paper)";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d="M6.5 15a5.5 5.5 0 0 1 11 0z" fill="var(--color-sun)" />
      <path d="M3.5 15a8.5 8.5 0 0 1 17 0" fill="none" stroke={line} strokeOpacity=".3" strokeWidth="1.1" />
      <path d="M2.5 15h19" stroke={line} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({
  className,
  tone = "dark",
  size = "md",
}: {
  className?: string;
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}) {
  const text = { sm: "text-[15px]", md: "text-lg", lg: "text-2xl" }[size];
  const mark = { sm: "size-5", md: "size-6", lg: "size-8" }[size];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold tracking-[-0.02em]",
        tone === "dark" ? "text-ink" : "text-paper",
        text,
        className,
      )}
    >
      <HeliosMark className={mark} tone={tone} />
      Helios
    </span>
  );
}
