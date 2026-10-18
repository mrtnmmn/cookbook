import Link from "next/link";
import { RecipeListSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/page-shell";

export default function HomeLoading() {
  return (
    <PageShell>
      <header className="flex h-11 items-center justify-between gap-4">
        <h1 className="truncate text-3xl font-bold tracking-tight">CookBook</h1>
        <Link
          href="/recipes/new"
          className="shrink-0 rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          + New recipe
        </Link>
      </header>

      <RecipeListSkeleton />
    </PageShell>
  );
}
