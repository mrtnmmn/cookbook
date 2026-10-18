package com.avalon.CookBook.api.dto;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

/**
 * Input DTO used to create a recipe.
 *
 * <p>Kept deliberately separate from the {@code Recipe} entity so the public API
 * contract can evolve independently of the database schema, and so clients can
 * never set server-owned fields such as {@code id} or {@code createdAt}.</p>
 */
public record CreateRecipeRequest(

        @NotBlank(message = "title is required")
        @Size(max = 200, message = "title must be at most 200 characters")
        String title,

        @Size(max = 5000, message = "description must be at most 5000 characters")
        String description,

        @NotBlank(message = "instructions are required")
        String instructions,

        @Min(value = 1, message = "servings must be at least 1")
        Integer servings,

        @Min(value = 0, message = "prepMinutes cannot be negative")
        Integer prepMinutes,

        @Min(value = 0, message = "cookMinutes cannot be negative")
        Integer cookMinutes,

        List<@NotBlank @Size(max = 50) String> tags,

        /** Free-form nutrition data, stored as JSONB (e.g. {"calories": 520, "protein": 31}). */
        Map<String, Object> nutrition,

        @NotEmpty(message = "at least one ingredient is required")
        List<@Valid IngredientInput> ingredients
) {

    /** A single ingredient line of a recipe. */
    public record IngredientInput(

            @NotBlank(message = "ingredient name is required")
            @Size(max = 150, message = "ingredient name must be at most 150 characters")
            String name,

            @jakarta.validation.constraints.DecimalMin(value = "0.0", inclusive = false,
                    message = "quantity must be greater than 0")
            @jakarta.validation.constraints.Digits(integer = 8, fraction = 2,
                    message = "quantity must have at most 8 integer and 2 fraction digits")
            java.math.BigDecimal quantity,

            @Size(max = 30, message = "unit must be at most 30 characters")
            String unit
    ) {
    }
}

