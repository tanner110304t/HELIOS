import { DemoModeBar } from "@/components/demo/DemoModeBar";

/** Presenter surfaces (overview, operator, dealer): always show the demo bar. */
export default function PresenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoModeBar />
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Helios discovery demo · Solstice Lofts is a fictional property</span>
          <span>All engagement figures are demo data</span>
        </div>
      </footer>
    </>
  );
}
