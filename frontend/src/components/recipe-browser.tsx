"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getRecipePage,
  totalMinutes,
  type Recipe,
  type RecipePage,
} from "@/lib/api";
import { RecipeCardSkeleton } from "@/components/skeletons";

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

/** Everything that is currently rendered, for one "feed" (browse or search). */
type Feed = {
  /** The query this feed belongs to; "" is the unfiltered landing feed. */
  key: string;
  items: Recipe[];
  /** Index of the batch to load next. */
  nextPage: number;
  hasMore: boolean;
  total: number;
};

function feedFrom(key: string, page: RecipePage): Feed {
  return {
    key,
    items: page.items,
    nextPage: page.page + 1,
    hasMore: page.hasMore,
    total: page.totalElements,
  };
}

/**
 * Recipe grid with batch loading and a title/tag search bar.
 *
 * The first batch is rendered on the server; the next one is fetched right
 * away and kept in a buffer, so when the user scrolls to the bottom sentinel
 * it can be rendered immediately while the batch after it starts loading.
 *
 * Searching filters the already loaded recipes instantly and, after a short
 * debounce, restarts the feed from the server for that query.
 */
export function RecipeBrowser({
  initialPage,
}: Readonly<{ initialPage: RecipePage }>) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [feed, setFeed] = useState<Feed>(() => feedFrom("", initialPage));
  const [loadingMore, setLoadingMore] = useState(false);
  /** Every recipe seen so far, used for the instant local filter. */
  const [seen, setSeen] = useState<Recipe[]>(initialPage.items);

  /** The batch that is already on its way for (key, page). */
  const buffer = useRef<{
    key: string;
    page: number;
    promise: Promise<RecipePage>;
  } | null>(null);
  /** Guards against out-of-order responses when the query changes. */
  const feedId = useRef(0);

  const remember = useCallback((recipes: Recipe[]) => {
    setSeen((current) => dedupe([...current, ...recipes]));
  }, []);

  const prefetch = useCallback((key: string, page: number) => {
    const promise = getRecipePage(page, { query: key });
    // Avoid an unhandled rejection: failures surface when the batch is awaited.
    promise.catch(() => {});
    buffer.current = { key, page, promise };
  }, []);

  /** Returns the buffered batch when it fits, otherwise fetches it. */
  const takeBatch = useCallback((key: string, page: number) => {
    const buffered = buffer.current;
    if (buffered?.key === key && buffered.page === page) {
      buffer.current = null;
      return buffered.promise;
    }
    return getRecipePage(page, { query: key });
  }, []);

  // The first batch is already rendered, so only batch 2 has to be started.
  useEffect(() => {
    if (initialPage.hasMore) prefetch("", initialPage.page + 1);
  }, [initialPage, prefetch]);

  // Debounce the input into the query the feed is built from.
  useEffect(() => {
    const timer = setTimeout(() => setActiveQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Restart the feed whenever the active query changes. Until the first batch
  // of the new feed arrives, feed.key !== activeQuery marks it as loading.
  const feedKey = feed.key;

  useEffect(() => {
    if (activeQuery === feedKey) return;

    const id = ++feedId.current;
    const controller = new AbortController();

    getRecipePage(0, { query: activeQuery, signal: controller.signal })
      .then((page) => {
        if (id !== feedId.current) return;
        remember(page.items);
        setFeed(feedFrom(activeQuery, page));
        if (page.hasMore) prefetch(activeQuery, 1);
      })
      .catch(() => {
        // Keep showing the local matches when the request fails.
      });

    return () => controller.abort();
    // feedKey is only read to detect the switch, not to re-run on every append.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery, prefetch, remember]);

  const switching = activeQuery !== feed.key;
  const busy = switching || loadingMore;

  const loadMore = useCallback(() => {
    if (loadingMore || switching || !feed.hasMore) return;

    const id = feedId.current;
    const { key, nextPage } = feed;
    setLoadingMore(true);

    takeBatch(key, nextPage)
      .then((page) => {
        if (id !== feedId.current) return;
        remember(page.items);
        setFeed((current) =>
          current.key !== key
            ? current
            : {
                ...current,
                items: dedupe([...current.items, ...page.items]),
                nextPage: page.page + 1,
                hasMore: page.hasMore,
                total: page.totalElements,
              },
        );
        // Keep one batch ahead of the user.
        if (page.hasMore) prefetch(key, page.page + 1);
      })
      .catch(() => {})
      .finally(() => {
        if (id === feedId.current) setLoadingMore(false);
      });
  }, [feed, loadingMore, prefetch, remember, switching, takeBatch]);

  // Render the buffered batch as soon as the sentinel scrolls into view.
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      // Start a little before the sentinel is actually visible.
      { rootMargin: "400px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const tokens = useMemo(
    () => normalize(query).split(/\s+/).filter(Boolean),
    [query],
  );

  // While typing, the recipes already in memory are filtered instantly; the
  // server results for the same query are appended once they arrive.
  const recipes = useMemo(() => {
    if (tokens.length === 0) return feed.items;

    const local = seen.filter((recipe) => matches(recipe, tokens));
    const remote = feed.key === activeQuery ? feed.items : [];
    return dedupe([...local, ...remote]);
  }, [activeQuery, feed, seen, tokens]);

  const searching = tokens.length > 0;
  const showSentinel = feed.hasMore && !switching;

  let status: string;
  if (busy && recipes.length === 0) {
    status = "Searching...";
  } else if (!searching && feed.total > recipes.length) {
    status = `${recipes.length} of ${feed.total} recipes`;
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

      {recipes.length === 0 && !busy ? (
        <p className="mt-10 text-sm text-black/60 dark:text-white/60">
          {searching
            ? `No recipes match "${query.trim()}".`
            : "No recipes yet. Create your first one."}
        </p>
      ) : (
        <div className="mt-7 grid auto-rows-max gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}

          {busy &&
            recipes.length > 0 &&
            Array.from({ length: 2 }, (_, i) => (
              <RecipeCardSkeleton key={`loading-${i}`} />
            ))}
        </div>
      )}

      {showSentinel && <div ref={sentinel} aria-hidden="true" className="h-1" />}
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

function dedupe(recipes: Recipe[]): Recipe[] {
  const seen = new Set<number>();
  return recipes.filter((recipe) => {
    if (seen.has(recipe.id)) return false;
    seen.add(recipe.id);
    return true;
  });
}
