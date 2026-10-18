/**
 * Loading placeholders that mirror the real markup of each page so the layout
 * keeps its shape (no content shift) while data is streaming in.
 */

export function Skeleton({
  className = "",
}: Readonly<{ className?: string }>) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded bg-black/10 dark:bg-white/15 ${className}`}
    />
  );
}

/** Announces the loading state to screen readers without showing text. */
function LoadingLabel({ children }: Readonly<{ children: string }>) {
  return <span className="sr-only">{children}</span>;
}

export function RecipeCardSkeleton() {
  return (
    <div className="rounded-xl border border-black/10 p-5 dark:border-white/15">
      {/* title */}
      <Skeleton className="h-6 w-2/3" />

      {/* description (two clamped lines) */}
      <div className="mt-2 space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* meta row */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* tags */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function RecipeListSkeleton({
  count = 6,
}: Readonly<{ count?: number }>) {
  return (
    <div aria-busy="true">
      <LoadingLabel>Loading recipes</LoadingLabel>
      <Skeleton className="mt-1 h-4 w-24" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingLabel>Loading recipe</LoadingLabel>
      {/* title */}
      <Skeleton className="mt-6 h-9 w-3/5" />

      {/* description */}
      <div className="mt-3 space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* servings / prep / cook / total */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>

      {/* ingredients */}
      <section className="mt-10">
        <Skeleton className="h-7 w-36" />
        <ul className="mt-3 divide-y divide-black/10 dark:divide-white/10">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex justify-between py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>
      </section>

      {/* instructions */}
      <section className="mt-10">
        <Skeleton className="h-7 w-32" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton
              key={i}
              className={`h-4 ${i === 4 ? "w-2/5" : "w-full"}`}
            />
          ))}
        </div>
      </section>

      {/* nutrition */}
      <section className="mt-10">
        <Skeleton className="h-7 w-28" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="rounded-lg border border-black/10 p-3 dark:border-white/15"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-4 w-12" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FieldSkeleton({
  inputClass = "h-10",
}: Readonly<{ inputClass?: string }>) {
  return (
    <div>
      <Skeleton className="mb-1 h-4 w-24" />
      <Skeleton className={`${inputClass} w-full rounded-lg`} />
    </div>
  );
}

export function RecipeFormSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingLabel>Loading form</LoadingLabel>
      <Skeleton className="mt-6 h-9 w-56" />

      <div className="mt-8 space-y-6">
        <FieldSkeleton />
        <FieldSkeleton inputClass="h-[66px]" />

        <div className="grid grid-cols-3 gap-4">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>

        <FieldSkeleton />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-28 shrink-0 rounded-lg" />
            <Skeleton className="h-10 w-24 shrink-0 rounded-lg" />
          </div>
        </div>

        <div>
          <Skeleton className="mb-1 h-4 w-28" />
          <Skeleton className="h-[154px] w-full rounded-lg" />
        </div>

        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
    </div>
  );
}

