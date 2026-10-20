"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchRecipes, totalMinutes, type Recipe } from "@/lib/api";

/** Lowercases and strips diacritics so "Jalapeño" matches "jalapeno". */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Loose match: every token of the query must appear in the title or a tag. */
function matches(recipe: Recipe, tokens: string[]): boolean {
  const haystack = normalize(`${recipe.title} ${recipe.tags.join(" ")}`);
  return tokens.every((token) => haystack.includes(token));
}

function RecipeCard({ recipe }: Readonly<{ recipe: Recipe }>) {
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

/**
 * Recipe grid with a search bar matching recipe titles and tags.
 *
 * Typing filters the recipes that are already loaded instantly, and a debounced
 * request then asks the API for further matches, which are appended to the
 * local ones (deduplicated by id).
 */
export function RecipeBrowser({
  initialRecipes,
}: Readonly<{ initialRecipes: Recipe[] }>) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<Recipe[]>([]);
  const [searching, setSearching] = useState(false);

  const tokens = useMemo(
    () => normalize(query).split(/\s+/).filter(Boolean),
    [query],
  );

  // Step 1: instant client-side filter over the already loaded recipes.
  const localMatches = useMemo(
    () =>
      tokens.length === 0
        ? initialRecipes
        : initialRecipes.filter((recipe) => matches(recipe, tokens)),
    [initialRecipes, tokens],
  );

  // Step 2: debounced server search for recipes that are not in that list.
  const requestId = useRef(0);

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      setRemote([]);
      setSearching(false);
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();
    setSearching(true);

    const timer = setTimeout(() => {
      searchRecipes(term, controller.signal)
        .then((results) => {
          if (id === requestId.current) setRemote(results);
        })
        .catch(() => {
          // Aborted or offline: the local matches are still shown.
          if (id === requestId.current) setRemote([]);
        })
        .finally(() => {
          if (id === requestId.current) setSearching(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const recipes = useMemo(() => {
    if (remote.length === 0) return localMatches;

    const seen = new Set(localMatches.map((recipe) => recipe.id));
    return [...localMatches, ...remote.filter((recipe) => !seen.has(recipe.id))];
  }, [localMatches, remote]);

  let status: string;
  if (searching && recipes.length === 0) {
    status = "Searching...";
  } else {
    status = `${recipes.length} recipe${recipes.length === 1 ? "" : "s"}`;
  }

  return (
    <>
      <div className="relative mt-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
        >
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search recipes by title or tag..."
          aria-label="Search recipes by title or tag"
          className="w-full rounded-full border border-black/15 bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
        />
      </div>

      <p className="mt-3 h-5 text-sm text-black/60 dark:text-white/60">
        {status}
      </p>

      {recipes.length === 0 && !searching ? (
        <p className="mt-10 text-sm text-black/60 dark:text-white/60">
          {query.trim()
            ? `No recipes match "${query.trim()}".`
            : "No recipes yet. Create your first one."}
        </p>
      ) : (
        <div className="mt-7 grid auto-rows-max gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

