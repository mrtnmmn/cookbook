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

    @Transactional(readOnly = true)
    public List<Recipe> findAll() {
        return recipeRepository.findAll();
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

