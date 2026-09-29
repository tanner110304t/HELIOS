"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Copies plain text. If the clipboard isn't available, shows the text to copy by hand. */
export function CopyText({ text, label, className }: { text: string; label: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("manual");
    }
  };
  return (
    <>
      <Button variant="ghost" className={className ?? "h-9 px-3 text-[13px] ring-1 ring-inset ring-line"} onClick={copy}>
        {state === "copied" ? "Copied ✓" : label}
      </Button>
      {state === "manual" && (
        <div className="w-full">
          <p className="text-xs text-muted">Couldn&apos;t copy automatically. Select the text below and copy it.</p>
          <textarea
            readOnly
            value={text}
            rows={8}
            aria-label={label}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 w-full rounded-lg bg-paper p-2 font-mono text-[11px] ring-1 ring-inset ring-line"
          />
        </div>
      )}
    </>
  );
}
