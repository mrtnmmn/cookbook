import Link from "next/link";
import { RecipeFormSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/page-shell";

export default function EditRecipeLoading() {
  return (
    <PageShell>
      <Link
        href="/"
        className="text-sm text-black/60 hover:underline dark:text-white/60"
      >
        &larr; All recipes
      </Link>

      <RecipeFormSkeleton />
    </PageShell>
  );
}

