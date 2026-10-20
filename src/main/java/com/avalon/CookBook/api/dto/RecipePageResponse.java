package com.avalon.CookBook.api.dto;

import java.util.List;

/**
 * One batch of recipes plus the cursor information the client needs to decide
 * whether to request the next one.
 */
public record RecipePageResponse(
        List<RecipeResponse> items,
        int page,
        int size,
        long totalElements,
        boolean hasMore
) {
}

