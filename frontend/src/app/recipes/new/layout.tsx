import type { Metadata } from "next";

/**
 * Metadata for the create view.
 * Resolves to "CookBook - Cooking a new recipe" via the root layout template.
 */
export const metadata: Metadata = {
  title: "Cooking a new recipe",
};

export default function NewRecipeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}


