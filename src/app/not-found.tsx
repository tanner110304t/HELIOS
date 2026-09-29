import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Wordmark />
      <h1 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">This demo includes one facility: Solstice Lofts Fitness Center.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/g/solstice-lofts" className={buttonClass("primary")}>
          Resident experience
        </Link>
        <Link href="/" className={buttonClass("secondary")}>
          Overview
        </Link>
      </div>
    </main>
  );
}
