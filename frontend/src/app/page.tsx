import Link from "next/link";
import { Suspense } from "react";
import { getRecipes, totalMinutes, type Recipe } from "@/lib/api";

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const minutes = totalMinutes(recipe);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="block rounded-xl border border-black/10 p-5 transition-colors hover:border-black/30 dark:border-white/15 dark:hover:border-white/40"
    >
      <h2 className="text-lg font-semibold">{recipe.title}</h2>

      {recipe.description && (
        <p className="mt-1 line-clamp-2 text-sm text-black/60 dark:text-white/60">
          {recipe.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/60 dark:text-white/60">
        {recipe.servings != null && <span>{recipe.servings} servings</span>}
        {minutes != null && <span>{minutes} min</span>}
        <span>{recipe.ingredients.length} ingredients</span>
      </div>

      {recipe.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs dark:bg-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
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
      <p className="mt-10 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
        {error}
      </p>
    );
  }

  if (recipes.length === 0) {
    return (
      <p className="mt-10 text-sm text-black/60 dark:text-white/60">
        No recipes yet. Create your first one.
      </p>
    );
  }

  return (
    <>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        {recipes.length} recipe{recipes.length === 1 ? "" : "s"}
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </>
  );
}

export default function Home() {
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

      <Suspense
        fallback={
          <p className="mt-10 text-sm text-black/50 dark:text-white/50">
            Loading recipes...
          </p>
        }
      >
        <RecipeList />
      </Suspense>
    </main>
  );
}
