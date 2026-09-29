import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { IconArrowLeft } from "@/components/ui/icons";

/** Top of every resident screen: where you are, and a quiet "Powered by Helios". */
export function ResidentHeader({
  facilityName,
  back,
}: {
  facilityName: string;
  back?: { href: string; label: string };
}) {
  return (
    <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
      {back ? (
        <Link
          href={back.href}
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-3 hover:text-ink"
        >
          <IconArrowLeft className="size-4" />
          {back.label}
        </Link>
      ) : (
        <span className="eyebrow truncate">{facilityName}</span>
      )}
      <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted">
        Powered by <Wordmark size="sm" className="!text-[13px]" />
      </span>
    </header>
  );
}

export function ResidentMain({ children }: { children: ReactNode }) {
  return <main className="flex flex-1 flex-col px-5 pb-10">{children}</main>;
}

export function ResidentFooter() {
  return (
    <footer className="px-5 pb-6 pt-2 text-center text-[11px] leading-relaxed text-faint">
      Demo property · Solstice Lofts is fictional
    </footer>
  );
}
