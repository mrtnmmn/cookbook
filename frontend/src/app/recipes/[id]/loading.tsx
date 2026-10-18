import Link from "next/link";
import { RecipeDetailSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/page-shell";

export default function RecipeDetailLoading() {
  return (
    <PageShell>
      <Link
        href="/"
        className="text-sm text-black/60 hover:underline dark:text-white/60"
      >
        &larr; All recipes
      </Link>

      <RecipeDetailSkeleton />
    </PageShell>
  );
}
