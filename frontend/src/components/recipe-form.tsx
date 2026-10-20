"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createRecipe,
  updateRecipe,
  type CreateRecipeRequest,
  type Recipe,
} from "@/lib/api";

type IngredientRow = { name: string; quantity: string; unit: string };

type FormState = {
  title: string;
  description: string;
  instructions: string;
  servings: string;
  prepMinutes: string;
  cookMinutes: string;
  tags: string;
  rows: IngredientRow[];
};

const emptyRow: IngredientRow = { name: "", quantity: "", unit: "" };

const blankForm: FormState = {
  title: "",
  description: "",
  instructions: "",
  servings: "",
  prepMinutes: "",
  cookMinutes: "",
  tags: "",
  rows: [{ ...emptyRow }],
};

/** Maps an existing recipe onto the (string-based) form state. */
function toFormState(recipe: Recipe): FormState {
  return {
    title: recipe.title,
    description: recipe.description ?? "",
    instructions: recipe.instructions ?? "",
    servings: recipe.servings?.toString() ?? "",
    prepMinutes: recipe.prepMinutes?.toString() ?? "",
    cookMinutes: recipe.cookMinutes?.toString() ?? "",
    tags: recipe.tags.join(", "),
    rows:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((line) => ({
            name: line.name,
            quantity: line.quantity?.toString() ?? "",
            unit: line.unit ?? "",
          }))
        : [{ ...emptyRow }],
  };
}

/** Normalised snapshot used to detect whether anything actually changed. */
function fingerprint(form: FormState): string {
  return JSON.stringify({
    ...form,
    title: form.title.trim(),
    description: form.description.trim(),
    instructions: form.instructions.trim(),
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    rows: form.rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        quantity: row.quantity.trim(),
        unit: row.unit.trim(),
      })),
  });
}

function toPayload(form: FormState, recipe?: Recipe): CreateRecipeRequest {
  return {
    title: form.title,
    description: form.description || undefined,
    instructions: form.instructions,
    servings: form.servings ? Number(form.servings) : undefined,
    prepMinutes: form.prepMinutes ? Number(form.prepMinutes) : undefined,
    cookMinutes: form.cookMinutes ? Number(form.cookMinutes) : undefined,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    // Nutrition has no form fields yet, so carry the stored value over on edit.
    nutrition: recipe?.nutrition ?? undefined,
    ingredients: form.rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        quantity: row.quantity ? Number(row.quantity) : undefined,
        unit: row.unit || undefined,
      })),
  };
}

const inputClass =
  "w-full resize-none rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

/**
 * Create/edit form for a recipe.
 *
 * When `recipe` is provided the form starts pre-filled and submits a PUT; the
 * request is skipped entirely when the user has not changed anything.
 */
export function RecipeForm({ recipe }: Readonly<{ recipe?: Recipe }>) {
  const router = useRouter();
  const isEdit = recipe != null;

  const initialForm = useMemo(
    () => (recipe ? toFormState(recipe) : blankForm),
    [recipe],
  );
  const initialFingerprint = useMemo(
    () => fingerprint(initialForm),
    [initialForm],
  );

  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = fingerprint(form) !== initialFingerprint;

  function patch(changes: Partial<FormState>) {
    setForm((current) => ({ ...current, ...changes }));
  }

  function updateRow(index: number, change: Partial<IngredientRow>) {
    setForm((current) => ({
      ...current,
      rows: current.rows.map((row, i) =>
        i === index ? { ...row, ...change } : row,
      ),
    }));
  }

  function addRow() {
    setForm((current) => ({ ...current, rows: [...current.rows, { ...emptyRow }] }));
  }

  function removeRow(index: number) {
    setForm((current) => ({
      ...current,
      rows: current.rows.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Nothing changed: go back without touching the API.
    if (isEdit && !dirty) {
      router.push(`/recipes/${recipe.id}`);
      return;
    }

    setSaving(true);
    const payload = toPayload(form, recipe);

    try {
      const saved = isEdit
        ? await updateRecipe(recipe.id, payload)
        : await createRecipe(payload);
      router.push(`/recipes/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  let submitLabel: string;
  if (saving) {
    submitLabel = "Saving...";
  } else if (isEdit) {
    submitLabel = dirty ? "Save changes" : "No changes";
  } else {
    submitLabel = "Save recipe";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium">Title *</label>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Spaghetti Carbonara"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className={inputClass}
          rows={2}
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Servings</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.servings}
            onChange={(e) => patch({ servings: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Prep (min)</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={form.prepMinutes}
            onChange={(e) => patch({ prepMinutes: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cook (min)</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={form.cookMinutes}
            onChange={(e) => patch({ cookMinutes: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Tags{" "}
          <span className="text-black/50 dark:text-white/50">
            (comma separated)
          </span>
        </label>
        <input
          className={inputClass}
          value={form.tags}
          onChange={(e) => patch({ tags: e.target.value })}
          placeholder="italian, pasta, quick"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">Ingredients *</label>
          <button
            type="button"
            onClick={addRow}
            className="text-sm text-black/60 hover:underline dark:text-white/60"
          >
            + Add ingredient
          </button>
        </div>

        <div className="space-y-2">
          {form.rows.map((row, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Name"
                value={row.name}
                onChange={(e) => updateRow(index, { name: e.target.value })}
              />
              <input
                className={`${inputClass} w-28`}
                type="number"
                step="0.01"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => updateRow(index, { quantity: e.target.value })}
              />
              <input
                className={`${inputClass} w-24`}
                placeholder="Unit"
                value={row.unit}
                onChange={(e) => updateRow(index, { unit: e.target.value })}
              />
              {/* Always rendered so the input widths never change. */}
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={form.rows.length === 1}
                className="w-7 shrink-0 text-black/40 hover:text-black disabled:invisible dark:text-white/40 dark:hover:text-white"
                aria-label="Remove ingredient"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Instructions *</label>
        <textarea
          className={inputClass}
          rows={6}
          value={form.instructions}
          onChange={(e) => patch({ instructions: e.target.value })}
          placeholder={"1. Boil pasta\n2. Fry guanciale"}
        />
      </div>

      {error && (
        <pre className="whitespace-pre-wrap rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </pre>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || (isEdit && !dirty)}
          className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
        >
          {submitLabel}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={() => router.push(`/recipes/${recipe.id}`)}
            disabled={saving}
            className="text-sm text-black/60 hover:underline disabled:opacity-50 dark:text-white/60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

