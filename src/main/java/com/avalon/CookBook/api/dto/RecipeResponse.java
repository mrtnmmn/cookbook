package com.avalon.CookBook.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import com.avalon.CookBook.domain.Recipe;

/**
 * Output DTO returned by the recipe endpoints.
 */
public record RecipeResponse(
        Long id,
        String title,
        String description,
        String instructions,
        Integer servings,
        Integer prepMinutes,
        Integer cookMinutes,
        List<String> tags,
        Map<String, Object> nutrition,
        List<IngredientLine> ingredients,
        Instant createdAt,
        Instant updatedAt
) {

    public record IngredientLine(Long id, String name, BigDecimal quantity, String unit, int position) {
    }

    public static RecipeResponse from(Recipe recipe) {
        List<IngredientLine> lines = recipe.getIngredients().stream()
                .sorted(Comparator.comparingInt(ri -> ri.getPosition()))
                .map(ri -> new IngredientLine(
                        ri.getIngredient().getId(),
                        ri.getIngredient().getName(),
                        ri.getQuantity(),
                        ri.getUnit(),
                        ri.getPosition()))
                .toList();

        return new RecipeResponse(
                recipe.getId(),
                recipe.getTitle(),
                recipe.getDescription(),
                recipe.getInstructions(),
                recipe.getServings(),
                recipe.getPrepMinutes(),
                recipe.getCookMinutes(),
                recipe.getTags(),
                recipe.getNutrition(),
                lines,
                recipe.getCreatedAt(),
                recipe.getUpdatedAt());
    }
}

