import Link from "next/link";
import { RecipeListSkeleton } from "@/components/skeletons";

export default function HomeLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">CookBook</h1>
        <Link
          href="/recipes/new"
          className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          + New recipe
        </Link>
      </header>

      <RecipeListSkeleton />
    </main>
  );
}

