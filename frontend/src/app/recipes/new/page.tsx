"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRecipe, type CreateRecipeRequest } from "@/lib/api";
import { PageShell } from "@/components/page-shell";

type IngredientRow = { name: string; quantity: string; unit: string };

const emptyRow: IngredientRow = { name: "", quantity: "", unit: "" };

export default function NewRecipePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [servings, setServings] = useState("");
  const [prepMinutes, setPrepMinutes] = useState("");
  const [cookMinutes, setCookMinutes] = useState("");
  const [tags, setTags] = useState("");
  const [rows, setRows] = useState<IngredientRow[]>([{ ...emptyRow }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateRow(index: number, patch: Partial<IngredientRow>) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((current) => [...current, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const payload: CreateRecipeRequest = {
      title,
      description: description || undefined,
      instructions,
      servings: servings ? Number(servings) : undefined,
      prepMinutes: prepMinutes ? Number(prepMinutes) : undefined,
      cookMinutes: cookMinutes ? Number(cookMinutes) : undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      ingredients: rows
        .filter((row) => row.name.trim())
        .map((row) => ({
          name: row.name.trim(),
          quantity: row.quantity ? Number(row.quantity) : undefined,
          unit: row.unit || undefined,
        })),
    };

    try {
      const created = await createRecipe(payload);
      router.push(`/recipes/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full resize-none rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

  return (
    <PageShell>
      <Link
        href="/"
        className="text-sm text-black/60 hover:underline dark:text-white/60"
      >
        &larr; All recipes
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight">New recipe</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Spaghetti Carbonara"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            className={inputClass}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Servings</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Prep (min)</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cook (min)</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={cookMinutes}
              onChange={(e) => setCookMinutes(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Tags <span className="text-black/50 dark:text-white/50">(comma separated)</span>
          </label>
          <input
            className={inputClass}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
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
            {rows.map((row, index) => (
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
                  disabled={rows.length === 1}
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
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={"1. Boil pasta\n2. Fry guanciale"}
          />
        </div>

        {error && (
          <pre className="whitespace-pre-wrap rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </pre>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
        >
          {saving ? "Saving..." : "Save recipe"}
        </button>
      </form>
    </PageShell>
  );
}

