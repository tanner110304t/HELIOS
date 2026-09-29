import { cn } from "@/lib/cn";

/**
 * Large, thumb-friendly choice cards. Native radios (or checkboxes when
 * `multiple`) underneath, so it works with keyboard, screen readers, and
 * without JavaScript.
 */
export function ChoiceGroup({
  legend,
  hint,
  name,
  options,
  defaultValue,
  columns = 3,
  required,
  multiple = false,
}: {
  legend: string;
  hint?: string;
  name: string;
  options: { value: string; label: string; hint?: string }[];
  defaultValue?: string;
  columns?: 1 | 3;
  required?: boolean;
  multiple?: boolean;
}) {
  return (
    <fieldset className="mt-7">
      <legend className="mb-2.5 text-[15px] font-semibold tracking-[-0.01em] text-ink">
        {legend}
        {hint && <span className="ml-1.5 text-[13px] font-normal text-muted">{hint}</span>}
      </legend>
      <div className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-1")}>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "relative flex min-h-14 cursor-pointer select-none rounded-2xl bg-surface px-3 ring-1 ring-inset ring-line shadow-card transition",
              "hover:ring-line-strong",
              "has-checked:bg-ink has-checked:text-paper has-checked:ring-ink",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sun",
              columns === 3 ? "flex-col items-center justify-center text-center" : "items-center justify-between gap-3 py-3.5",
            )}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={o.value}
              defaultChecked={o.value === defaultValue}
              required={multiple ? undefined : required}
              className="peer sr-only"
            />
            <span className="text-[15px] font-medium leading-tight">{o.label}</span>
            {o.hint && (
              <span
                className={cn(
                  "text-[13px] leading-snug text-muted peer-checked:text-paper/70",
                  columns === 3 ? "mt-0.5" : "text-right",
                )}
              >
                {o.hint}
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
