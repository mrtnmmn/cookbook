"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteRecipe } from "@/lib/api";

/**
 * Gear menu for a single recipe: opens a dropdown with destructive actions and
 * guards the delete behind a confirmation modal.
 */
export function RecipeActions({ recipeId }: Readonly<{ recipeId: number }>) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // Escape closes the modal too, unless a delete is in flight.
  useEffect(() => {
    if (!confirmOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) setConfirmOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen, deleting]);

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await deleteRecipe(recipeId);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Recipe options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:border-white/20 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <GearIcon />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-neutral-900"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              router.push(`/recipes/${recipeId}/edit`);
            }}
            className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            Edit recipe
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setError(null);
              setConfirmOpen(true);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
          >
            Delete recipe
          </button>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop: a real button so it is keyboard reachable. */}
          <button
            type="button"
            aria-label="Close dialog"
            disabled={deleting}
            onClick={() => setConfirmOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50"
          />

          <dialog
            open
            aria-labelledby="delete-recipe-title"
            className="relative w-full max-w-sm rounded-xl border border-black/10 bg-white p-6 text-left text-inherit shadow-xl dark:border-white/15 dark:bg-neutral-900"
          >
            <p id="delete-recipe-title" className="text-base font-medium">
              Are you sure you want to delete this recipe?
            </p>

            {error && (
              <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
              >
                No, keep it
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete it"}
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}



