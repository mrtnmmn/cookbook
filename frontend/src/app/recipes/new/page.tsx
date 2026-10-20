import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { RecipeForm } from "@/components/recipe-form";

export default function NewRecipePage() {
  return (
    <PageShell>
      <Link
        href="/"
        className="text-sm text-black/60 hover:underline dark:text-white/60"
      >
        &larr; All recipes
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight">New recipe</h1>

      <RecipeForm />
    </PageShell>
  );
}
