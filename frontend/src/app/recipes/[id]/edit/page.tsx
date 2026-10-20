import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getRecipe } from "@/lib/api";
import { PageShell } from "@/components/page-shell";
import { RecipeForm } from "@/components/recipe-form";
import { RecipeFormSkeleton } from "@/components/skeletons";

/** Resolves to "CookBook - Editing <recipe name>" via the root layout template. */
export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id).catch(() => null);

  return { title: recipe ? `Editing ${recipe.title}` : "Recipe not found" };
}

async function EditRecipeForm({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    notFound();
  }

  return (
    <>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Edit recipe</h1>
      <RecipeForm recipe={recipe} />
    </>
  );
}

export default function EditRecipePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  return (
    <PageShell>
      <Link
        href="/"
        className="text-sm text-black/60 hover:underline dark:text-white/60"
      >
        &larr; All recipes
      </Link>

      <Suspense fallback={<RecipeFormSkeleton />}>
        <EditRecipeForm params={params} />
      </Suspense>
    </PageShell>
  );
}

