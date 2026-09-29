import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoFloatingControl } from "@/components/demo/DemoModeBar";
import { getFacilityBySlug, listFacilities } from "@/data/repository";

export const dynamicParams = false;

export function generateStaticParams() {
  return listFacilities().map((f) => ({ facility: f.slug }));
}

export async function generateMetadata({ params }: LayoutProps<"/g/[facility]">): Promise<Metadata> {
  const { facility: slug } = await params;
  const facility = getFacilityBySlug(slug);
  return { title: { default: facility?.name ?? "Facility", template: `%s · ${facility?.name ?? "Helios"}` } };
}

/** Resident experience shell: phone-first column, no presenter UI on phones. */
export default async function FacilityLayout({ children, params }: LayoutProps<"/g/[facility]">) {
  const { facility: slug } = await params;
  if (!getFacilityBySlug(slug)) notFound();
  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-paper md:my-6 md:rounded-[28px] md:shadow-lift md:ring-1 md:ring-line">
        {children}
      </div>
      <DemoFloatingControl />
    </>
  );
}
