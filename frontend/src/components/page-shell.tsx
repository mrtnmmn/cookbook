/**
 * Fixed-size content frame shared by every page.
 *
 * The frame always has the same width (max-w-4xl) and the same height
 * (viewport minus the outer padding), no matter how much content it holds.
 * Content that does not fit scrolls inside the frame, so the page itself
 * never grows or shrinks and never shifts between routes.
 */
export function PageShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <main className="hide-scrollbar h-[calc(100dvh-6rem)] w-full max-w-4xl overflow-y-auto overscroll-contain">
        {children}
      </main>
    </div>
  );
}


