export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8085";

/** Mirrors RecipeResponse.IngredientLine on the backend. */
export type IngredientLine = {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  position: number;
};

/** Mirrors RecipeResponse on the backend. */
export type Recipe = {
  id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  tags: string[];
  nutrition: Record<string, unknown> | null;
  ingredients: IngredientLine[];
  createdAt: string;
  updatedAt: string;
};

/** Mirrors CreateRecipeRequest on the backend. */
export type CreateRecipeRequest = {
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  tags?: string[];
  nutrition?: Record<string, unknown>;
  ingredients: { name: string; quantity?: number; unit?: string }[];
};

/** RFC 9457 problem response returned by ApiExceptionHandler. */
export type ProblemDetail = {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string>;
};

export async function getRecipes(): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE_URL}/api/recipes`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load recipes (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getRecipe(id: string | number): Promise<Recipe | null> {
  const res = await fetch(`${API_BASE_URL}/api/recipes/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load recipe ${id} (HTTP ${res.status})`);
  }
  return res.json();
}

export async function createRecipe(
  payload: CreateRecipeRequest,
): Promise<Recipe> {
  const res = await fetch(`${API_BASE_URL}/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const problem: ProblemDetail = await res.json().catch(() => ({}));
    const fieldErrors = problem.errors
      ? Object.entries(problem.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join("\n")
      : "";
    throw new Error(
      fieldErrors || problem.detail || `Request failed (HTTP ${res.status})`,
    );
  }

  return res.json();
}

export function totalMinutes(recipe: Recipe): number | null {
  const prep = recipe.prepMinutes ?? 0;
  const cook = recipe.cookMinutes ?? 0;
  const total = prep + cook;
  return total > 0 ? total : null;
}

