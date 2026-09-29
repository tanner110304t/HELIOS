import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { QrCode, QrTargetNote } from "@/components/demo/QrCode";
import { LinkButton } from "@/components/ui/Button";
import {
  IconArrowRight,
  IconBuilding,
  IconChart,
  IconList,
  IconPhone,
} from "@/components/ui/icons";
import { getEquipment, getFacilityBySlug, DEMO_FACILITY_SLUG } from "@/data/repository";

const RESIDENT_PATH = `/g/${DEMO_FACILITY_SLUG}`;

export default function MeetingOverview() {
  const facility = getFacilityBySlug(DEMO_FACILITY_SLUG)!;
  const equipment = getEquipment(facility.id);
  const units = equipment.reduce((a, e) => a + e.quantity, 0);

  const steps = [
    {
      n: "01",
      title: "Equipment list",
      body: `The dealer's install list: ${equipment.length} equipment entries, ${units} units at ${facility.propertyName}.`,
      icon: IconList,
    },
    {
      n: "02",
      title: "Digital gym",
      body: "Each piece mapped: what it trains, how to set it up, what it can stand in for.",
      icon: IconBuilding,
    },
    {
      n: "03",
      title: "Resident experience",
      body: "Scan a QR in the room. Get a workout built only from that equipment.",
      icon: IconPhone,
    },
    {
      n: "04",
      title: "Operator visibility",
      body: "Helios engagement, a digital inventory, and issue reports with machine context.",
      icon: IconChart,
    },
  ];

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="grid-backdrop border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <Wordmark size="lg" />
            <p className="eyebrow mt-8">Digital layer for commercial fitness rooms</p>
            <h1 className="mt-3 max-w-2xl text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-5xl">
              Turn the gym you install into a digital experience residents can actually use.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-3">
              Help residents use the gym they already have, and give property teams a clear way to see what helps and
              what needs attention. The dealer builds the physical gym; Helios turns it into a digital one.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/demo/resident" size="lg">
                View Resident Experience <IconArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/demo/operator" variant="secondary" size="lg">
                View Operator Dashboard
              </LinkButton>
            </div>
            <p className="mt-4 text-sm text-muted">
              Or see <Link href="/demo/dealer" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">where the dealer fits</Link>.
            </p>
          </div>

          {/* QR — the "take out your phone" moment */}
          <aside
            aria-label="Try the resident experience on your phone"
            className="rounded-3xl bg-surface p-6 shadow-lift ring-1 ring-line"
          >
            <p className="eyebrow">Scan with your phone</p>
            <p className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.01em]">
              This is what a resident sees when they walk into the gym.
            </p>
            <QrCode path={RESIDENT_PATH} className="mx-auto mt-5 w-full max-w-[240px]" />
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">{facility.name}</p>
              <QrTargetNote path={RESIDENT_PATH} />
            </div>
          </aside>
        </div>
      </section>

      {/* Before / with Helios — the outcome first, the pipeline second */}
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6" aria-labelledby="change">
        <h2 id="change" className="eyebrow">
          What changes in the room
        </h2>
        <div className="mt-5 overflow-hidden rounded-2xl bg-surface ring-1 ring-inset ring-line shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-xs text-muted">
                <th scope="col" className="w-1/5 px-4 py-2.5 font-medium">Moment</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Today</th>
                <th scope="col" className="px-4 py-2.5 font-medium text-ink">With Helios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["A resident walks in", "A room of machines and no guidance", "A plan built from what's in this room, with setup help for each machine"],
                ["The machine they need is taken", "Wait, or improvise", "Pick an alternative that doesn't need that machine"],
                ["Something breaks", "\u201cThe machine is broken\u201d \u2014 which one?", "A report with the machine, asset tag and location already attached"],
                ["The property team wants to know if it's working", "Hearsay, or nothing", "Optional feedback with counts, and a short list of what needs attention"],
              ].map(([moment, today, withHelios]) => (
                <tr key={moment} className="align-top">
                  <th scope="row" className="px-4 py-3 font-semibold">{moment}</th>
                  <td className="px-4 py-3 text-muted">{today}</td>
                  <td className="px-4 py-3 text-ink">{withHelios}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Intended benefits to test in a pilot — not measured results.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            {
              who: "Residents",
              what: "Know what to do with the equipment in this room.",
              href: "/demo/resident",
              cta: "Resident experience",
            },
            {
              who: "Property teams",
              what: "See what residents find useful and which machines need attention.",
              href: "/demo/operator",
              cta: "Operator dashboard",
            },
            {
              who: "Dealers",
              what: "Give customers a more useful installation handoff and clearer equipment reports.",
              href: "/demo/dealer",
              cta: "Dealer view & pilot",
            },
          ].map((v) => (
            <Link
              key={v.who}
              href={v.href}
              className="group flex flex-col rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card transition hover:ring-line-strong"
            >
              <span className="eyebrow">{v.who}</span>
              <span className="mt-2 flex-1 text-[17px] font-semibold leading-snug tracking-[-0.01em]">{v.what}</span>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-sun-ink">
                {v.cta}
                <IconArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="eyebrow">
          How Helios works
        </h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.n} className="relative rounded-2xl bg-surface p-5 ring-1 ring-inset ring-line shadow-card">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-faint">{s.n}</span>
                <s.icon className="size-5 text-sun" />
              </div>
              <h3 className="mt-6 text-[17px] font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
              {i < steps.length - 1 && (
                <IconArrowRight
                  className="absolute -right-[11px] top-1/2 z-10 hidden size-4 -translate-y-1/2 rounded-full bg-paper text-faint lg:block"
                />
              )}
            </li>
          ))}
        </ol>
      </section>

    </main>
  );
}
