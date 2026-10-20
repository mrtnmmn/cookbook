package com.avalon.CookBook.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.avalon.CookBook.api.dto.CreateRecipeRequest;
import com.avalon.CookBook.domain.Ingredient;
import com.avalon.CookBook.domain.Recipe;
import com.avalon.CookBook.repository.IngredientRepository;
import com.avalon.CookBook.repository.RecipeRepository;

@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;

    public RecipeService(RecipeRepository recipeRepository, IngredientRepository ingredientRepository) {
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
    }

    /**
     * Persists a new recipe together with its ingredient lines. Ingredients are
     * reused when a row with the same (case-insensitive) name already exists.
     */
    @Transactional
    public Recipe create(CreateRecipeRequest request) {
        Recipe recipe = new Recipe(request.title().trim());
        recipe.setDescription(request.description());
        recipe.setInstructions(request.instructions());
        recipe.setServings(request.servings());
        recipe.setPrepMinutes(request.prepMinutes());
        recipe.setCookMinutes(request.cookMinutes());
        recipe.setTags(request.tags() == null ? List.of() : request.tags().stream().map(String::trim).toList());
        recipe.setNutrition(request.nutrition());

        // Recipe must have an id before the join rows are built (@MapsId).
        Recipe saved = recipeRepository.save(recipe);

        int position = 0;
        for (CreateRecipeRequest.IngredientInput line : request.ingredients()) {
            Ingredient ingredient = resolveIngredient(line.name().trim());
            saved.addIngredient(ingredient, line.quantity(), line.unit(), position++);
        }

        return recipeRepository.save(saved);
    }

    @Transactional(readOnly = true)
    public Recipe getById(Long id) {
        return recipeRepository.findWithIngredientsById(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));
    }

    /**
     * Replaces every field of an existing recipe, including its ingredient lines.
     * The old join rows are flushed before the new ones are added so a line that
     * is kept does not clash with itself on the composite primary key.
     */
    @Transactional
    public Recipe update(Long id, CreateRecipeRequest request) {
        Recipe recipe = recipeRepository.findWithIngredientsById(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));

        recipe.setTitle(request.title().trim());
        recipe.setDescription(request.description());
        recipe.setInstructions(request.instructions());
        recipe.setServings(request.servings());
        recipe.setPrepMinutes(request.prepMinutes());
        recipe.setCookMinutes(request.cookMinutes());
        recipe.setTags(request.tags() == null ? List.of() : request.tags().stream().map(String::trim).toList());
        recipe.setNutrition(request.nutrition());

        recipe.getIngredients().clear();
        recipeRepository.saveAndFlush(recipe);

        int position = 0;
        for (CreateRecipeRequest.IngredientInput line : request.ingredients()) {
            Ingredient ingredient = resolveIngredient(line.name().trim());
            recipe.addIngredient(ingredient, line.quantity(), line.unit(), position++);
        }

        return recipeRepository.save(recipe);
    }

    @Transactional(readOnly = true)
    public List<Recipe> findAll() {
        return recipeRepository.findAll();
    }

    /**
     * Loose title search: every whitespace-separated token must appear somewhere
     * in the title (case-insensitive), so "onion ramen" also finds
     * "Creamy onion ramen". A blank query returns every recipe.
     */
    @Transactional(readOnly = true)
    public List<Recipe> searchByTitle(String query) {
        if (query == null || query.isBlank()) {
            return findAll();
        }

        String[] tokens = query.trim().toLowerCase().split("\\s+");

        // The widest token drives the (indexable) database filter; the rest are
        // applied in memory on the already small result set.
        String broadest = java.util.Arrays.stream(tokens)
                .max(java.util.Comparator.comparingInt(String::length))
                .orElse("");

        return recipeRepository.findByTitleContainingIgnoreCaseOrderByTitleAsc(broadest).stream()
                .filter(recipe -> {
                    String title = recipe.getTitle().toLowerCase();
                    return java.util.Arrays.stream(tokens).allMatch(title::contains);
                })
                .toList();
    }

    /** Deletes a recipe and its ingredient join rows. */
    @Transactional
    public void delete(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));
        recipeRepository.delete(recipe);
    }

    private Ingredient resolveIngredient(String name) {
        return ingredientRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> ingredientRepository.save(new Ingredient(name)));
    }

    /** Thrown when a recipe id does not exist. */
    public static class RecipeNotFoundException extends RuntimeException {
        public RecipeNotFoundException(Long id) {
            super("Recipe %d not found".formatted(id));
        }
    }
}

