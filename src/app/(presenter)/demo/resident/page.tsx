import Link from "next/link";
import { QrCode, QrTargetNote } from "@/components/demo/QrCode";
import { IconExternal } from "@/components/ui/icons";
import { DEMO_FACILITY_SLUG, getFacilityBySlug } from "@/data/repository";

export const metadata = { title: "Resident experience" };

const RESIDENT_PATH = `/g/${DEMO_FACILITY_SLUG}`;

/**
 * Presenter view of the resident product: the real resident app running in a
 * phone frame, plus the QR so the person across the table can try it too.
 */
export default function ResidentDemo() {
  const facility = getFacilityBySlug(DEMO_FACILITY_SLUG)!;
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-[minmax(0,1fr)] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:py-14">
      <div className="max-w-md">
        <p className="eyebrow">Resident experience</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.03em]">
          Scan the code on the wall. Get a workout for this room.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-3">
          No app to download, no account, no email. The resident lands on {facility.name} and everything they see is
          built from the equipment installed there.
        </p>

        <ol className="mt-8 space-y-4 text-sm">
          {[
            ["Choose", "Goal, experience, and time available."],
            ["Train", "Every exercise uses equipment that's in the room and working today."],
            ["Swap", "Machine busy? Pick an option that doesn’t need it."],
            ["Report", "Something broken? Tap the machine — Helios attaches the details."],
            ["Track", "Log weights and reps; next visit shows what they used last time. Saved on their phone only."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] text-paper">
                {i + 1}
              </span>
              <span>
                <span className="font-semibold">{t}.</span> <span className="text-ink-3">{d}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex items-center gap-5 rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line shadow-card">
          <QrCode path={RESIDENT_PATH} className="w-28 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Try it on your phone</p>
            <QrTargetNote path={RESIDENT_PATH} />
            <Link
              href={RESIDENT_PATH}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sun-ink hover:underline"
            >
              Open full screen <IconExternal className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Phone frame */}
      <div className="mx-auto w-[390px] max-w-full lg:mx-0">
        <div className="rounded-[46px] bg-ink p-3 shadow-lift">
          <div className="relative overflow-hidden rounded-[36px] bg-paper">
            <div
              aria-hidden
              className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-ink"
            />
            <iframe
              src={RESIDENT_PATH}
              title={`${facility.name} resident experience`}
              className="block h-[760px] max-h-[78vh] w-full pt-8"
            />
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted">Live resident app · interact inside the frame</p>
        <p className="mx-auto mt-1 max-w-[340px] text-center text-xs leading-relaxed text-muted">
          Phones that scan the QR keep their own separate demo data. Reports and feedback filed here in the frame show up
          on the operator dashboard.
        </p>
      </div>
    </main>
  );
}
