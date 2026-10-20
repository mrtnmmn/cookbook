import Link from "next/link";
import { Suspense } from "react";
import { getRecipePage, PAGE_SIZE, type RecipePage } from "@/lib/api";
import { RecipeListSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/page-shell";
import { RecipeBrowser } from "@/components/recipe-browser";

async function RecipeList() {
  let page: RecipePage | null = null;
  let error: string | null = null;

  try {
    // First batch only; the browser loads the following ones while scrolling.
    page = await getRecipePage(0, { size: PAGE_SIZE });
  } catch {
    error = "Could not reach the CookBook API. Is the backend running on :8085?";
  }

  if (error || !page) {
    return (
      <>
        <p className="mt-1 h-5 text-sm text-black/60 dark:text-white/60" />
        <p className="mt-10 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      </>
    );
  }

  return <RecipeBrowser initialPage={page} />;
}

export default function Home() {
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

      <Suspense fallback={<RecipeListSkeleton />}>
        <RecipeList />
      </Suspense>
    </PageShell>
  );
}
