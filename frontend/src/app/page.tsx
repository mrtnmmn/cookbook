import Link from "next/link";
import { Suspense } from "react";
import { getRecipes, totalMinutes, type Recipe } from "@/lib/api";
import { RecipeListSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/page-shell";

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const minutes = totalMinutes(recipe);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex h-44 flex-col overflow-hidden rounded-xl border border-black/10 p-5 transition-colors hover:border-black/30 dark:border-white/15 dark:hover:border-white/40"
    >
      <h2 className="line-clamp-1 text-lg font-semibold">{recipe.title}</h2>

      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-black/60 dark:text-white/60">
        {recipe.description ?? ""}
      </p>

      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/60 dark:text-white/60">
        {recipe.servings != null && <span>{recipe.servings} servings</span>}
        {minutes != null && <span>{minutes} min</span>}
        <span>{recipe.ingredients.length} ingredients</span>
      </div>

      <div className="mt-3 flex h-6 flex-nowrap gap-2 overflow-hidden">
        {recipe.tags.map((tag) => (
          <span
            key={tag}
            className="shrink-0 rounded-full bg-black/5 px-2.5 py-0.5 text-xs dark:bg-white/10"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}

async function RecipeList() {
  let recipes: Recipe[] = [];
  let error: string | null = null;

  try {
    recipes = await getRecipes();
  } catch {
    error = "Could not reach the CookBook API. Is the backend running on :8085?";
  }

  if (error) {
    return (
      <>
        <p className="mt-1 h-5 text-sm text-black/60 dark:text-white/60" />
        <p className="mt-10 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      </>
    );
  }

  if (recipes.length === 0) {
    return (
      <>
        <p className="mt-1 h-5 text-sm text-black/60 dark:text-white/60" />
        <p className="mt-10 text-sm text-black/60 dark:text-white/60">
          No recipes yet. Create your first one.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="mt-1 h-5 text-sm text-black/60 dark:text-white/60">
        {recipes.length} recipe{recipes.length === 1 ? "" : "s"}
      </p>
      <div className="mt-10 grid auto-rows-max gap-4 sm:grid-cols-2">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </>
  );
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
