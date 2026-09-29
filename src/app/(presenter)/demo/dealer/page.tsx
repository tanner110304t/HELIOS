import { DealerServiceBrief } from "@/components/demo/DealerServiceBrief";
import { PilotPlanner } from "@/components/demo/PilotPlanner";
import { ServiceReportCount } from "@/components/demo/ServiceReportCount";
import { EquipmentTile } from "@/components/resident/EquipmentGlyph";
import { Badge, DemoDataBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { IconArrowRight, IconBuilding, IconChart, IconPhone } from "@/components/ui/icons";
import {
  DEMO_FACILITY_SLUG,
  getEquipment,
  getExercisesForEquipment,
  getFacilityBySlug,
} from "@/data/repository";
import type { EquipmentKind } from "@/types/domain";

export const metadata = { title: "Dealer view" };

const kindLabel: Record<EquipmentKind, string> = {
  selectorized: "selectorized",
  "plate-loaded": "plate-loaded",
  cable: "dual cable",
  "free-weight": "set",
  bench: "adjustable",
  treadmill: "commercial",
  elliptical: "commercial",
  bike: "commercial",
};

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export default function DealerView() {
  const facility = getFacilityBySlug(DEMO_FACILITY_SLUG)!;
  const equipment = getEquipment(facility.id);
  const units = equipment.reduce((a, e) => a + e.quantity, 0);
  const preview = equipment.slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Dealer view</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.03em]">Your installed facility</h1>
          <p className="mt-1 text-sm text-muted">What Helios adds to an installation you already delivered.</p>
        </div>
        <DemoDataBadge />
      </div>

      {/* Facility */}
      <section className="mt-6 flex flex-col gap-4 rounded-2xl bg-ink p-5 text-paper sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-xl bg-paper/10">
            <IconBuilding className="size-6 text-sun-glow" />
          </span>
          <div>
            <p className="text-lg font-semibold">{facility.propertyName}</p>
            <p className="text-sm text-paper/65">
              {facility.name} · {facility.unitCount} units · {facility.city}
            </p>
          </div>
        </div>
        <p className="text-sm text-paper/65">
          Installed by <span className="text-paper">{facility.installedBy}</span> · {facility.installedOn}
        </p>
      </section>

      {/* Status */}
      <section className="mt-3 grid gap-3 md:grid-cols-3" aria-label="Installation status">
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
          <p className="eyebrow">Equipment</p>
          <p className="tabular mt-3 text-[28px] font-semibold leading-none tracking-[-0.03em]">{equipment.length}</p>
          <p className="mt-2 text-sm text-ink-3">
            equipment entries <span className="text-muted">· {units} units</span>
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
          <p className="eyebrow">Digital experience</p>
          <p className="mt-3 flex items-center gap-2 text-[28px] font-semibold leading-none tracking-[-0.03em]">
            <span className="size-2.5 rounded-full bg-ok" aria-hidden /> Active
          </p>
          <p className="mt-2 text-sm text-ink-3">QR posted in the fitness room</p>
        </div>
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
          <p className="eyebrow">Service connection</p>
          <ServiceReportCount facilityId={facility.id} equipment={equipment} />
        </div>
      </section>

      {/* Two views */}
      <section className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="flex flex-col rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
          <IconPhone className="size-6 text-sun" />
          <p className="mt-4 text-[17px] font-semibold">Resident experience</p>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
            Workouts built from the equipment you installed, machine guidance, one-tap problem reports.
          </p>
          <LinkButton href="/demo/resident" className="mt-5 self-start">
            View What Residents See <IconArrowRight className="size-4" />
          </LinkButton>
        </div>
        <div className="flex flex-col rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
          <IconChart className="size-6 text-sun" />
          <p className="mt-4 text-[17px] font-semibold">Property dashboard</p>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
            Your customer sees engagement, a digital inventory of the room, and issues with machine context.
          </p>
          <LinkButton href="/demo/operator" variant="secondary" className="mt-5 self-start">
            View What Your Customer Sees <IconArrowRight className="size-4" />
          </LinkButton>
        </div>
      </section>

      {/* Install list → digital gym */}
      <section className="mt-10" aria-labelledby="mapping">
        <h2 id="mapping" className="text-lg font-semibold tracking-[-0.01em]">
          From your install list to a digital gym
        </h2>
        <p className="mt-1 text-sm text-muted">
          The equipment list you already have is the input. Helios turns each line into something residents can use.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl bg-surface ring-1 ring-inset ring-line shadow-card">
          <div className="grid grid-cols-[1fr_auto_1.4fr] items-center border-b border-line bg-paper/60 px-4 py-2.5 text-xs text-muted">
            <span>Your install list</span>
            <span className="w-8" />
            <span>In Helios</span>
          </div>
          <ul className="divide-y divide-line">
            {preview.map((e) => (
              <li key={e.id} className="grid grid-cols-[1fr_auto_1.4fr] items-center gap-2 px-4 py-3">
                <span className="font-mono text-[12px] text-ink-3">
                  {e.quantity} × {e.unitName ?? e.name}, {kindLabel[e.kind]}
                </span>
                <IconArrowRight className="size-4 w-8 text-faint" />
                <span className="flex min-w-0 items-center gap-3">
                  <EquipmentTile kind={e.kind} className="hidden size-9 rounded-lg sm:grid" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{e.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {e.category} · {plural(getExercisesForEquipment(e.id).length, "exercise")} · trains{" "}
                      {e.trains.slice(0, 2).join(", ").toLowerCase()}
                    </span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            …and {equipment.length - preview.length} more.{" "}
            <Badge className="ml-1">Today this mapping is prepared by hand for the demo</Badge>
          </p>
        </div>
      </section>

      {/* Who does what */}
      <section className="mt-10" aria-labelledby="handoff">
        <h2 id="handoff" className="text-lg font-semibold tracking-[-0.01em]">
          Who does what in a pilot
        </h2>
        <p className="mt-1 text-sm text-muted">A proposed workflow to discuss — not a service agreement.</p>
        <div className="mt-4 overflow-hidden rounded-2xl bg-surface ring-1 ring-inset ring-line shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-xs text-muted">
                <th scope="col" className="w-40 px-4 py-2.5 font-medium">Party</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Proposed pilot responsibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["Dealer", "Provide the equipment list and confirm model details where relevant. Agree whether existing service arrangements apply."],
                ["Helios", "Prepare the digital room and QR materials, run the pilot software, and do the initial equipment mapping."],
                ["Property team", "Confirm what's actually in the room, promote access to residents, triage reports, and keep equipment status current."],
              ].map(([who, what]) => (
                <tr key={who}>
                  <th scope="row" className="px-4 py-3 align-top font-semibold">{who}</th>
                  <td className="px-4 py-3 text-ink-3">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          No dealer response times, commissions or service obligations are implied. Software captures a problem; it
          doesn&apos;t fix equipment.
        </p>
      </section>

      {/* Service brief */}
      <section className="mt-10" aria-labelledby="brief">
        <h2 id="brief" className="text-lg font-semibold tracking-[-0.01em]">
          What a service request looks like
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          When the property team needs a technician, they copy a brief like this into whatever channel they already
          use with their service provider — email, text, or a work-order system. Helios doesn&apos;t send it anywhere.
        </p>
        <div className="mt-4 max-w-3xl">
          <DealerServiceBrief facility={facility} equipment={equipment} />
        </div>
      </section>

      {/* Pilot */}
      <section className="mt-10" aria-labelledby="pilot">
        <h2 id="pilot" className="text-lg font-semibold tracking-[-0.01em]">
          Plan a one-property pilot
        </h2>
        <p className="mt-1 text-sm text-muted">Tick through it together, then copy or print it for follow-up.</p>
        <div className="mt-4">
          <PilotPlanner propertyName={facility.propertyName} />
        </div>
      </section>
    </main>
  );
}
