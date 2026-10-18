import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getRecipe, totalMinutes } from "@/lib/api";
import { RecipeDetailSkeleton } from "@/components/skeletons";

/** Resolves to "CookBook - <recipe name>" via the root layout template. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id).catch(() => null);

  return { title: recipe?.title ?? "Recipe not found" };
}

async function RecipeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    notFound();
  }

  const minutes = totalMinutes(recipe);
  const nutritionEntries = Object.entries(recipe.nutrition ?? {});

  return (
    <>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">{recipe.title}</h1>

      {recipe.description && (
        <p className="mt-2 text-black/70 dark:text-white/70">
          {recipe.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/60 dark:text-white/60">
        {recipe.servings != null && <span>{recipe.servings} servings</span>}
        {recipe.prepMinutes != null && <span>Prep {recipe.prepMinutes} min</span>}
        {recipe.cookMinutes != null && <span>Cook {recipe.cookMinutes} min</span>}
        {minutes != null && <span>Total {minutes} min</span>}
      </div>

      {recipe.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
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

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Ingredients</h2>
        <ul className="mt-3 divide-y divide-black/10 dark:divide-white/10">
          {recipe.ingredients.map((line) => (
            <li key={line.id} className="flex justify-between py-2 text-sm">
              <span>{line.name}</span>
              <span className="text-black/60 dark:text-white/60">
                {line.quantity ?? ""} {line.unit ?? ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {recipe.instructions && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Instructions</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/80 dark:text-white/80">
            {recipe.instructions}
          </p>
        </section>
      )}

      {nutritionEntries.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Nutrition</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {nutritionEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-black/10 p-3 dark:border-white/15"
              >
                <dt className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                  {key}
                </dt>
                <dd className="mt-1 font-medium">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );
}

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="text-sm text-black/60 hover:underline dark:text-white/60"
      >
        &larr; All recipes
      </Link>

      <Suspense fallback={<RecipeDetailSkeleton />}>
        <RecipeDetail params={params} />
      </Suspense>
    </main>
  );
}
