package com.avalon.CookBook.service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.avalon.CookBook.api.dto.CreateRecipeRequest;
import com.avalon.CookBook.api.dto.RecipePageResponse;
import com.avalon.CookBook.api.dto.RecipeResponse;
import com.avalon.CookBook.domain.Ingredient;
import com.avalon.CookBook.domain.Recipe;
import com.avalon.CookBook.repository.IngredientRepository;
import com.avalon.CookBook.repository.RecipeRepository;

@Service
public class RecipeService {

    /** Upper bound for a client supplied page size. */
    private static final int MAX_PAGE_SIZE = 100;

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
     * Loose search over title and tags: every whitespace-separated token must
     * appear in either the title or one of the tags (case-insensitive), so
     * "onion ramen" and "asian soup" can both find "Creamy onion ramen".
     * A blank query returns every recipe.
     */
    @Transactional(readOnly = true)
    public List<Recipe> search(String query) {
        if (query == null || query.isBlank()) {
            return findAll();
        }

        return fetchInOrder(matchingIds(query));
    }

    /**
     * One batch of recipes, newest first, optionally filtered by the same loose
     * title/tag search. Used by the landing page to load the grid in chunks.
     */
    @Transactional(readOnly = true)
    public RecipePageResponse page(String query, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        if (query == null || query.isBlank()) {
            Page<Long> idPage = recipeRepository.findIdPage(PageRequest.of(safePage, safeSize));
            return toResponse(fetchInOrder(idPage.getContent()), safePage, safeSize, idPage.getTotalElements());
        }

        // Search matches are filtered in memory, so the matching ids are
        // resolved first and only the requested window is turned into entities.
        List<Long> ids = matchingIds(query);
        int from = Math.min(safePage * safeSize, ids.size());
        int to = Math.min(from + safeSize, ids.size());

        return toResponse(fetchInOrder(ids.subList(from, to)), safePage, safeSize, ids.size());
    }

    private RecipePageResponse toResponse(List<Recipe> recipes, int page, int size, long total) {
        List<RecipeResponse> items = recipes.stream().map(RecipeResponse::from).toList();
        boolean hasMore = (long) page * size + items.size() < total;
        return new RecipePageResponse(items, page, size, total, hasMore);
    }

    /** Ids of every recipe matching the query, newest first. */
    private List<Long> matchingIds(String query) {
        String[] tokens = query.trim().toLowerCase().split("\\s+");

        // The widest token drives the database filter; the remaining tokens are
        // applied in memory on the already narrowed result set.
        String broadest = Arrays.stream(tokens)
                .max(Comparator.comparingInt(String::length))
                .orElse("");

        List<Long> candidateIds = recipeRepository.findIdsMatchingTitleOrTag(broadest);
        if (candidateIds.isEmpty() || tokens.length == 1) {
            return candidateIds;
        }

        return fetchInOrder(candidateIds).stream()
                .filter(recipe -> {
                    String haystack = haystack(recipe);
                    return Arrays.stream(tokens).allMatch(haystack::contains);
                })
                .map(Recipe::getId)
                .toList();
    }

    /** Re-reads ids with the ingredient entity graph, keeping the given order. */
    private List<Recipe> fetchInOrder(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }

        Map<Long, Recipe> byId = recipeRepository.findByIdIn(ids).stream()
                .collect(Collectors.toMap(Recipe::getId, recipe -> recipe));

        return ids.stream().map(byId::get).filter(Objects::nonNull).toList();
    }

    /** Lower-cased title plus tags, used for the in-memory token match. */
    private static String haystack(Recipe recipe) {
        return (recipe.getTitle() + " " + String.join(" ", recipe.getTags())).toLowerCase();
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

