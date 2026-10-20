package com.avalon.CookBook.api.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.avalon.CookBook.api.dto.CreateRecipeRequest;
import com.avalon.CookBook.api.dto.RecipeResponse;
import com.avalon.CookBook.domain.Recipe;
import com.avalon.CookBook.service.RecipeService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    /**
     * Creates a recipe. Returns 201 with a {@code Location} header pointing at the new resource.
     */
    @PostMapping
    public ResponseEntity<RecipeResponse> create(@Valid @RequestBody CreateRecipeRequest request) {
        Recipe created = recipeService.create(request);
        RecipeResponse body = RecipeResponse.from(created);
        return ResponseEntity
                .created(URI.create("/api/recipes/" + created.getId()))
                .body(body);
    }

    /**
     * Lists recipes, optionally filtered by a loose (case-insensitive, partial)
     * match on the title or any tag: {@code GET /api/recipes?q=onion}.
     */
    @GetMapping
    public ResponseEntity<java.util.List<RecipeResponse>> list(
            @RequestParam(name = "q", required = false) String q) {
        return ResponseEntity.ok(recipeService.search(q).stream()
                .map(RecipeResponse::from)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(RecipeResponse.from(recipeService.getById(id)));
    }

    /** Deletes a recipe. Returns 204, or 404 when the id does not exist. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        recipeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Full replacement of an existing recipe. The create DTO is reused so both
     * write endpoints share a single validation contract.
     */
    @PutMapping("/{id}")
    public ResponseEntity<RecipeResponse> update(@PathVariable Long id,
            @Valid @RequestBody CreateRecipeRequest request) {
        return ResponseEntity.ok(RecipeResponse.from(recipeService.update(id, request)));
    }
}

