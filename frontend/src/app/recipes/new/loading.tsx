import Link from "next/link";
import { RecipeFormSkeleton } from "@/components/skeletons";

export default function NewRecipeLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="text-sm text-black/60 hover:underline dark:text-white/60"
      >
        &larr; All recipes
      </Link>

      <RecipeFormSkeleton />
    </main>
  );
}

